import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AdjustmentList from "@/components/billing/AdjustmentList";
import { NewCreditModal } from "@/components/billing/NewCreditModal";
import { NewDebitModal } from "@/components/billing/NewDebitModal";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";

import {
  Client as ClientItem,
  clientsService,
} from "@/services/clientsService";
interface Invoice {
  id: string;
  amount: number;
  status: string;
  case_id: string;
  due_date: string;
  created_at: string;
  due_amount: number;
}

interface ProductId {
  id: string;
  products_id: string[];
}

interface Client {
  id: string;
  client_name: string;
}

interface Case {
  id: string;
  created_at: string;
  received_date: string;
  status: string;
  patient_name: string;
  case_number: string;
  client: Client;
  invoicesData: Invoice[];
  product_ids: ProductId[];
}

export interface Adjustment {
  id: number;
  created_at: string; // ISO date string
  client: {
    id: string; client_name: string 
};
  lab_id: string;
  credit_amount: number | null; // Nullable in case it's not provided
  debit_amount: number | null; // Nullable in case it's not provided
  description: string;
  payment_date: string; // ISO date string
}
interface Invoice {
  case_number: string;
}

const Adjustments = () => {
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
  const [isNewDebitModalOpen, setIsNewDebitModalOpen] = useState(false);
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  const [isDebitLoading, setIsDebitLoading] = useState(false);

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleCreditSubmit = async (data: any) => {
    if (data.type === "apply") {
      try {
        const {
          updatedInvoices,
          client,
          date,
          paymentMethod,
          paymentAmount,
          overpaymentAmount,
          remainingBalance,
          labId
        } = data;

        if (!updatedInvoices || !client) {
          console.error("Missing updatedInvoices or client information.");
          return;
        }

        const caseNumbers = updatedInvoices.map((inv: Invoice) => inv.case_number).join(",");

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
            .eq("id", id);

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
          amount: overpaymentAmount > 0 ? paymentAmount - overpaymentAmount : paymentAmount,
          payment_method: paymentMethod,
          status: "Completed",
          over_payment: overpaymentAmount || 0,
          remaining_payment: remainingBalance || 0,
          lab_id: data.labId,
        };

        const { error: paymentError } = await supabase
          .from("payments")
          .insert(paymentDataToInsert);



        // Insert a new credit adjustment

        const { error: insertError } = await supabase
          .from("adjustments")
          .insert({
            client_id: client,
            credit_amount: data.paymentAmount,
            description: `Adjustment for the invoice ${caseNumbers}`,
            lab_id: data.labId,
            payment_date: date,
          });


        if (paymentError) {
          throw new Error(`Failed to insert payment: ${paymentError.message}`);
        }

        console.log("Payment inserted successfully.");

        // Call function for balance tracking
        updateBalanceTracking(data.client, overpaymentAmount);

        // Step 3: Fetch and categorize invoices for balance tracking
        const { data: categorizedInvoices, error: fetchError } = await supabase
          .from("invoices")
          .select("due_amount, due_date")
          .eq("client_id", client)
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
            .select("id,credit")
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
          credit: (existingBalanceTracking?.credit ?? 0) + (overpaymentAmount ?? 0),  // Update credit field
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
        setIsNewCreditModalOpen(false);
      }
    } else {
      try {
        setIsCreditLoading(true);
        console.log("Processing credit adjustment:", data);

        const lab = await getLabIdByUserId(user?.id as string);

        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }

        // Ensure payment_date is valid or use a default timestamp
        const paymentDate =
          data.payment_date && !isNaN(Date.parse(data.payment_date))
            ? data.payment_date
            : new Date().toISOString();

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Insert a new credit adjustment
        const { error: insertError } = await supabase
          .from("adjustments")
          .insert({
            client_id: data.client_id,
            credit_amount: data.paymentAmount,
            description: data.description,
            lab_id: lab.labId,
            payment_date: paymentDate,
          });

        if (insertError) {
          throw new Error(
            `Failed to insert adjustment (credit): ${insertError.message}`
          );
        }

        console.log(
          `Inserted new credit adjustment for client_id ${data.client_id}`
        );

        // Call function for balance tracking
        //updateBalanceTracking(data.client_id, data.paymentAmount);

        // Step 3: Fetch and categorize invoices for balance tracking
        const { data: categorizedInvoices, error: fetchError } = await supabase
          .from("invoices")
          .select("due_amount, due_date")
          .eq("client_id", data.client_id)
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
            .select("id,credit")
            .eq("client_id", data.client_id)
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
          credit: (existingBalanceTracking?.credit ?? 0) + (data.paymentAmount ?? 0), // Update credit field
          updated_at: new Date().toISOString(),
          client_id: data.client_id,
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


        toast.success("Credit adjustment processed successfully");
        getAdjustments();
        setIsNewCreditModalOpen(false);
      } catch (error) {
        console.error("Error processing credit adjustment:", error);
        toast.error("Failed to process credit adjustment");
      } finally {
        setIsCreditLoading(false);
      }
    }
  };


  const updateBalanceTracking = async (clientId: string, creditAmount: number) => {
    try {
      // Step 3: Fetch and categorize invoices for balance tracking
      const { data: categorizedInvoices, error: fetchError } = await supabase
        .from("invoices")
        .select("due_amount, due_date")
        .eq("client_id", clientId)
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
          .eq("client_id", clientId)
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
        credit: creditAmount || 0, // Update credit field
        updated_at: new Date().toISOString(),
        client_id: clientId,
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
    } catch (error) {
      console.error("Error updating balance tracking:", error);
      throw error;
    }
  };






  const handleDebitSubmit = async (data: any) => {
    try {
      setIsDebitLoading(true);
      console.log("Processing debit adjustment:", data);

      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      // Ensure payment_date is valid or use a default timestamp
      const paymentDate =
        data.payment_date && !isNaN(Date.parse(data.payment_date))
          ? data.payment_date
          : new Date().toISOString();

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Insert a new debit adjustment
      const { error: insertError } = await supabase.from("adjustments").insert({
        client_id: data.client_id,
        debit_amount: data.amount,
        description: data.description,
        lab_id: lab.labId,
        payment_date: paymentDate,
      });

      if (insertError) {
        throw new Error(
          `Failed to insert adjustment (debit): ${insertError.message}`
        );
      }

      console.log(
        `Inserted new debit adjustment for client_id ${data.client_id}`
      );
      toast.success("Debit adjustment processed successfully");
      setIsNewDebitModalOpen(false);
      getAdjustments();
    } catch (error) {
      console.error("Error processing debit adjustment:", error);
      toast.error("Failed to process debit adjustment");
    } finally {
      setIsDebitLoading(false);
    }
  };

  const getAdjustments = async () => {
    setLoading(true);

    try {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      // Fetch adjustments for the selected client
      const { data: adjustmentsData, error: adjustmentsError } = await supabase
        .from("adjustments")
        .select(
          `
            id,
            created_at,
            client:clients!client_id (client_name),
            lab_id,
            credit_amount,
            debit_amount,
            description,
            payment_date
          `
        )
        .eq("lab_id", lab.labId)
        .order("created_at", { ascending: true });

      if (adjustmentsError) {
        console.error("Error fetching adjustments:", adjustmentsError);
        return;
      }
      const data: any = adjustmentsData;
      console.log(adjustmentsData, "filteredAdjustments");
      // Update the state with the filtered adjustments
      setAdjustments(data); // Assuming `setInvoices` is being reused for adjustments
    } catch (error) {
      console.error("Error fetching adjustments:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getAdjustments();
  }, []);

  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Adjustments</h2>
          <p className="text-sm text-muted-foreground">
            Manage credit and debit adjustments for clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewCreditModalOpen(true)}
            disabled={isCreditLoading}
          >
            {isCreditLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            New Credit
          </Button>
          <Button
            onClick={() => setIsNewDebitModalOpen(true)}
            disabled={isDebitLoading}
          >
            {isDebitLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            New Debit
          </Button>
        </div>
      </div>

      <AdjustmentList adjustments={adjustments} />

      {isNewCreditModalOpen && (
        <NewCreditModal
          onClose={() => setIsNewCreditModalOpen(false)}
          onSubmit={handleCreditSubmit}
        />
      )}

      {isNewDebitModalOpen && (
        <NewDebitModal
          onClose={() => setIsNewDebitModalOpen(false)}
          onSubmit={handleDebitSubmit}
        />
      )}
    </main>
  );
};

export default Adjustments;
