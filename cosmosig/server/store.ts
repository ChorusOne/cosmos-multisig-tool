import { gql } from "graphql-request";
import { gqlClient } from "@/graphql";
import { z } from "zod";

export const DbBaseTransactionState = z.enum(["Pending", "InProgress", "Completed"]);

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
export type DbBaseTransactionDraft = Omit<Omit<DbBaseTransaction, "id">, "state">;
export const DbBaseTransactionId = DbBaseTransaction.pick({ id: true });
export type DbBaseTransactionId = Readonly<z.infer<typeof DbBaseTransactionId>>;

export const createBaseTransaction = async (baseTransaction: DbBaseTransactionDraft) => {
  type Response = {
    readonly addBaseTransaction: { readonly baseTransaction: readonly DbBaseTransactionId[] };
  };
  type Variables = DbBaseTransactionDraft;
  const { addBaseTransaction } = await gqlClient.request<Response, Variables>(
    gql`
      mutation CreateBaseTransaction(
        $serialNumber: Int!
        $description: String
        $fromAddress: String!
        $toAddress: String!
        $amount: String!
        $denom: String!
        $chainRegistryName: String!
      ) {
        addBaseTransaction(
          input: {
            serialNumber: $serialNumber
            description: $description
            fromAddress: $fromAddress
            toAddress: $toAddress
            amount: $amount
            denom: $denom
            chainRegistryName: $chainRegistryName
          }
        ) {
          baseTransaction {
            id
          }
        }
      }
    `,
    baseTransaction,
  );

  const createdBaseTransaction = addBaseTransaction.baseTransaction[0];
  DbBaseTransactionId.parse(createdBaseTransaction);

  return createdBaseTransaction.id;
};

// export const getBaseTransactions = async () => {
//   type Response = { readonly queryBaseTransaction: readonly DbBaseTransaction[] };
//   type Variables = {};
//   const { queryBaseTransaction } = await gqlClient.request<Response, Variables>(
//     gql`
//       query GetBaseTransactions {
//         queryBaseTransaction {
//           id
//           state
//           serialNumber
//           description
//           fromAddress
//           toAddress
//           amount
//           denom
//           chainRegistryName
//         }
//       }
//     `,
//     {},
//   )

//   return queryBaseTransaction;
// }
