import { cosmosigList, cosmosigCreate } from "@/cosmosig/server";
import { DbBaseTransactionDraft } from "@/cosmosig/server/store";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigMain(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == "GET") {
    let cosmosigRes = await cosmosigList();
    res.status(200).json(cosmosigRes);
    return;
  }

  const body = req.body;
  console.log(body.txs.length);
  for (let tx of body.txs) {
    tx.state = "Pending";
  }
  let comsosigRes = await cosmosigCreate(body);
  res.status(200).json(comsosigRes);
}
