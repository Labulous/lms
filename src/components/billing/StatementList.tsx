import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, MailIcon, MoreVertical, PrinterIcon, Settings2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getLabIdByUserId } from "@/services/authService";
import { BalanceTrackingItem, labDetail } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import BalanceList from "./BalanceList";
import { isValid, parseISO, format } from "date-fns";
import { formatDate } from "@/lib/formatedDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import InvoicePreviewModal from "../invoices/InvoicePreviewModal";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Address, clientsService, Doctor } from "@/services/clientsService";
import { Client as ClientItem } from "@/services/clientsService";
import StatementReceiptPreviewModal from "./print/StatementReceiptPreviewModal";
import moment from "moment";
import ReactDOM from "react-dom";
import { StatementReceiptTemplate } from "../cases/print/PrintTemplates";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
const RESEND_API = import.meta.env.VITE_RESEND_API;
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VITE_EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const mockStatements = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    statementNumber: "00032105",
    client: "Maine Street",
    amount: 470.0,
    outstandingAmount: 470.0,
    lastSent: new Date("2024-01-15"),
  },
  {
    id: "2",
    date: new Date("2024-01-10"),
    statementNumber: "00012105",
    client: "Test Client",
    amount: 1091.0,
    outstandingAmount: 676.0,
    lastSent: new Date("2024-01-12"),
  },
];

interface StatementList {
  statement: {
    id: string;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
    client: { client_name: string };
    statement_number: number; // Typically formatted as YYYYMMDD
    amount: number;
    outstanding: number;
    last_sent: string; // ISO timestamp
  }[];
}
export interface Client {
  id: string;
  accountNumber: string;
  clientName: string;
  contactName: string;
  phone: string;
  email: string;
  address: Address;
  status?: string | undefined | any;
  clinicRegistrationNumber: string;
  notes: string;
  doctors: Doctor[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  date: string;
  activity: string;
  amount: number;
  balance: number;
  type: string;
}

export interface StatementDetails {
  statement: StatementList;
  client: Client;
  invoiceData: InvoiceItem[];
  updated_at?: string;
}

const StatementList = ({ statement }: StatementList) => {
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [clientStatus, setClientStatus] = useState("active");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [filteredStatements, setFilteredStatements] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();
  const [isSendingBulkEmail, setIsSendingBulkEmail] = useState(false);
  const currentDate = new Date();

  const [selectmonth, setSelectMonth] = useState(
    (currentDate.getMonth() + 1).toString()
  );
  const [selectyear, setSelectYear] = useState(
    currentDate.getFullYear().toString()
  );

  const [selectedClient, setSelectedClient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("All Clients");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [labs, setLabs] = useState<labDetail[]>([]);

  const [statementDetails, setStatementDetails] = useState<StatementDetails[]>(
    []
  );

  console.log("statement data1.1.......................", statement);

  const { user } = useAuth();
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStatements(filteredStatements.map((statement: { id: string }) => statement.id));
    } else {
      setSelectedStatements([]);
    }
  };
  const handleSelectStatement = (statementId: string) => {
    setSelectedStatements((prev) =>
      prev.includes(statementId)
        ? prev.filter((id) => id !== statementId)
        : [...prev, statementId]
    );
  };

