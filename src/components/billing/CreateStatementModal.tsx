import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { BalanceSummary } from "@/pages/billing/Statements";
import { getLabIdByUserId } from "@/services/authService";
import { BalanceTrackingItem } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import { Address, clientsService, Doctor } from "@/services/clientsService";
import {
  Client as ClientItem
} from "@/services/clientsService";
import { devNull } from "os";
import { useNavigate } from "react-router-dom";



interface CreateStatementModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface MonthlyBalance {
  month: string;
  thisMonth: number;
  lastMonth: number;
  days30: number;
  days60: number;
  days90: number;
  credit: number;
  outstandingBalance: number;
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

export function CreateStatementModal({
  onClose,
  onSubmit,
}: CreateStatementModalProps) {
  const [availableMonths, setAvailableMonths] = useState<
    { name: string; month: number; year: number }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [balanceSummaryRemoved, setBalanceSummary] = useState<MonthlyBalance>({
    month: "",
    thisMonth: 0,
    lastMonth: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    credit: 0,
    outstandingBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [balanceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [lab, setLab] = useState<{ labId: string; name: string } | null>();

  const [selectedClient, setSelectedClient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("All Clients");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const currentDate = new Date();
  const [selectmonth, setSelectMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectyear, setSelectYear] = useState((currentDate.getFullYear()).toString());
  

  const { user } = useAuth();
  // Helper function to animate value changes
  const AnimatedValue = ({
    value,
    prefix = "$",
  }: {
    value: number;
    prefix?: string;
  }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      setHasChanged(true);
      const timeout = setTimeout(() => setHasChanged(false), 300);

      // Animate to new value
      setDisplayValue(value);

      return () => clearTimeout(timeout);
    }, [value]);

    return (
      <span
        className={`transition-all duration-300 ${hasChanged ? "text-primary scale-110" : ""
          }`}
      >
        {prefix}
        {displayValue.toFixed(2)}
      </span>
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

  useEffect(() => {
    getBalanceSummary(Number(currentDate.getMonth() + 1), Number(currentDate.getFullYear()), "");
  }, []);

  const handleMonthChange = (e: any) => {
    setSelectMonth(e);
    getBalanceSummary(Number(e), Number(selectyear), selectedClient);
  }

  const handleYearChange = (e: any) => {
    setSelectYear(e);
    getBalanceSummary(Number(selectmonth), Number(e), selectedClient);
  }




  // Fetch months with payment activity

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const { data: payments, error } = await supabase
          .from("payments")
          .select("created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Extract unique months and map to the desired format
        const months = [
          ...new Map(
            payments?.map((payment) => {
              const date = new Date(payment.created_at);
              const month = date.getMonth() + 1; // JS months are 0-indexed
              const year = date.getFullYear();
              const name = format(date, "MMMM yyyy");

              return [`${month}-${year}`, { name, month, year }];
            })
          ).values(),
        ];

        setAvailableMonths(months);
      } catch (error) {
        console.error("Error fetching available months:", error);
        toast.error("Failed to load available months");
      }
    };

    fetchAvailableMonths();
  }, []);


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
  }, []);


