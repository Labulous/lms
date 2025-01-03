import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "./NewPaymentModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export function PaymentsList() {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);

  // Mock data - replace with API call
  const payments = [
    {
      id: "1",
      date: "2024-01-02",
      client: "Doctor, Test",
      amount: 1900.00,
      method: "Bank Transfer",
      status: "Completed",
    },
  ];

  const handleNewPayment = (paymentData: any) => {
    console.log("New payment data:", paymentData);
    setShowNewPaymentModal(false);
    // TODO: API call to create payment
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Button 
          onClick={() => {
            console.log("Opening new payment modal");
            setShowNewPaymentModal(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Payment
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.date}</TableCell>
              <TableCell>{payment.client}</TableCell>
              <TableCell className="text-right">
                ${payment.amount.toFixed(2)}
              </TableCell>
              <TableCell>{payment.method}</TableCell>
              <TableCell>{payment.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showNewPaymentModal && (
        <NewPaymentModal
          onClose={() => {
            console.log("Closing new payment modal");
            setShowNewPaymentModal(false);
          }}
          onSubmit={handleNewPayment}
        />
      )}
    </div>
  );
}
