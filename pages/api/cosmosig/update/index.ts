import { cosmosigUpdate } from "@/cosmosig/server";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigUpdate(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { transactionId, state } = req.body;
  let cosmosigRes = await cosmosigUpdate(transactionId, state);
  res.status(200).json(cosmosigRes);
}
