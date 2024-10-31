import { cosmosigPayoutStatus } from "@/cosmosig/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigPayoutStatus(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  let cosmosigRes = await cosmosigPayoutStatus();
  res.status(200).json(cosmosigRes);
  return;
}