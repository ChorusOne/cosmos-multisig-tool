import { getNodeFromArray } from "@/context/ChainsContext/service";
import { DbTransactionParsedDataJson } from "@/graphql";
import { CreateDbTxBody } from "@/lib/api";
import { getChainsFromRegistry } from "@/lib/chainRegistry";
import { displayCoinToBaseCoin } from "@/lib/coinHelpers";
import { requestJson } from "@/lib/request";
import { exportMsgToJson, gasOfTx } from "@/lib/txMsgHelpers";
import { RegistryAsset } from "@/types/chainRegistry";
import { MsgCodecs, MsgTypeUrls } from "@/types/txMsg";

import { Account, MsgSendEncodeObject, StargateClient, calculateFee } from "@cosmjs/stargate";

const CMUI_ENDPOINT = process.env.CMUI_ENDPOINT || "http://localhost:3000";

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
  const { txId }: { txId: string } = await requestJson(`${CMUI_ENDPOINT}/api/transaction`, { body });

  return txId;
};

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
  return `${CMUI_ENDPOINT}/${chain.registryName}/${fromAddress}/transaction/${txId}`;
}

async function main() {
  const txPath = await createSendTx(
    "cosmos18gen42dax4y3efvs5qn39lh55h8wusdym34c8g",
    "cosmos1g0ydm457z9g26dj2e7tl69sf9c7hncvavgx4ww",
    "0.001",
    "atom",
    "Hello, Cosmos! from Multisig",
    "cosmoshubtestnet",
  );

  console.log(txPath);
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
