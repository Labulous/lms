import { useEffect, useState } from "react";
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
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentListItem } from "@/types/supabase";
import { isValid, parseISO, format } from "date-fns";
import { Logger } from "html2canvas/dist/types/core/logger";
import { formatDate } from "@/lib/formatedDate";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";
export function PaymentsList() {
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [paymentsList, setPaymentList] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [labData, setLabData] = useState<{
    labId: string;
    name: string;
  } | null>(null);

  const { user } = useAuth();

  const getPaymentList = async () => {
    setLoading(true);

    try {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }
      setLabData(lab);
      const { data: paymentList, error: paymentListError } = await supabase
        .from("payments")
        .select(
          `
            id,
            payment_date,
            amount,
            payment_method,
            status,
            over_payment,
            remaining_payment,
            clients!client_id ( client_name )
          `
        )
        .eq("lab_id", lab.labId);

      if (paymentListError) {
        console.error("Error fetching products for case:", paymentListError);
        return;
      }

      console.log("paymentList (raw data)", paymentList);

      // Transform the data to align with the expected type
      const transformedPaymentList = paymentList?.map((payment: any) => ({
        ...payment,
        client_name: payment.clients?.client_name, // Directly access client_name
      }));

      setPaymentList(transformedPaymentList as PaymentListItem[]);
    } catch (err) {
      console.error("Error fetching payment list:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleNewPayment = async (paymentData: any) => {
    console.log("New payment data:", paymentData);

    try {
      const {
        updatedInvoices,
        client,
        date,
        paymentMethod,
        paymentAmount,
        overpaymentAmount,
        remainingBalance,
      } = paymentData;

      if (!updatedInvoices || !client) {
        console.error("Missing updatedInvoices or client information.");
        return;
      }

      // Step 1: Update invoices
      for (const invoice of updatedInvoices) {
        const dueAmount = invoice.invoicesData[0]?.due_amount || 0;
        const { id } = invoice.invoicesData[0];
        const status = dueAmount === 0 ? "paid" : "partially_paid";

        const invoiceUpdate = {
          status,
          due_amount: dueAmount,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("invoices")
          .update(invoiceUpdate)
          .eq("id", id)
          .eq("lab_id", labData?.labId);

        if (updateError) {
          throw new Error(
            `Failed to update invoice with ID ${id}: ${updateError.message}`
          );
        }
      }

      console.log("All invoices updated successfully.");

      // Step 2: Insert payment data
      const paymentDataToInsert = {
        client_id: client,
        payment_date: date,
        amount: paymentAmount,
        payment_method: paymentMethod,
        status: "completed",
        over_payment: overpaymentAmount || 0,
        remaining_payment: remainingBalance || 0,
        lab_id: labData?.labId,
      };

      const { data: insertedPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentDataToInsert)
        .select("*");

      if (paymentError) {
        throw new Error(`Failed to insert payment: ${paymentError.message}`);
      }

      console.log("Payment inserted successfully.", insertedPayment);
      await updateBalanceTracking();
    } catch (err) {
      console.error("Error handling new payment:", err);
      toast.error("Failed to add payment or update balance tracking.");
    } finally {
      toast.success("New payment added successfully.");
      getPaymentList();
      setShowNewPaymentModal(false);
    }
  };

  useEffect(() => {
    getPaymentList();
  }, []);

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
            <TableHead className="text-center">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Over Payment</TableHead>
            <TableHead>Remaining Payment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentsList?.map((payment) => {
            console.log(payment, "payment");
            return (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>
                  {payment?.clients?.client_name ?? "hello"}
                </TableCell>
                <TableCell className="text-center">
                  ${payment.amount.toFixed(2)}
                </TableCell>
                <TableCell>{payment.payment_method}</TableCell>
                <TableCell className="text-center">
                  ${payment.over_payment.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  ${payment.remaining_payment.toFixed(2)}
                </TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            );
          })}
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
