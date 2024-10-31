import { cosmosigMain } from "@/cosmosig/server";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function apiCosmosigMain(req: NextApiRequest, res: NextApiResponse) {
  let cosmosigRes = await cosmosigMain();
  res.status(200).json(cosmosigRes);
}
