import { cosmosigList, cosmosigCreate } from "@/cosmosig/server";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigRoot(req: NextApiRequest, res: NextApiResponse) {
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
  let cosmosigRes = await cosmosigCreate(body);
  res.status(200).json(cosmosigRes);
}
