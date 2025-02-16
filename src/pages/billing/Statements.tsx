import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StatementList from "@/components/billing/StatementList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateStatementModal } from "@/components/billing/CreateStatementModal";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { clientsService } from "@/services/clientsService";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { updateBalanceTracking } from "@/lib/updateBalanceTracking";

export interface BalanceSummary {
  creditBalance: number;
  days30Plus: number;
  days60Plus: number;
  days90Plus: number;
  lastMonth: number;
  outstandingBalance: number;
  thisMonth: number;
  totalItems: number;
}

const Statements = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [monthStatement, setMonthStatement] = useState<any>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStatements = async () => {
    setIsLoading(true);
    setRefresh(false);

    console.log("use effect running!!!");
    try {
      // Get the lab ID associated with the current user
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      // Fetch statements filtered by lab_id and client_id
      const { data: statementsData, error: statementsError } = await supabase
        .from("statements")
        .select(
          `
            id,
            created_at,
            updated_at,
            client:clients!client_id (client_name),
            statement_number,
            amount,
            outstanding,
            last_sent
          `
        )
        .eq("lab_id", lab.labId)
        .order("updated_at", { ascending: true });

      if (statementsError) {
        console.error("Error fetching statements:", statementsError);
        return;
      }
      console.log(statementsData, "statementsData", statementsError);
      setMonthStatement(statementsData || []);
    } catch (error) {
      console.error("Error fetching statements:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateStatement = async (data: any) => {
    try {
      setIsLoading(true);

      // Extract month, year, and client_id from input
      const [month, year, client_id] = data.month
        .split(",")
        .map((item: string, index: number) =>
          index < 2 ? parseInt(item.trim(), 10) : item.trim()
        );

      // Ensure UTC format for date filtering
      const startDate = moment
        .utc(`${year}-${String(month).padStart(2, "0")}-01`)
        .format("YYYY-MM-DDTHH:mm:ss[Z]");
      const endDate = moment
        .utc(startDate)
        .add(1, "month")
        .format("YYYY-MM-DDTHH:mm:ss[Z]");

      console.log("Start Date (UTC):", startDate);
      console.log("End Date (UTC):", endDate);

      // Get lab ID for the current user
      const lab = await getLabIdByUserId(user?.id as string);
      if (!lab?.labId) {
        console.error("Lab ID not found.");
        throw new Error("Lab ID is required to create statements.");
      }

      // Fetch invoices for the specified month
      let query = supabase
        .from("invoices")
        .select(
          "id, due_amount, due_date, amount, status, updated_at, client:clients!client_id (client_name, id)"
        )
        .in("status", ["unpaid", "partially_paid"])
        .not("amount", "is", null)
        .eq("lab_id", lab.labId)
        .gte("created_at", startDate) // Start of the selected month
        .lt("created_at", endDate); // Start of the next month

      if (client_id) {
        query = query.eq("client_id", client_id);
      }
      console.log(startDate, endDate, "date");
      const { data: categorizedInvoices, error: fetchError } = await query;
      console.log(categorizedInvoices, "categorizedInvoices");
      if (fetchError) {
        throw new Error(`Failed to fetch invoices: ${fetchError.message}`);
      }
      if (!categorizedInvoices || categorizedInvoices.length === 0) {
        toast.error("No invoices found for the selected month.");
        return;
      }

      // Generate client statements
      const statementSummary = categorizedInvoices.reduce(
        (acc: any[], invoice: any) => {
          const { client, amount, due_amount, updated_at, id } = invoice;
          const clientId = client.id;

          let existingClient = acc.find((item) => item.client_id === clientId);

          if (existingClient) {
            existingClient.total_amount =
              (existingClient.total_amount || 0) + (amount || 0);
            existingClient.total_due =
              (existingClient.total_due || 0) + (due_amount || 0);

            const prevLastSent = existingClient.last_sent
              ? new Date(existingClient.last_sent)
              : new Date(0);
            const newLastSent = updated_at ? new Date(updated_at) : new Date(0);

            if (newLastSent > prevLastSent) {
              existingClient.last_sent = updated_at;
            }
          } else {
            acc.push({
              client_id: clientId,
              total_amount: amount || 0,
              total_due: due_amount || 0,
              id: id,
              last_sent: updated_at || null,
            });
          }

          return acc;
        },
        []
      );

      let updateCount = 0;
      let insertCount = 0;

      // Insert or Update statements in the database
      for (const statement of statementSummary) {
        const { client_id, total_amount, total_due, last_sent } = statement;

        const clientData = await clientsService.getClientById(client_id);
        if (clientData) {
          const today = moment.utc();
          const statementNumber = `${today.format("YYYYMMDD")}${
            clientData?.accountNumber
          }`;

          // Check if a statement exists for the current client, lab, and month
          const { data: existingStatement, error: checkError } = await supabase
            .from("statements")
            .select("id")
            .eq("client_id", client_id)
            .eq("lab_id", lab.labId)
            .gte("updated_at", startDate)
            .lt("updated_at", endDate)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            throw new Error(
              `Failed to check existing statement: ${checkError.message}`
            );
          }

          if (existingStatement) {
            const { error: updateError } = await supabase
              .from("statements")
              .update({
                amount: total_amount,
                outstanding: total_due,
                last_sent: moment.utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
                statement_number: statementNumber,
                updated_at: moment.utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
              })
              .eq("id", existingStatement.id);

            if (updateError) {
              throw new Error(
                `Failed to update statement: ${updateError.message}`
              );
            }

            updateCount++;
          } else {
            const { error: insertError } = await supabase
              .from("statements")
              .insert({
                lab_id: lab.labId,
                client_id,
                amount: total_amount,
                outstanding: total_due,
                last_sent: moment.utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
                statement_number: statementNumber,
                updated_at: moment.utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
              });

            if (insertError) {
              throw new Error(
                `Failed to insert statement: ${insertError.message}`
              );
            }

            insertCount++;
          }
        }
      }

      if (updateCount > 0 && insertCount > 0) {
        toast.success(
          `${updateCount} statements updated, ${insertCount} new statements created.`
        );
      } else if (updateCount > 0) {
        toast.success(`${updateCount} statements updated successfully.`);
        setIsCreateModalOpen(false);
        setIsLoading(true);
        setRefresh(true);
        fetchStatements();
      } else if (insertCount > 0) {
        toast.success(`${insertCount} new statements created successfully.`);
        setIsCreateModalOpen(false);
        setIsLoading(true);
        setRefresh(true);
        fetchStatements();
      } else {
        toast.success("Statements processed successfully.");
      }
    } catch (error: any) {
      console.error("Error processing statements:", error);
      toast.error(error.message || "Failed to process statements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [refresh, user]);

  console.log("monthStatement", monthStatement);
  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Statements</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track client statements
          </p>
          <button onClick={() => updateBalanceTracking()}>
            update balance tracking
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* <Select>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Print" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print-all">Print All</SelectItem>
              <SelectItem value="print-selected">Print Selected</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email-all">Email All</SelectItem>
              <SelectItem value="email-selected">Email Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Rollback</Button> */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            New Statement
          </Button>
        </div>
      </div>

      <StatementList statement={monthStatement} />

      {isCreateModalOpen && (
        <CreateStatementModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateStatement}
        />
      )}
    </main>
  );
};

export default Statements;
