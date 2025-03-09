import { cosmosigTransactionStart } from "@/cosmosig/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigUpdate(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { transactionId, gasFees } = req.body;
  let cosmosigRes = await cosmosigTransactionStart(transactionId, gasFees);
  res.status(200).json(cosmosigRes);
}
