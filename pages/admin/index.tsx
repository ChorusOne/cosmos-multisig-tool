import getConfig from "next/config";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import axios from "axios";
import Papa from "papaparse";

const { publicRuntimeConfig } = getConfig();
const basePath = publicRuntimeConfig.basePath || "";

interface Transaction {
  id?: string;
  state?: string;
  serialNumber: number;
  description: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  denom: string;
  chainRegistryName: string;
}

interface TransactionStatus {
  res: string;
  baseTx?: Transaction;
  txUrl?: string;
  msg?: string;
}

export default function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [payoutStatus, setPayoutStatus] = useState<Transaction[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [gasFees, setGasFees] = useState<string>("");

  const handleFileUpload = async () => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const transactions: Transaction[] = results.data.map((row: any) => ({
          serialNumber: parseInt(row["Nr."].trim()),
          description: row["Memo"].trim(),
          fromAddress: row["From"].trim(),
          toAddress: row["To"].trim(),
          amount: row["Amount"].trim(),
          denom: row["Denom"].trim(),
          chainRegistryName: row["Chain Registry Name"].trim(),
        }));

        try {
          await axios.post(`${basePath}/api/cosmosig/payout/new`, { txs: transactions });
          alert("Payout initiated successfully");
        } catch (error) {
          alert("Error initiating payout");
        }
      },
      error: () => {
        alert("Error parsing CSV file");
      }
    });
  };

  const fetchPayoutStatus = async () => {
    try {
      const response = await axios.get(`${basePath}/api/cosmosig/payout/status`);
      setPayoutStatus(response.data.baseTransactions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactionStatus = async () => {
    try {
      const response = await axios.get(`${basePath}/api/cosmosig/transaction/status`);
      setTransactionStatus(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const startTransaction = async () => {
    if (!transactionId) return;
    try {
      await axios.post(`${basePath}/api/cosmosig/transaction/start`, { transactionId, gasFees });
      alert("Transaction started");
    } catch (error) {
      alert("Error starting transaction");
    }
  };

  const completeTransaction = async () => {
    try {
      await axios.post(`${basePath}/api/cosmosig/transaction/complete`);
      alert("Transaction completed");
    } catch (error) {
      alert("Error completing transaction");
    }
  };

  useEffect(() => {
    fetchPayoutStatus();
    fetchTransactionStatus();
  }, []);

  return (
    <div className="p-8 space-y-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>

      <Card className="shadow-lg bg-white">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Upload CSV for New Payout</h2>
          <Input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files ? e.target.files[0] : null)} className="border-gray-300 bg-white text-gray-900" />
          <Button onClick={handleFileUpload} className="bg-blue-600 hover:bg-blue-700 text-white">Initiate Payout</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-white">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Payout Status</h2>
          <div className="space-y-2">
            {payoutStatus.map((tx) => (
              <div key={tx.id} className="p-4 rounded bg-gray-100 text-gray-900 border border-gray-300">
                <p><strong>ID:</strong> {tx.id}</p>
                <p><strong>State:</strong> {tx.state}</p>
                <p><strong>Serial Number:</strong> {tx.serialNumber}</p>
                <p><strong>Description:</strong> {tx.description}</p>
                <p><strong>From:</strong> {tx.fromAddress}</p>
                <p><strong>To:</strong> {tx.toAddress}</p>
                <p><strong>Amount:</strong> {tx.amount} {tx.denom}</p>
                <p><strong>Chain:</strong> {tx.chainRegistryName}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-white">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Transaction Management</h2>
          <Input
            placeholder="Enter Transaction ID"
            value={transactionId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTransactionId(e.target.value)}
            className="border-gray-300 bg-white text-gray-900"
          />
          <Input
            placeholder="Enter Gas Fees (Optional)"
            value={gasFees}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setGasFees(e.target.value.trim())}
            className="border-gray-300 bg-white text-gray-900"
          />
          <div className="flex gap-4">
            <Button onClick={startTransaction} className="bg-green-600 hover:bg-green-700 text-white">Start Transaction</Button>
            <Button onClick={completeTransaction} className="bg-red-600 hover:bg-red-700 text-white">Complete Transaction</Button>
          </div>
          <div className="mt-4">
            <h3 className="font-medium text-gray-900">Transaction Status</h3>
            {transactionStatus?.baseTx ? (
              <div className="p-4 bg-gray-100 text-gray-900 border border-gray-300 rounded">
                <p><strong>ID:</strong> {transactionStatus.baseTx.id}</p>
                <p><strong>Amount:</strong> {transactionStatus.baseTx.amount} {transactionStatus.baseTx.denom}</p>
                <p><strong>From:</strong> {transactionStatus.baseTx.fromAddress}</p>
                <p><strong>To:</strong> {transactionStatus.baseTx.toAddress}</p>
                <p><strong>Transaction URL:</strong> <a href={transactionStatus.txUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Transaction</a></p>
              </div>
            ) : (
              <p className="text-gray-500">{transactionStatus?.msg || "No transaction in progress"}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

AdminDashboard.getLayout = function PageLayout(page: React.ReactNode) {
  return <>{page}</>;
};
