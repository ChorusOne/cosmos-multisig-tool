import { cosmosigPayoutNew } from "@/cosmosig/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigPayoutNew(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const body = req.body;
  for (let tx of body.txs) {
    tx.state = "Pending";
  }
  let cosmosigRes = await cosmosigPayoutNew(body);
  res.status(200).json(cosmosigRes);
}