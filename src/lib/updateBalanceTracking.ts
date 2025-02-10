import { date } from "zod";
import { supabase } from "./supabase";

// Helper function to calculate days overdue
function calculateDaysOverdue(dueDate: string): number {
  const daysOverdue = Math.floor(
    (new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysOverdue;
}

export async function updateBalanceTracking(client_id?: string) {
  try {
    // Step 1: Fetch all unpaid or partially paid invoices
    // const { data: invoices, error: invoiceError } = await supabase
    //   .from("invoices")
    //   .select("client_id, lab_id, due_date, due_amount, status")
    //   .in("status", ["unpaid", "partially_paid"])
    //   .gt("due_amount", 0);

    let query = supabase
      .from("invoices")
      .select("client_id, lab_id, due_date, due_amount, status")
      .in("status", ["unpaid", "partially_paid"])
      .gt("due_amount", 0);

    if (client_id) {
      query = query.eq("client_id", client_id);
    }

    // Fetch invoices
    const { data: invoices, error: invoiceError } = await query;

    if (invoiceError) {
      throw new Error(`Error fetching invoices: ${invoiceError.message}`);
    }

    // Step 2: Categorize invoices based on their due_date
    const categorizedInvoices = invoices.map((invoice) => {
      const daysOverdue = calculateDaysOverdue(invoice.due_date);

      let period;
      if (daysOverdue <= 30) {
        period = "this_month";
      } else if (daysOverdue <= 60) {
        period = "last_month";
      } else if (daysOverdue <= 90) {
        period = "days_30_plus";
      } else if (daysOverdue <= 120) {
        period = "days_60_plus";
      } else {
        period = "days_90_plus";
      }

      return {
        client_id: invoice.client_id,
        lab_id: invoice.lab_id,
        period,
        due_amount: invoice.due_amount,
      };
    });

    // Step 3: Aggregate balances per client and lab
    const balances: any = {};
    categorizedInvoices.forEach((invoice) => {
      const key = `${invoice.client_id}-${invoice.lab_id}`;
      if (!balances[key]) {
        balances[key] = {
          client_id: invoice.client_id,
          lab_id: invoice.lab_id,
          this_month: 0,
          last_month: 0,
          days_30_plus: 0,
          days_60_plus: 0,
          days_90_plus: 0,
          outstanding_balance: 0,
          total: 0,
        };
      }

      balances[key][invoice.period] += invoice.due_amount;
      balances[key].outstanding_balance += invoice.due_amount;
      balances[key].total += invoice.due_amount;
    });

    // Step 4: Update or insert aggregated balances into the balance_tracking table
    const balanceArray: any = Object.values(balances);

    for (let balance of balanceArray) {
      // Debugging log for balance being processed
      console.log("Balance object to process:", balance);

      balance = { ...balance, updated_at: new Date().toISOString() };

      // First, try to update the record if it exists
      const { data: existingBalance, error: fetchError } = await supabase
        .from("balance_tracking")
        .select()
        .eq("client_id", balance.client_id)
        .eq("lab_id", balance.lab_id)
        .single(); // Fetch only one record

      if (fetchError && fetchError.code !== "PGRST100") {
        // Check if fetch failed with an unexpected error
        throw new Error(
          `Error fetching balance for client ${balance.client_id} and lab ${balance.lab_id}: ${fetchError.message}`
        );
      }

      if (existingBalance) {
        // Record exists, perform update
        const { error: updateError } = await supabase
          .from("balance_tracking")
          .update(balance)
          .eq("client_id", balance.client_id)
          .eq("lab_id", balance.lab_id);

        if (updateError) {
          throw new Error(
            `Error updating balance for client ${balance.client_id}: ${updateError.message}`
          );
        }
        console.log(
          `Updated balance for client ${balance.client_id} and lab ${balance.lab_id}`
        );
      } else {
        // Record doesn't exist, insert a new one
        const { error: insertError } = await supabase
          .from("balance_tracking")
          .insert([balance]);

        if (insertError) {
          throw new Error(
            `Error inserting balance for client ${balance.client_id}: ${insertError.message}`
          );
        }
        console.log(
          `Inserted balance for client ${balance.client_id} and lab ${balance.lab_id}`
        );
      }
    }

    console.log("Balance tracking updated successfully!");
  } catch (error: any) {
    console.error("Error updating balance tracking:", error.message);
    // You can also log the stack for more detailed information
    console.error(error.stack);
  }
}


export async function updateBalanceTracking_new(clientId: string, creditAmount: number) {
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
