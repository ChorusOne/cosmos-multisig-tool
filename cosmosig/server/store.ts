import { gql } from "graphql-request";
import { gqlClient } from "@/graphql";
import { z } from "zod";

export const DbBaseTransactionState = z.enum(["Pending", "InProgress", "Completed"]);
export type DbBaseTransactionState = z.infer<typeof DbBaseTransactionState>;

export const DbBaseTransaction = z.object({
  id: z.string(),
  state: DbBaseTransactionState,
  serialNumber: z.number(),
  description: z.string().nullish(),
  fromAddress: z.string(),
  toAddress: z.string(),
  amount: z.string(),
  denom: z.string(),
  chainRegistryName: z.string(),
});
export type DbBaseTransaction = Readonly<z.infer<typeof DbBaseTransaction>>;

export const DbBaseTransactionId = DbBaseTransaction.pick({ id: true });
export const DbBaseTransactionIds = z.array(DbBaseTransactionId);
export type DbBaseTransactionId = Readonly<z.infer<typeof DbBaseTransactionId>>;
export type DbBaseTransactionIds = Readonly<z.infer<typeof DbBaseTransactionIds>>;

export const DbBaseTransactionDraft = DbBaseTransaction.omit({ id: true });
export type DbBaseTransactionDraft = Readonly<z.infer<typeof DbBaseTransactionDraft>>;

export const DbBaseTransactionsDraft = z.object({
  txs: z.array(DbBaseTransactionDraft),
});
export type DbBaseTransactionsDraft = Readonly<z.infer<typeof DbBaseTransactionsDraft>>;

export const createBaseTransaction = async (baseTransactions: DbBaseTransactionsDraft) => {
  type Response = {
    readonly addBaseTransaction: { readonly baseTransaction: readonly DbBaseTransactionId[] };
  };
  type Variables = DbBaseTransactionsDraft;

  const { addBaseTransaction } = await gqlClient.request<Response, Variables>(
    gql`
      mutation CreateBaseTransaction($txs: [AddBaseTransactionInput!]!) {
        addBaseTransaction(input: $txs) {
          baseTransaction {
            id
          }
        }
      }
    `,
    baseTransactions,
  );

  const createdBaseTransactions = addBaseTransaction.baseTransaction;
  DbBaseTransactionIds.parse(createdBaseTransactions);

  return createdBaseTransactions;
};

const DbBaseTransactions = z.array(DbBaseTransaction);

export const getBaseTransactions = async () => {
  type Response = { readonly queryBaseTransaction: readonly DbBaseTransaction[] };
  type Variables = {};
  const { queryBaseTransaction } = await gqlClient.request<Response, Variables>(
    gql`
      query GetBaseTransactions {
        queryBaseTransaction {
          id
          state
          serialNumber
          description
          fromAddress
          toAddress
          amount
          denom
          chainRegistryName
        }
      }
    `,
    {},
  );

  DbBaseTransactions.parse(queryBaseTransaction);
  return queryBaseTransaction;
};

const DbBaseTransactionStatePicked = DbBaseTransaction.pick({ state: true });
type DbBaseTransactionStatePicked = Readonly<z.infer<typeof DbBaseTransactionStatePicked>>;

export const updateBaseTransactionState = async (id: string, state: DbBaseTransactionState) => {
  type Response = {
    readonly updateBaseTransaction: {
      readonly baseTransaction: readonly DbBaseTransactionStatePicked[];
    };
  };
  type Variables = { readonly id: string; readonly state: DbBaseTransactionState };

  const { updateBaseTransaction } = await gqlClient.request<Response, Variables>(
    gql`
      mutation UpdateBaseTransactionState($id: [ID!], $state: BaseTransactionState!) {
        updateBaseTransaction(input: { filter: { id: $id }, set: { state: $state } }) {
          baseTransaction {
            state
          }
        }
      }
    `,
    { id, state },
  );

  const updatedBaseTransaction = updateBaseTransaction.baseTransaction[0];
  DbBaseTransactionStatePicked.parse(updatedBaseTransaction);

  return updatedBaseTransaction.state;
};
