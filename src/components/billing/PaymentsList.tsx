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
        status: "Completed",
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

      // Step 3: Fetch and categorize invoices for balance tracking
      const { data: categorizedInvoices, error: fetchError } = await supabase
        .from("invoices")
        .select("due_amount, due_date")
        .eq("client_id", client)
        .eq("lab_id", labData?.labId)
        .in("status", ["unpaid", "partially_paid"])
        .gt("due_amount", 0);

      if (fetchError) {
        throw new Error(
          `Failed to fetch categorized invoices: ${fetchError.message}`
        );
      }

      const balances = {
        this_month: 0,
        last_month: 0,
        days_30_plus: 0,
        days_60_plus: 0,
        days_90_plus: 0,
      };

      const currentDate = new Date();

      categorizedInvoices.forEach((invoice) => {
        const dueDate = new Date(invoice.due_date);
        const differenceInDays = Math.floor(
          (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (differenceInDays <= 30) {
          balances.this_month += invoice.due_amount;
        } else if (differenceInDays <= 60) {
          balances.last_month += invoice.due_amount;
        } else if (differenceInDays <= 90) {
          balances.days_30_plus += invoice.due_amount;
        } else if (differenceInDays <= 120) {
          balances.days_60_plus += invoice.due_amount;
        } else {
          balances.days_90_plus += invoice.due_amount;
        }
      });

      // Calculate outstanding_balance as the sum of all balance fields
      const outstandingBalance =
        balances.this_month +
        balances.last_month +
        balances.days_30_plus +
        balances.days_60_plus +
        balances.days_90_plus;

      // Step 4: Check if balance_tracking row exists and update or create it
      const { data: existingBalanceTracking, error: checkError } =
        await supabase
          .from("balance_tracking")
          .select("id")
          .eq("client_id", client)
          .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 indicates no rows found
        throw new Error(
          `Failed to check balance_tracking: ${checkError.message}`
        );
      }

      const balanceUpdate = {
        ...balances,
        outstanding_balance: outstandingBalance,
        credit: overpaymentAmount || 0, // Update credit field
        updated_at: new Date().toISOString(),
        client_id: client,
      };

      if (existingBalanceTracking) {
        // Update existing row
        const { error: updateBalanceError } = await supabase
          .from("balance_tracking")
          .update(balanceUpdate)
          .eq("id", existingBalanceTracking.id);

        if (updateBalanceError) {
          throw new Error(
            `Failed to update balance_tracking: ${updateBalanceError.message}`
          );
        }

        console.log("Balance tracking updated successfully.");
      } else {
        // Insert new row
        const { error: insertBalanceError } = await supabase
          .from("balance_tracking")
          .insert(balanceUpdate);

        if (insertBalanceError) {
          throw new Error(
            `Failed to insert balance_tracking: ${insertBalanceError.message}`
          );
        }

        console.log("Balance tracking created successfully.");
      }
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
