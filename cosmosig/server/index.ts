import getConfig from "next/config";

import { getNodeFromArray } from "@/context/ChainsContext/service";
import { DbTransactionParsedDataJson, getTransaction } from "@/graphql";
import { CreateDbTxBody } from "@/lib/api";
import { getChainsFromRegistry } from "@/lib/chainRegistry";
import { displayCoinToBaseCoin } from "@/lib/coinHelpers";
import { requestJson } from "@/lib/request";
import { exportMsgToJson, gasOfTx } from "@/lib/txMsgHelpers";
import { RegistryAsset } from "@/types/chainRegistry";
import { MsgCodecs, MsgTypeUrls } from "@/types/txMsg";

const { publicRuntimeConfig } = getConfig();
const basePath = publicRuntimeConfig.basePath || "";

import {
  createBaseTransaction,
  getBaseTransactions,
  getBaseTransactionById,
  updateBaseTransactionState,
  deleteAllBaseTransactions,
  addTransactionInProgress,
  getFirstTransactionInProgress,
  deleteAllTransactionsInProgress,
} from "./store";

import { Account, MsgSendEncodeObject, StargateClient, calculateFee } from "@cosmjs/stargate";

interface Chain {
  registryName: string;
  chainId: string;
  nodeAddress: string;
  gasPrice: string;
  readonly assets: readonly RegistryAsset[];
}

async function getChainFromRegistryName(registryName: string): Promise<Chain | null> {
  console.log("Getting chains from registry...");

  let chains = await getChainsFromRegistry();
  let chain = chains.mainnets.get(registryName) || chains.testnets.get(registryName);

  if (!chain) return null;

  let nodeAddress = await getNodeFromArray(chain.nodeAddresses);
  return {
    registryName,
    chainId: chain.chainId,
    nodeAddress,
    gasPrice: chain.gasPrice,
    assets: chain.assets,
  };
}

async function getAccountOnChain(accountAddress: string, chain: Chain): Promise<Account | null> {
  console.log("Getting account from chain...");

  let client = await StargateClient.connect(chain.nodeAddress);
  let account = await client.getAccount(accountAddress);

  return account;
}

async function createDbTx(
  creatorAddress: string,
  chainId: string,
  dataJSON: DbTransactionParsedDataJson,
): Promise<string> {
  const body: CreateDbTxBody = { dataJSON, creator: creatorAddress, chainId };
  const { txId }: { txId: string } = await requestJson(
    `${process.env.SERVER_SIDE_BASE_URL}${basePath}/api/transaction`,
    { body },
  );

  return txId;
}

async function createSendTx(
  fromAddress: string,
  toAddress: string,
  amount: string,
  denom: string,
  memo: string,
  chainRegistryName: string,
  gasLimit?: number,
): Promise<string | null> {
  console.log("Creating send transaction...");

  if (!amount || Number(amount) <= 0) {
    console.error("Amount must be greater than 0");
    return null;
  }

  let chain = await getChainFromRegistryName(chainRegistryName);
  if (!chain) return null;

  let accountOnChain = await getAccountOnChain(fromAddress, chain);
  if (!accountOnChain) return null;

  try {
    displayCoinToBaseCoin({ denom, amount }, chain.assets);
  } catch (error) {
    console.error(error);
    return null;
  }

  const microCoin = (() => {
    try {
      if (!denom || !amount || amount === "0") {
        return null;
      }

      return displayCoinToBaseCoin({ denom, amount }, chain.assets);
    } catch (error) {
      console.error(error);
      return null;
    }
  })();

  const msgValue = MsgCodecs[MsgTypeUrls.Send].fromPartial({
    fromAddress,
    toAddress,
    amount: microCoin ? [microCoin] : [],
  });

  const msg: MsgSendEncodeObject = { typeUrl: MsgTypeUrls.Send, value: msgValue };
  const msgs = [exportMsgToJson(msg)];

  const configuredGasLimit = gasLimit || gasOfTx([msg.typeUrl]);

  const txData: DbTransactionParsedDataJson = {
    accountNumber: accountOnChain.accountNumber,
    sequence: accountOnChain.sequence,
    chainId: chain.chainId,
    msgs,
    fee: calculateFee(configuredGasLimit, chain.gasPrice),
    memo,
  };

  const txId = await createDbTx(accountOnChain.address, chain.chainId, txData);
  return txId;
}

export async function cosmosigPayoutNew(transactions: any): Promise<any> {
  await deleteAllTransactionsInProgress();
  await deleteAllBaseTransactions();

  let txIds = await createBaseTransaction(transactions);
  return { res: "success", txIds };
}

export async function cosmosigPayoutStatus(): Promise<any> {
  let baseTransactions = await getBaseTransactions();
  return { res: "success", baseTransactions };
}

export async function cosmosigTransactionComplete(): Promise<any> {
  let transactionInProgress = await getFirstTransactionInProgress();
  if (!transactionInProgress) {
    return { res: "failed", msg: "No transaction in progress" };
  }

  await deleteAllTransactionsInProgress();
  await updateBaseTransactionState(transactionInProgress.baseTransaction.id, "Completed");

  return { res: "success" };
}

export async function cosmosigTransactionStart(baseTransactionId: string): Promise<any> {
  const baseTx = await getBaseTransactionById(baseTransactionId);
  if (!baseTx) {
    return { res: "failed", msg: "Base transaction for the given ID does not exist" };
  }

  const txId = await createSendTx(
    baseTx.fromAddress,
    baseTx.toAddress,
    baseTx.amount,
    baseTx.denom,
    baseTx.description || "",
    baseTx.chainRegistryName,
  );

  if (!txId) {
    return { res: "failed", msg: "Failed to create transaction" };
  }
  
  let addedTipId = await addTransactionInProgress(baseTx.id, txId);
  let currentTip = await getFirstTransactionInProgress();
  if (addedTipId !== currentTip.id) {
    return { res: "failed", msg: "Some other transaction is already in progress" };
  }
  
  await updateBaseTransactionState(baseTx.id, "InProgress");
  
  const txUrl = `${basePath}/${baseTx.chainRegistryName}/${baseTx.fromAddress}/transaction/${txId}`;
  return { res: "success", txUrl };
}

export async function cosmosigTransactionStatus(): Promise<any> {
  let transactionInProgress = await getFirstTransactionInProgress();
  if (!transactionInProgress) {
    return { res: "success", msg: "No transaction in progress" };
  }

  let baseTx = await getBaseTransactionById(transactionInProgress.baseTransaction.id);
  if (!baseTx) {
    return { res: "failed", msg: "Base transaction for the current transaction in progress does not exist" };
  }

  let txUrl = `${basePath}/${baseTx.chainRegistryName}/${baseTx.fromAddress}/transaction/${transactionInProgress.transaction.id}`;
  return { res: "success", baseTx, txUrl };
}