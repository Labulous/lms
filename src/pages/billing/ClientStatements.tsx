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

const ClientStatements = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [monthStatement, setMonthStatement] = useState<any>([]);
    const [refresh, setRefresh] = useState<boolean>(false);
    const { user } = useAuth();
    // const handleCreateStatement = async (data: any) => {
    //     try {
    //         setIsLoading(true);

    //         // Extract month and year from input
    //         const [month, year] = data.month
    //             .split(",")
    //             .map((item: string) => parseInt(item.trim(), 10));
    //         const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    //         const nextMonth = month === 12 ? 1 : month + 1;
    //         const nextYear = month === 12 ? year + 1 : year;
    //         const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    //         // Generate statement number based on current date
    //         const today = new Date();
    //         const statementNumber = `${today.getFullYear()}${String(
    //             today.getMonth() + 1
    //         ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    //         // Get lab ID for the current user
    //         const lab = await getLabIdByUserId(user?.id as string);

    //         if (!lab?.labId) {
    //             console.error("Lab ID not found.");
    //             throw new Error("Lab ID is required to create statements.");
    //         }

    //         // Fetch invoices for the specified month
    //         const { data: categorizedInvoices, error: fetchError } = await supabase
    //             .from("invoices")
    //             .select(
    //                 "due_amount, due_date, amount, status, updated_at, client:clients!client_id (client_name, id)"
    //             )
    //             .in("status", ["unpaid", "partially_paid"])
    //             .gte("due_date", startDate)
    //             .lt("due_date", endDate)
    //             .not("amount", "is", null)
    //             .eq("lab_id", lab.labId); // Filter by lab_id

    //         if (fetchError) {
    //             throw new Error(
    //                 `Failed to fetch categorized invoices: ${fetchError.message}`
    //             );
    //         }

    //         // Generate client statements
    //         const statementSummary = categorizedInvoices.reduce(
    //             (acc: any[], invoice: any) => {
    //                 const { client, amount, due_amount, updated_at } = invoice;
    //                 const clientId = client.id;

    //                 // Find existing client entry
    //                 const existingClient = acc.find(
    //                     (item) => item.client_id === clientId
    //                 );

    //                 if (existingClient) {
    //                     // Update totals and last_sent
    //                     existingClient.total_amount += amount;
    //                     existingClient.total_due += due_amount;
    //                     // Set last_sent to the latest updated_at for the client
    //                     existingClient.last_sent =
    //                         new Date(existingClient.last_sent) > new Date(updated_at)
    //                             ? existingClient.last_sent
    //                             : updated_at;
    //                 } else {
    //                     // Add new client entry
    //                     acc.push({
    //                         client_id: clientId,
    //                         amount: amount,
    //                         outstanding: due_amount,
    //                         last_sent: updated_at, // Use the updated_at field for the first entry
    //                     });
    //                 }
    //                 return acc;
    //             },
    //             []
    //         );

    //         console.log("Statement Summary:", statementSummary);

    //         // Insert or Update statements in the database
    //         for (const statement of statementSummary) {
    //             const { client_id, amount, outstanding, last_sent } = statement;

    //             // Check if a statement exists for the current client, lab, and month
    //             const { data: existingStatement, error: checkError } = await supabase
    //                 .from("statements")
    //                 .select("id")
    //                 .eq("client_id", client_id)
    //                 .eq("lab_id", lab.labId) // Filter by lab_id
    //                 .gte("updated_at", `${year}-${String(month).padStart(2, "0")}-01`)
    //                 .lt(
    //                     "updated_at",
    //                     `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
    //                 )
    //                 .single();

    //             if (checkError && checkError.code !== "PGRST116") {
    //                 // Ignore "no rows found" error (PGRST116), but handle others
    //                 throw new Error(
    //                     `Failed to check existing statement: ${checkError.message}`
    //                 );
    //             }

    //             if (existingStatement) {
    //                 // Update the existing statement
    //                 const { error: updateError } = await supabase
    //                     .from("statements")
    //                     .update({
    //                         amount,
    //                         outstanding,
    //                         last_sent,
    //                         statement_number: statementNumber,
    //                         updated_at: new Date().toISOString(),
    //                     })
    //                     .eq("id", existingStatement.id);

    //                 if (updateError) {
    //                     throw new Error(
    //                         `Failed to update statement: ${updateError.message}`
    //                     );
    //                 }
    //             } else {
    //                 // Insert a new statement
    //                 const { error: insertError } = await supabase
    //                     .from("statements")
    //                     .insert({
    //                         lab_id: lab.labId, // Include lab_id
    //                         client_id,
    //                         amount,
    //                         outstanding,
    //                         last_sent,
    //                         statement_number: statementNumber,
    //                         updated_at: new Date().toISOString(),
    //                     });

    //                 if (insertError) {
    //                     throw new Error(
    //                         `Failed to insert statement: ${insertError.message}`
    //                     );
    //                 }
    //             }
    //         }

    //         toast.success("Statements processed successfully");
    //     } catch (error) {
    //         console.error("Error processing statements:", error);
    //         toast.error("Failed to process statements");
    //     } finally {
    //         setIsLoading(false);
    //         setIsCreateModalOpen(false);
    //         setRefresh(true);
    //     }
    // };

    useEffect(() => {
        const fetchStatements = async () => {
            setIsLoading(true);
            setRefresh(false);

            console.log("use effect running!!!");
            try {
                if (!user) {
                    console.error("User data not found");
                    return;
                }

                // Get the lab ID associated with the current user
                const lab = await getLabIdByUserId(user?.id as string);

                if (!lab?.labId) {
                    console.error("Lab ID not found.");
                    return;
                }

                // Fetch client ID based on the user's email
                const fetchedClientID = await clientsService.getClientIdByUserEmail(user.email);
                if (!fetchedClientID) {
                    toast.error("Client ID not found");
                    return;
                }
                //console.log(fetchedClientID);

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
                    .eq("client_id", fetchedClientID)
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

        fetchStatements();
    }, [refresh, user]);

    console.log("monthStatement", monthStatement);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-8 p-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Statements</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage and track client statements
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select>
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
                    {/* <Button variant="outline">Rollback</Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        New Statement
                    </Button> */}
                </div>
            </div>

            <StatementList statement={monthStatement} />

            {/* {isCreateModalOpen && (
                <CreateStatementModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateStatement}
                />
            )} */}
        </main>
    );
};

export default ClientStatements;
