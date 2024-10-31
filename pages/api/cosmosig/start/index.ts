import { cosmosigStart } from "@/cosmosig/server";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigUpdate(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { transactionId } = req.body;
  let cosmosigRes = await cosmosigStart(transactionId);
  res.status(200).json(cosmosigRes);
}
