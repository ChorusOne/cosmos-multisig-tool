import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import axios from "axios";

interface Transaction {
  id: string;
  state: string;
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
  msg: string;
}

export default function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [payoutStatus, setPayoutStatus] = useState<Transaction[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/cosmos-multisig-tool/api/cosmosig/payout/new", formData);
      alert("Payout initiated successfully");
    } catch (error) {
      alert("Error initiating payout");
    }
  };

  const fetchPayoutStatus = async () => {
    try {
      const response = await axios.get("/cosmos-multisig-tool/api/cosmosig/payout/status");
      setPayoutStatus(response.data.baseTransactions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactionStatus = async () => {
    try {
      const response = await axios.get("/cosmos-multisig-tool/api/cosmosig/transaction/status");
      setTransactionStatus(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const startTransaction = async () => {
    if (!transactionId) return;
    try {
      await axios.post("/cosmos-multisig-tool/api/cosmosig/transaction/start", { transactionId });
      alert("Transaction started");
    } catch (error) {
      alert("Error starting transaction");
    }
  };

  const completeTransaction = async () => {
    try {
      await axios.post("/cosmos-multisig-tool/api/cosmosig/transaction/complete");
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
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Upload CSV for New Payout</h2>
          <Input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files ? e.target.files[0] : null)} />
          <Button onClick={handleFileUpload}>Initiate Payout</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Payout Status</h2>
          <div className="space-y-2">
            {payoutStatus.map((tx) => (
              <div key={tx.id} className="p-2 rounded bg-gray-100">
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

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Transaction Management</h2>
          <Input
            placeholder="Enter Transaction ID"
            value={transactionId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTransactionId(e.target.value)}
          />
          <Button onClick={startTransaction}>Start Transaction</Button>
          <Button onClick={completeTransaction}>Complete Transaction</Button>
          <div className="mt-4">
            <h3 className="font-medium">Transaction Status</h3>
            {transactionStatus ? (
              <div className="p-2 bg-gray-100 rounded">
                <p><strong>Result:</strong> {transactionStatus.res}</p>
                <p><strong>Message:</strong> {transactionStatus.msg}</p>
              </div>
            ) : (
              <p>No transaction in progress</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

AdminDashboard.getLayout = function PageLayout(page: React.ReactNode) {
    return <>{page}</>; // No layout applied
};