  const clearClientFilter = () => {
    setClientFilter("");
  };

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
            lab:labs!lab_id (
            id,
            name,
            attachements,
            office_address_id,
            office_address:office_address!office_address_id (            
              email,             
              phone_number,
              address_1,
              address_2,
              city,
              state_province,
              zip_postal,
              country
            )
            )
          `
          )
          .eq("id", user?.id)
          .or("is_archive.is.null,is_archive.eq.false");


        if (error) {
          throw new Error(error.message);
        }

        // Assuming you want the first lab's details
        if (data && data.length > 0) {
          // setLabs(data[0].lab as any);
          setLabs(data[0] as any);
        }
      } catch (err: any) {
        console.error("Error fetching labs data:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLabs();
    }
  }, [user?.id]);

  const handlePrintReceipts = async () => {
    // TODO: Implement print receipts functionality
    toast.success("Print receipts functionality coming soon!");
  };
  console.log(statement, "statement");
  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData) {
          toast.error("Unable to get Lab Id");
          return null;
        }
        setLab(labData);
        const data = await clientsService.getClients(labData?.labId);
        if (Array.isArray(data)) {
          setClients(data);
          // Only set filtered statements after clients are loaded
          setFilteredStatements(statement);
        }
        // if (Array.isArray(data)) {
        //   setClients(data);
        // }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
    // setFilteredStatements(statement);
  }, [user?.id]);

  const handleMonthChange = (e: any) => {
    setSelectMonth(e);
    const selMonth = e;

    setFilteredStatements(
      statement.filter((item) => {
        const itemDate = new Date(item.created_at);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();
        return selectedClient === "" || selectedClient === "All Clients"
          ? itemMonth === Number(selMonth) && itemYear === Number(selectyear)
          : itemMonth === Number(selMonth) &&
          itemYear === Number(selectyear) &&
          item.client.client_name.toLowerCase() ===
          selectedClient.toLocaleLowerCase();
      })
    );
  };

  const handleYearChange = (e: any) => {
    setSelectYear(e);
    const selYear = e;
    setFilteredStatements(
      statement.filter((item) => {
        const itemDate = new Date(item.created_at);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();
        return selectedClient === "" || selectedClient === "All Clients"
          ? itemMonth === Number(selectmonth) && itemYear === Number(selYear)
          : itemMonth === Number(selectmonth) &&
          itemYear === Number(selYear) &&
          item.client.client_name.toLowerCase() ===
          selectedClient.toLocaleLowerCase();
      })
    );
  };

  const months = [
    { key: 1, value: "January" },
    { key: 2, value: "February" },
    { key: 3, value: "March" },
    { key: 4, value: "April" },
    { key: 5, value: "May" },
    { key: 6, value: "June" },
    { key: 7, value: "July" },
    { key: 8, value: "August" },
    { key: 9, value: "September" },
    { key: 10, value: "October" },
    { key: 11, value: "November" },
    { key: 12, value: "December" },
  ];
  const years = Array.from({ length: 10 }, (_, i) => 2020 + i);

  const filteredClients = useMemo(() => {
    if (searchTerm === "All Clients" || searchTerm.trim() === "") {
      setFilteredStatements(
        statement.filter((item) => {
          const itemDate = new Date(item.created_at);
          const itemMonth = itemDate.getMonth() + 1;
          const itemYear = itemDate.getFullYear();
          return (
            itemMonth === Number(selectmonth) && itemYear === Number(selectyear)
          );
        })
      );

      return clients;
    }

    const filter = clients.filter((client) =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredStatements(
      statement.filter((item) => {
        const itemDate = new Date(item.created_at);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();
        return (
          itemMonth === Number(selectmonth) &&
          itemYear === Number(selectyear) &&
          item.client.client_name.toLowerCase() ===
          selectedClient.toLocaleLowerCase()
        );
      })
    );

    return filter.length > 0 ? filter : [];
  }, [searchTerm, clients]);

  const fetchStatementDetails = async (statementId: string) => {
    try {
      // Find the selected statement
      const statementData = filteredStatements.find(
        (s: any) => s.id === statementId
      );

      if (!statementData) {
        throw new Error("Statement not found");
      }

      // Fetch client data
      const { data: clientData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("client_name", statementData.client.client_name)
        .single();

      if (error) throw error;
      if (!clientData) throw new Error("Client not found");

      // Date calculations
      const startOfMonth = moment
        .utc(`${selectyear}-${selectmonth}-01`)
        .format("YYYY-MM-DD");
      const nextMonth = moment
        .utc(startOfMonth)
        .add(1, "month")
        .format("YYYY-MM-DD");

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select(`
        *,
        case:cases(case_number, patient_name)
      `)
        .eq("client_id", clientData.id)
        .gte("created_at", startOfMonth)
        .lt("created_at", nextMonth)
        .order("created_at", { ascending: false });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("created_at,payment_method,amount")
        .eq("client_id", clientData.id)
        .gte("created_at", startOfMonth)
        .lt("created_at", nextMonth)
        .order("created_at", { ascending: false });

      // Fetch balance tracking
      const { data: balanceList } = await supabase
        .from("balance_tracking")
        .select("*")
        .eq("client_id", clientData.id);

      // Calculate running balance
      let runningBalance = balanceList?.reduce((sum, item) => (
        sum +
        (item.last_month || 0) +
        (item.days_30_plus || 0) +
        (item.days_60_plus || 0) +
        (item.days_90_plus || 0)
      ), 0) || 0;

      // Combine data
      let combinedData: InvoiceItem[] = [];

      invoicesData?.forEach((invoice) => {
        combinedData.push({
          date: invoice.created_at,
          activity: `Invoice ${invoice.case?.case_number?.replace("TES", "INV")} : ${invoice.case?.patient_name
            }`,
          amount: invoice.amount || 0,
          balance: invoice.balance || 0,
          type: "I",
        });
      });

      paymentsData?.forEach((payment) => {
        combinedData.push({
          date: payment.created_at,
          activity: `Payment: ${payment.payment_method}`,
          amount: payment.amount || 0,
          balance: 0,
          type: "P",
        });
      });

      // Sort and calculate balances
      combinedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (runningBalance >= 0) {
        combinedData.unshift({
          date: "",
          activity: "Previous Balance",
          amount: 0,
          balance: runningBalance,
          type: "PB",
        });
      }

      combinedData = combinedData.map((transaction) => {
        if (transaction.type === "I") {
          runningBalance += transaction.amount;
        } else if (transaction.type === "P") {
          runningBalance -= transaction.amount;
        }
        return { ...transaction, balance: runningBalance };
      });

      return {
        client: clientData,
        statement: statementData,
        invoiceData: combinedData,
        labData: labs
      };
      console.log("combinedData=============================================================", combinedData)
    } catch (error) {
      console.error("Error fetching statement details:", error);
      throw error;
    }
  };

  // Updated handleViewDetails using the new function
  const handleViewDetails = async (statementId: string) => {
    try {
      const details = await fetchStatementDetails(statementId);
      setStatementDetails([details]);
      setIsPreviewModalOpen(true);
    } catch (error) {
      toast.error("Failed to load statement details");
    }
  };

  const blobToBase64 = async (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(",")[1];
        if (base64String) resolve(base64String);
        else reject("Failed to convert Blob to Base64");
      };
    });
  };

  const handleSendBulkEmails = async () => {
    debugger;
    if (selectedStatements.length === 0) return;

    setIsSendingBulkEmail(true);
    try {
      const attachments = [];
      const recipientEmails = [];
      for (const statementId of selectedStatements) {
        try {
          let details = await fetchStatementDetails(statementId);
          console.log("details", details)
          if (!details.client?.email) continue;
          const clientEmail = details.client.email;
          const clientName = details.client.client_name;
          const lab = details.labData[0];
          const labName = lab?.name || "Lab Name";
          const labEmail = lab?.office_address?.email || "LabEmail";
          const labPhone = lab?.office_address?.phone_number || "";

          // const labName = details.labData?.name || "Lab Name";
          // const labEmail = details.labData?.office_address?.email || "LabEmail";
          // const labPhone = details.labData?.office_address?.phone_number || "";
          recipientEmails.push(clientEmail);
          const tempContainer = document.createElement("div");
          document.body.appendChild(tempContainer);
          const root = createRoot(tempContainer);
          root.render(
            <StatementReceiptTemplate
              caseDetails={[details]}
              labData={details.labData}
              paperSize="LETTER"
            />
          );
          await new Promise(resolve => setTimeout(resolve, 50));
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const pdf = new jsPDF({ compress: true });
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, "image/png", 0, 0, imgWidth, imgHeight);
          const pdfBlob = await new Response(pdf.output("blob")).blob();
          const pdfBase64 = await blobToBase64(pdfBlob);
          attachments.push({
            filename: `Statement-${details.statement.statement_number}.pdf`,
            content: pdfBase64,
            contentType: "application/pdf",
          });
          root.unmount();
          document.body.removeChild(tempContainer);
          const now = new Date();
          const monthYear = now.toLocaleString("default", { month: "long", year: "numeric" });
          const subject = `Monthly Statement – ${labName}`;
          const htmlBody = `
            <p>Dear <strong>${labName}</strong>,</p>
            <p>Attached is your monthly statement for <strong>${monthYear}</strong> from <strong>${labName}</strong>, summarizing recent transactions and balances.</p>
            <p>For any discrepancies or inquiries, please reach out to us at <strong>${labEmail}</strong>.</p>
            <p>Best regards,</p>
            <p><strong>${labName}</strong><br/>
            <strong>${labPhone} | ${labEmail}</strong></p>
          `;
          console.log("htmlBody", htmlBody);

          // Send email using Supabase function
          const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/resend-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              from: `Statement <statement@${VITE_EMAIL_FROM}>`,
              to: recipientEmails,
              subject: subject,
              html: htmlBody,
              attachments: attachments,
            }),
          });

          const result = await response.json();
          if (response.ok) {
            toast.success("Bulk emails sent successfully!");
          } else {
            throw new Error(result.error || "Unknown error");
          }
        } catch (error) {
          console.error(`Failed to process statement ${statementId}:`, error);
          toast.error("Failed to send bulk emails.");
        }
      }

      if (recipientEmails.length === 0) {
        toast.error("No valid recipients found.");
        setIsSendingBulkEmail(false);
        return;
      }
    } catch (error: any) {
      console.error("Bulk email error:", error);
      toast.error("Failed to send bulk emails.");
    } finally {
      setIsSendingBulkEmail(false);
    }
  };
  return (
    <div className="space-y-4 relative" >
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center  gap-1">
          <div className="relative w-[200px]">
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Search clients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={(e) => {
                setTimeout(() => {
                  setIsDropdownOpen(false);
                }, 200);
              }}
            />
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
                {filteredClients.length > 0 ? (
                  <>
                    <div
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setSelectedClient("All Clients");
                        setSearchTerm("All Clients");
                        setIsDropdownOpen(false);
                      }}
                    >
                      All Clients
                    </div>

                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setSelectedClient(client.clientName.toString());
                          setSearchTerm(client.clientName);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {client.clientName}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-2 text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <Select value={selectmonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.key} value={month.key.toString()}>
                    {month.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectyear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedStatements.length > 0 && (
            <div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSendBulkEmails}
                disabled={isSendingBulkEmail}
                className="ml-2"
              >
                <MailIcon className="mr-2 h-4 w-4" />
                {isSendingBulkEmail ? "Sending..." : "Send To Client"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center">
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              placeholder="Search statements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {clientFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={clearClientFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

      </div>
      <div className="rounded-md border">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedStatements.length === filteredStatements.length && filteredStatements.length > 0}
                  onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                />
              </TableHead>

              <TableHead>Date</TableHead>
              <TableHead>Statement #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding Amount</TableHead>
              <TableHead>Last Generated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStatements.map((statement: any) => (
              <TableRow key={statement.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStatements.includes(statement.id)}
                    onCheckedChange={() => handleSelectStatement(statement.id)}
                  />
                </TableCell>
                <TableCell>{formatDate(statement.created_at)}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => handleViewDetails(statement.id)}
                  >
                    {statement.statement_number}
                  </Button>
                </TableCell>
                <TableCell>{statement.client.client_name}</TableCell>
                <TableCell className="text-right">
                  ${statement.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${statement.outstanding.toFixed(2)}
                </TableCell>
                <TableCell>{formatDate(statement.last_sent)}</TableCell>
                <TableCell>
                  {/* <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button> */}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem
                        onClick={() =>
                          handleViewDetails(statement?.id as string)
                        }
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </div>
      {/* )} */}

      <div className="flex items-center justify-between">
        <Select defaultValue="20">
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">1-2 of 2</div>
      </div>

      {isPreviewModalOpen && (
        <StatementReceiptPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
          }}
          // caseDetails={statement.filter((statement: any) =>
          //   selectedStatements.includes(statement.id)
          // )}
          caseDetails={statementDetails}
          labData={labs}
        />
      )}
    </div>
  );
};

export default StatementList;
