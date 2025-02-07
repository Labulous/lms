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
import { Eye, MoreVertical, PrinterIcon, Settings2, X } from "lucide-react";
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
import {
  Client as ClientItem
} from "@/services/clientsService";
import StatementReceiptPreviewModal from "./print/StatementReceiptPreviewModal";
import moment from "moment";

// Mock data for development
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
  const [statementDetails, setStatementDetails] = useState<StatementDetails[]>([]);

  const { user } = useAuth();
  const handleSelectAll = (checked: boolean) => {
    debugger;
    if (checked) {
      setSelectedStatements(filteredStatements.map((statement: any) => statement.id));
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
          .from("labs")
          .select(
            `
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
          `
          )
          .or(
            `super_admin_id.eq.${user?.id},admin_ids.cs.{${user?.id}},technician_ids.cs.{${user?.id}},client_ids.cs.{${user?.id}}`
          );

        if (error) {
          throw new Error(error.message);
        }

        // Assuming you want the first lab's details
        if (data && data.length > 0) {
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
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
    setFilteredStatements(statement);
  }, []);

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

  const handleViewDetails = async (statementId: string) => {
    const statementData = filteredStatements.filter((l: any) => l.id === statementId);
    const { data: clientData, error } = await supabase
      .from("clients")
      .select("*")
      .eq("client_name", statementData[0]?.client.client_name)
      .single();


    const startOfMonth = moment(`${selectyear}-${selectmonth}-01`).format("YYYY-MM-DD");
    const nextMonth = moment(startOfMonth).add(1, "month").format("YYYY-MM-DD");

    const { data: invoicesData, error: errro1 } = await supabase
      .from("invoices")
      .select(`
          *,
          case:cases(case_number, patient_name)
        `)
      .eq("client_id", clientData?.id)
      .gte("created_at", startOfMonth)
      .lt("created_at", nextMonth)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("created_at,payment_method,amount")
      .eq("client_id", clientData?.id)
      .gte("created_at", startOfMonth)
      .lt("created_at", nextMonth)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    // const { data: adjustmentsData, error: adjustmentsError } = await supabase
    //   .from("adjustments")
    //   .select("*")
    //   .eq("client_id", clientData?.id)
    //   .order("created_at", { ascending: false });

    // if (adjustmentsError) {
    //   console.error("Error fetching adjustments:", adjustmentsError);
    // }

    let combinedData: InvoiceItem[] = [];

    invoicesData?.forEach(invoice => {
      combinedData.push({
        date: invoice.created_at,
        activity: `Invoice  ${invoice.case?.case_number?.replace("TES", "INV")} : ${invoice.case?.patient_name}`,
        amount: invoice.amount || 0,
        balance: invoice.balance || 0,
        type: "I",
      });
    });

    paymentsData?.forEach(payment => {
      combinedData.push({
        date: payment.created_at,
        activity: `Payment: ${payment?.payment_method}`,
        amount: payment.amount || 0,
        balance: 0,
        type: "P",
      });
    });

    // adjustmentsData?.forEach(adjustment => {
    //   combinedData.push({
    //     date: adjustment.created_at,
    //     activity: adjustment.description,
    //     amount: adjustment.credit_amount,
    //     balance: adjustment.balance || 0,
    //   });
    // });

    let runningBalance = 0;
    const { data: balanceList, error: balanceListError } = await supabase
      .from("balance_tracking")
      .select("*")
      .eq("client_id", clientData?.id);

    if (balanceListError) {
      console.error("Error fetching balance list:", balanceListError);
    } else {
      runningBalance = balanceList.reduce((sum, item) => {
        return sum + (item.last_month || 0) + (item.days_30_plus || 0) + (item.days_60_plus || 0) + (item.days_90_plus || 0);
      }, 0);

      console.log("Total Outstanding Balance:", runningBalance);
    }


    combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());



    if (runningBalance >= 0) {
      combinedData.unshift({
        date: "",
        activity: "Previous Balance",
        amount: 0,
        balance: runningBalance,
        type: "PB",
      });
    }

    combinedData = combinedData.map(transaction => {
      if (transaction.type === "I") {
        runningBalance += transaction.amount;
      } else if (transaction.type === "P") {
        runningBalance -= transaction.amount;
      }

      return {
        ...transaction,
        balance: runningBalance,
      };
    });



    const statementDetailsObject: StatementDetails = {
      statement: statementData[0],
      client: clientData,
      invoiceData: combinedData || [],
    };
    setStatementDetails([statementDetailsObject]);
    setSelectedStatements([statementId]);
    setIsPreviewModalOpen(true);
  };


  return (
    <div className="space-y-4">
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
        </div>

        <div className="flex items-center">
          {/* {selectedStatements && selectedStatements.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground mr-2">
                {selectedStatements.length}{" "}
                {selectedStatements.length === 1 ? "item" : "items"} selected
              </span>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Statement
              </Button>
            </>
          )} */}
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

          {/* <Select value={clientStatus} onValueChange={setClientStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Client Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Client</SelectItem>
              <SelectItem value="inactive">Inactive Client</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedStatements.length === mockStatements.length &&
                    mockStatements.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>

              <TableHead>Date</TableHead>
              <TableHead>Statement #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding Amount</TableHead>
              <TableHead>Last Sent</TableHead>
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
                  <Button variant="link" className="p-0">
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
                {user?.role != "client" && (
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}

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
                        onClick={() => handleViewDetails(statement?.id as string)}
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