  const getBalanceSummary = async (month: number, year: number, clientId: string) => {
   setLoading(true);

    const formattedYear = year < 100 ? 2000 + year : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? formattedYear + 1 : formattedYear;

    try {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      let query = supabase
        .from("balance_tracking")
        .select(
          `
            created_at,
            client_id,
            outstanding_balance,
            credit,
            this_month,
            last_month,
            days_30_plus,
            days_60_plus,
            days_90_plus,
            total,
            lab_id,
            clients!client_id ( client_name )
          `
        )
        .eq("lab_id", lab.labId)
        .gte("updated_at", `${formattedYear}-${String(month).padStart(2, "0")}-01`)
        .lt("updated_at", `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data: balanceList, error: balanceListError } = await query;

      if (balanceListError) {
        console.error("Error fetching balance tracking data:", balanceListError);
        return;
      }

      console.log("balanceList (raw data)", balanceList);

      const transformedBalanceList = balanceList?.map((balance: any) => ({
        ...balance,
        client_name: balance.clients?.client_name,
      }));

      setBalanceList(transformedBalanceList as BalanceTrackingItem[]);
    } catch (err) {
      console.error("Error fetching payment list:", err);
    } finally {
      setLoading(false);
    }
  };



  const filteredClients = useMemo(() => {
    if (searchTerm === "All Clients" || searchTerm.trim() === "") {
      if (Number(selectmonth) > 0 && Number(selectyear) > 0)
        getBalanceSummary(Number(selectmonth), Number(selectyear), "");
      return clients;
    }

    const filter = clients.filter((client) =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (Number(selectmonth) > 0 && Number(selectyear) > 0)
      getBalanceSummary(Number(selectmonth), Number(selectyear), selectedClient);
    return filter.length > 0 ? filter : [];

  }, [searchTerm, clients]);



  // Handle month selection
  const handleMonthSelect = (monthYear: string) => {
    alert(selectedClient)
    const month = monthYear.split(",")[0];
    const year = monthYear.split(",")[1];
    setSelectedMonth(monthYear);
    getBalanceSummary(Number(month), Number(year), "");
  };

  // Handle statement generation
  const handleGenerateStatement = async () => {
    if (!selectmonth) {
      toast.error("Please select a month");
      return;
    }
    const selectedDate = new Date(Number(selectyear), Number(selectmonth) - 1);
    const currentDate = new Date();
    if (selectedDate > currentDate) {
      toast.error("Statement cannot be generated for a future month");
      return;
    }


    try {
      // TODO: Implement statement generation logic
      const client_id = selectedClient === "All Clients" ? "" : selectedClient
      onSubmit({
        //month: !selectmonth ,
        month: `${selectmonth},${selectyear},${client_id || ""}`,
        summary: balanceSummary,

      });

    
      toast.success("Statement generated successfully");
      // onClose();
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error("Failed to generate statement");
    }
  };




  // const getBalanceSummary = async (month: number, year: number) => {
  //   setLoading(true);
  //   debugger;

  //   const formattedYear = year < 100 ? 2000 + year : year;

  //   const nextMonth = month === 12 ? 1 : month + 1;
  //   const nextYear = month === 12 ? formattedYear + 1 : formattedYear;

  //   try {
  //     const lab = await getLabIdByUserId(user?.id as string);

  //     if (!lab?.labId) {
  //       console.error("Lab ID not found.");
  //       return;
  //     }

  //     const { data: balanceList, error: balanceListError } = await supabase
  //       .from("balance_tracking")
  //       .select(
  //         `
  //           created_at,
  //           client_id,
  //           outstanding_balance,
  //           credit,
  //           this_month,
  //           last_month,
  //           days_30_plus,
  //           days_60_plus,
  //           days_90_plus,
  //           total,
  //           lab_id,
  //           clients!client_id ( client_name )
  //           `
  //       )
  //       .eq("lab_id", lab.labId)
  //       .gte(
  //         "updated_at",
  //         `${formattedYear}-${String(month).padStart(2, "0")}-01`
  //       )
  //       .lt(
  //         "updated_at",
  //         `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
  //       );

  //     if (balanceListError) {
  //       console.error("Error fetching products for case:", balanceListError);
  //       return;
  //     }

  //     console.log("balanceList (raw data)", balanceList);

  //     const transformedBalanceList = balanceList?.map((balance: any) => ({
  //       ...balance,
  //       client_name: balance.clients?.client_name,
  //     }));

  //     setBalanceList(transformedBalanceList as BalanceTrackingItem[]);
  //   } catch (err) {
  //     console.error("Error fetching payment list:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Use a valid year (e.g., 2024) instead of 24

  const filteredBalances: BalanceTrackingItem[] = balanceList.filter(
    (balance) => {
      const matchesSearch = balance.client_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    }
  );

  // Calculate totals
  const balanceSummary = filteredBalances.reduce(
    (acc, balance) => ({
      totalItems: acc.totalItems + 1, // Count the total number of items
      outstandingBalance: acc.outstandingBalance + balance.outstanding_balance,
      creditBalance:
        acc.creditBalance +
        (typeof balance?.credit === "number" ? balance.credit : 0),
      thisMonth: acc.thisMonth + balance.this_month,
      lastMonth: acc.lastMonth + balance.last_month,
      days30Plus: acc.days30Plus + balance.days_30_plus,
      days60Plus: acc.days60Plus + balance.days_60_plus,
      days90Plus: acc.days90Plus + balance.days_90_plus,
    }),
    {
      totalItems: 0,
      outstandingBalance: 0,
      creditBalance: 0,
      thisMonth: 0,
      lastMonth: 0,
      days30Plus: 0,
      days60Plus: 0,
      days90Plus: 0,
    }
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Statement</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Column - Month Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-[180px] ">
                <span className="text-sm font-medium  mb-3 block">Select Month</span>
                <Select value={selectmonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-full">
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

              <div className="w-[180px]">
                <span className="text-sm font-medium  mb-3 block">Select Year</span>
                <Select value={selectyear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full">
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




            {/* <div className="text-sm font-medium">Select Month</div>
            <Select value={selectedMonth} onValueChange={handleMonthSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month, key) => (
                  <SelectItem key={key} value={`${month.month},${month.year}`}>
                    {month.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <div className="text-sm text-gray-500 mt-2">
              Only months with payment activity are shown
            </div>

            <div className="relative w-[400px]">
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
                            setSelectedClient(client.id.toString());
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
          </div>

          {/* Right Column - Balance Summary */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Balance Summary</div>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3 bg-muted p-4 rounded-lg transition-all duration-200 hover:bg-muted/80">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm text-muted-foreground">
                    This Month:
                  </div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.thisMonth} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Last Month:
                  </div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.lastMonth} />
                  </div>

                  <div className="text-sm text-muted-foreground">30+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days30Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">60+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days60Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">90+ Days:</div>
                  <div className="text-sm font-medium text-right">
                    <AnimatedValue value={balanceSummary.days90Plus} />
                  </div>

                  <div className="text-sm text-muted-foreground">Credit:</div>
                  <div className="text-sm font-medium text-right text-green-600">
                    <AnimatedValue value={balanceSummary.creditBalance} />
                  </div>

                  <div className="text-base font-medium pt-2 border-t">
                    Outstanding Balance:
                  </div>
                  <div className="text-base font-medium text-right pt-2 border-t">
                    <AnimatedValue value={balanceSummary.outstandingBalance} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateStatement}
            disabled={!selectmonth && !selectyear || isLoading}
            className="relative"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Statement
            {hasChanged && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
