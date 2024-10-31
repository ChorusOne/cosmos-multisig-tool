#!/usr/bin/env python3
import os

import csv
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

def createTransactions(transactions):
  response = requests.post(COSMOSIG_API_ENDPOINT, json={"txs": transactions})
  print(response.json())

def updateTransaction(transactionId, state):
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/update", json={
    "transactionId": transactionId,
    "state": state,
  })
  print(response.json())

def startTransaction(transactionId):
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/start", json={
    "transactionId": transactionId,
  })
  print(response.json())

def deleteAllTransactions():
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/deleteAll")
  print(response.json())

def readTransactionsFromCSV(file_path):
  transactions = []
  with open(file_path, mode="r") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
      transactions.append({
        "serialNumber": int(row["Nr."].strip()),
        "description": row["Memo"].strip(),
        "fromAddress": row["From"].strip(),
        "toAddress": row["To"].strip(),
        "amount": row["Amount"].strip(),
        "denom": row["Denom"].strip(),
        "chainRegistryName": row["Chain Registry Name"].strip()
      })
  return transactions

if __name__ == "__main__":
  # file_path = "payout.sample.csv"
  # transactions = readTransactionsFromCSV(file_path)
  # createTransactions(transactions)

  # listTransactions()

  startTransaction("0xf")
  # deleteAllTransactions()
  # listTransactions()
  # listTransactions()

