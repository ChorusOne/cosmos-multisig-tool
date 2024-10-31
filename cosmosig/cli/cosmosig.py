#!/usr/bin/env python3
import os

import argparse
import csv
import requests

CMUI_ENDPOINT = os.getenv("CMUI_ENDPOINT", "http://localhost:3000")
COSMOSIG_API_ENDPOINT = f"{CMUI_ENDPOINT}/api/cosmosig"

def readTransactionsFromCSV(filePath):
  transactions = []
  with open(filePath, mode="r") as csvfile:
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

def payoutNew(csvFilePath):
  transactions = readTransactionsFromCSV(csvFilePath)
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/payout/new", json={"txs": transactions})
  print(response.json())

def payoutStatus():
  response = requests.get(f"{COSMOSIG_API_ENDPOINT}/payout/status")
  txs = response.json().get("baseTransactions", [])
  for tx in txs:
    print("---")
    for k,v in tx.items():
      print(f"{k}: {v}")

def transactionComplete():
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/transaction/complete")
  print(response.json())

def transactionStart(transactionId):
  response = requests.post(f"{COSMOSIG_API_ENDPOINT}/transaction/start", json={
    "transactionId": transactionId,
  })
  print(response.json())

def transactionStatus():
  response = requests.get(f"{COSMOSIG_API_ENDPOINT}/transaction/status")
  print(response.json())

def main():
  parser = argparse.ArgumentParser(description="CLI for transaction management")
  subparsers = parser.add_subparsers(dest="command", help="Available commands")

  # Payout subcommand
  parser_payout = subparsers.add_parser("payout", help="Payout-related actions")
  payout_subparsers = parser_payout.add_subparsers(dest="payout_command", help="Payout commands")

  parser_payout_new = payout_subparsers.add_parser("new", help="Initiate a new payout")
  parser_payout_new.add_argument("csvFilePath", type=str, help="Path to CSV file with transactions")

  parser_payout_status = payout_subparsers.add_parser("status", help="Check payout status")

  # Transaction subcommand
  parser_transaction = subparsers.add_parser("transaction", help="Transaction-related actions")
  transaction_subparsers = parser_transaction.add_subparsers(dest="transaction_command", help="Transaction commands")

  parser_transaction_start = transaction_subparsers.add_parser("start", help="Start a transaction")
  parser_transaction_start.add_argument("transactionId", type=str, help="Transaction ID to start")

  parser_transaction_complete = transaction_subparsers.add_parser("complete", help="Mark transaction as complete")
  parser_transaction_status = transaction_subparsers.add_parser("status", help="Check transaction status")

  args = parser.parse_args()

  if args.command == "payout":
    if args.payout_command == "new":
      payoutNew(args.csvFilePath)
    elif args.payout_command == "status":
      payoutStatus()

  elif args.command == "transaction":
    if args.transaction_command == "start":
      transactionStart(args.transactionId)
    elif args.transaction_command == "complete":
      transactionComplete()
    elif args.transaction_command == "status":
      transactionStatus()
  else:
    parser.print_help()

if __name__ == "__main__":
  main()