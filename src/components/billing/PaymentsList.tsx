import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "./NewPaymentModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { InvoiceItem } from "@/data/mockInvoicesData";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export function PaymentsList() {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);

  // Mock data - replace with API call
  const payments = [
    {
      id: "1",
      date: "2024-01-02",
      client: "Doctor, Test",
      amount: 1900.0,
      method: "Bank Transfer",
      status: "Completed",
    },
  ];

  const handleNewPayment = async (paymentData: any) => {
    console.log("New payment data:", paymentData);

    try {
      // Extract updated invoices and client ID from payment data
      const {
        updatedInvoices,
        client,
        date,
        paymentMethod,
        memo,
        paymentAmount,
        selectedInvoices,
        paymentAllocation,
        overpaymentAmount,
        remainingBalance,
      } = paymentData;

      if (!updatedInvoices || !client) {
        console.error(
          "Missing updatedInvoices, client, or paymentDetails information."
        );
        return;
      }

      // Loop over each invoice and update it based on its ID
      for (const invoice of updatedInvoices) {
        const dueAmount = invoice.invoicesData[0]?.due_amount || 0;
        const { id } = invoice.invoicesData[0];
        const status = dueAmount === 0 ? "Paid" : "Partial_Paid";

        const invoiceUpdate = {
          status,
          due_amount: dueAmount,
          updated_at: new Date().toISOString(),
        };

        // Update each invoice individually
        const { data: updatedInvoice, error: updateError } = await supabase
          .from("invoices")
          .update(invoiceUpdate)
          .eq("id", id);

        if (updateError) {
          throw new Error(
            `Failed to update invoice with ID ${id}: ${updateError.message}`
          );
        }

        console.log(
          `Invoice with ID ${id} updated successfully:`,
          updatedInvoice
        );
      }

      console.log("All invoices updated successfully.");

      // Insert payment data into the payments table
      const paymentDataToInsert: any = {
        client_id: client,
        payment_date: date, // Current timestamp
        amount: paymentAmount, // Total amount paid
        payment_method: paymentMethod, // Payment method (e.g., "Credit Card", "Bank Transfer")
        status: "Completed", // Assuming the payment is completed
        over_payment: overpaymentAmount || 0, // Amount overpaid
        remaining_payment: remainingBalance || 0, // Remaining payment amount
      };

      const { data: paymentApiData, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentDataToInsert);

      if (paymentError) {
        throw new Error(`Failed to insert payment: ${paymentError.message}`);
      }

      console.log("Payment inserted successfully:", paymentApiData);

      // Update the balance_tracking table
      const balanceTrackingUpdate = {
        client_id: client,
        credit: overpaymentAmount || 0, // Insert overpayment amount as credit
        updated_at: new Date().toISOString(), // Track the timestamp
      };

      // Uncomment to use the balance_tracking update logic
      // const { data: balanceTrackingData, error: balanceTrackingError } =
      //   await supabase.from("balance_tracking").insert(balanceTrackingUpdate);

      // if (balanceTrackingError) {
      //   throw new Error(
      //     `Failed to update balance_tracking: ${balanceTrackingError.message}`
      //   );
      // }

      // console.log(
      //   "Balance tracking updated successfully:",
      //   balanceTrackingData
      // );
    } catch (err) {
      console.error("Error handling new payment:", err);
      toast.error("Failed to add payment or update balance tracking.");
    } finally {
      toast.success("New payment added successfully.");
      setShowNewPaymentModal(false);
    }
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
