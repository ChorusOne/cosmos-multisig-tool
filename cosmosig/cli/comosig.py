#!/usr/bin/env python3

import os
import requests

CMUI_ENDPOINT = os.getenv("CMUI_ENDPOINT", "http://localhost:3000")
COSMOSIG_API_ENDPOINT = f"{CMUI_ENDPOINT}/api/cosmosig"

def listTransactions():
  response = requests.get(COSMOSIG_API_ENDPOINT)
  txs = response.json().get("baseTransactions", [])
  for tx in txs:
    print("---")
    for k,v in tx.items():
      print(f"{k}: {v}")

def createTransaction(baseTransaction):
  response = requests.post(COSMOSIG_API_ENDPOINT, json=baseTransaction)
  print(response.json())

if __name__ == "__main__":
  createTransaction({"txs": [{
    "serialNumber": 4,
    "description": "Hello, Cosmos! from Cosmosig Python CLI",
    "fromAddress": "cosmos18gen42dax4y3efvs5qn39lh55h8wusdym34c8d",
    "toAddress": "cosmos1g0ydm457z9g26dj2e7tl69sf9c7hncvavgx4ww",
    "amount": "0.001",
    "denom": "atom",
    "chainRegistryName": "cosmoshubtestnet",
  }]})

  # listTransactions()

