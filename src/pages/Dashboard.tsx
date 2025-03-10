import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Clock,
  PauseCircle,
  Package,
  Settings,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import DueDatesCalendar from "@/components/calendar/DueDatesCalendar";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import DailyCountsCard from "../components/operations/DailyCountsCard";
import PerformanceMetricsCard from "../components/operations/PerformanceMetricsCard";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import CaseList from "@/components/cases/CaseList";
import moment from "moment";
import { shortMonths } from "@/lib/months";

interface WorkstationIssue {
  id: string;
  type: {
    id: string;
    name: string;
  };
  issue_reported_at: string;
  issue_reported_notes: string;
  custom_workstation_type?: string;
}

export interface CalendarEvents {
  title: string;
  start: Date;
  end: Date;
  onHold?: boolean;
  isAllOnHold?: boolean;
  isTommorow?: boolean;
  isPastDue?: boolean;
  isActive?: boolean;
  resource?: any;
  formattedCases: {
    case_id: string;
    client_name: string;
    doctor: { name: string };
    due_date?: string;
    case_products: { name: string; product_type: { name: string } }[];
    invoicesData:
      | {
          amount: number;
          due_amount: number;
          status: String;
          created_at: string;
        }[]
      | [];
  }[];
}
interface CasesDues {
  due_date: string;
  status: string;
  id: string;
  case_number: string;
  client_name: {
    client_name: string;
  };
  product_ids: { products_id: string[] };
  doctor: { name: string };
  products: any[];
  invoicesData:
    | {
        amount: number;
        due_amount: number;
        status: String;
        created_at: string;
      }[]
    | [];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("operations");
  const { user } = useAuth();
  const [workstationIssues, setWorkstationIssues] = useState<
    WorkstationIssue[]
  >([]);
  const [casesList, setCasesList] = useState<CasesDues[]>([]);
  const [todayCellEvents, setTodaysCellEvent] = useState<CalendarEvents[]>([]);
  const [filterType, setFilterType] = useState("due_date");

  const [totalWorkstations, setTotalWorkstations] = useState(0);
  const [metrics, setMetrics] = useState({
    pastDue: 0,
    dueToday: 0,
    dueTomorrow: 0,
    onHold: 0,
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvents[]>([]);

  const {
    data: labIdData,
    error: labError,
    isLoading: isLabLoading,
  } = useQuery(
    user?.id
      ? supabase.from("users").select("lab_id").eq("id", user?.id).single()
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (labError) {
    return <div>Loading!!!</div>;
  }

  const { data: query, error: caseError } = useQuery(
    labIdData?.lab_id
      ? supabase
          .from("cases")
          .select(
            `
                  case_number,
                  id,
                  status,
                  due_date,
                  client_name:clients!client_id (
                    client_name
                  ),
                  product_ids:case_products!id (
                    products_id
                  ),
                  doctor:doctors!doctor_id (
                    name
                  ),
                  invoicesData:invoices!case_id (
                  id,
                    amount,
                    status,
                    due_amount,
                    created_at
                  ),
                   teethProduct: case_product_teeth!id (
                  id,
                  products:products!product_id (
                    id,
                      name,
                      product_type:product_types!product_type_id (
                        name
                    )
                    )
                  )
    `
          )
          .eq("lab_id", labIdData.lab_id)
          .in("status", ["in_queue", "in_progress", "on_hold"]) // Filter for both statuses
          .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
          .order("created_at", { ascending: true })
      : null, // Fetching a single record based on `activeCaseId`
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5000,
    }
  );
  if (caseError && labIdData?.lab_id) {
    // toast.error("failed to fetech cases");
  }
  let casesListData: any = query;
  const casesList1: CasesDues[] | [] =
    casesListData?.map((item: any) => ({
      ...item,
      products: item.teethProduct.map((item: any) => item.products),
    })) || [];
  useEffect(() => {
    if (casesList1) {
      setCasesList(casesList1);
    }
  }, [casesList1.length]);
  // useEffect(() => {
  //   const getCompletedInvoices = async () => {
  //     try {
  //       const lab = await getLabIdByUserId(user?.id as string);

  //       if (!lab?.labId) {
  //         console.error("Lab ID not found.");
  //         return;
  //       }

  //       const { data: casesData, error: casesError } = await supabase
  //         .from("cases")
  //         .select(
  //           `
  //                 case_number,
  //                 id,
  //                 status,
  //                 due_date,
  //                 client_name:clients!client_id (
  //                   client_name
  //                 ),
  //                 product_ids:case_products!id (
  //                   products_id
  //                 ),
  //                 doctor:doctors!doctor_id (
  //                   name
  //                 ),
  //                 invoicesData:invoices!case_id (
  //                 id,
  //                   amount,
  //                   status,
  //                   due_amount,
  //                   created_at
  //                 )

  //               `
  //         )
  //         .eq("lab_id", lab.labId)
  //         .in("status", ["in_queue", "in_progress", "on_hold"])
  //         .order("created_at", { ascending: true });

  //       if (casesError) {
  //         console.error("Error fetching completed invoices:", casesError);
  //         return;
  //       }

  //       const enhancedCases = await Promise.all(
  //         casesData.map(async (singleCase) => {
  //           const productsIdArray =
  //             singleCase.product_ids?.map((p) => p.products_id) || [];

  //           if (productsIdArray.length === 0) {
  //             return { ...singleCase, products: [] };
  //           }

  //           const { data: productData, error: productsError } = await supabase
  //             .from("products")
  //             .select(
  //               `
  //                     id,
  //                     name,
  //                     product_type:product_types!product_type_id (
  //                       name
  //                     )
  //                   `
  //             )
  //             .eq("lab_id", lab.labId)
  //             .in("id", productsIdArray);

  //           if (productsError) {
  //             console.error(
  //               `Error fetching products for case ${singleCase.id}:`,
  //               productsError
  //             );
  //           }

  //           return { ...singleCase, products: productData || [] };
  //         })
  //       );

  //       setCasesList(enhancedCases as any);
  //     } catch (error) {
  //       console.error("Error fetching completed invoices:", error);
  //     } finally {
  //       // setLoading(false);
  //     }
  //   };
  //   getCompletedInvoices();
  // }, [user]);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.id) return;

        const labData = await getLabIdByUserId(user.id);
        if (!labData?.labId) return;

        // Fetch case metrics and calendar events
        // Get today's date in UTC
        const today = new Date();

        // Get tomorrow's date in UTC
        const tomorrow = new Date(today);
        tomorrow.setHours(today.getDate() + 1); // Set tomorrow's date in UTC
        // Set tomorrow's date

        // Set the start and end of today to compare full date range
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0); // Set hours to 12:00 AM (UTC)
        // End of today in UTC (11:59:59.999 PM UTC)
        const endOfToday = new Date(today);
        console.log(startOfToday, "endOfToday");
        console.log(endOfToday, "endOfToday");
        endOfToday.setHours(23, 59, 59, 999); //

        // Function to check if a date is due today
        const isDueToday = (dueDate: string) => {
          const due = new Date(dueDate);
          console.log(
            dueDate?.split("T"),
            startOfToday.toDateString().split(" "),
            "dueDate"
          );

          return (
            dueDate?.split("T")?.[0].split("-")?.[2] ===
              startOfToday.toDateString().split(" ")?.[2] &&
            Number(dueDate?.split("T")?.[0].split("-")?.[1]) ===
              Number(
                shortMonths.findIndex(
                  (item) =>
                    item.toLowerCase() ===
                    startOfToday.toDateString().split(" ")?.[1].toLowerCase()
                )
              ) +
                1
          );
        };

        // Function to check if a date is due tomorrow
        const isDueTomorrow = (dueDate: string) => {
          const due = new Date(dueDate);
          console.log(
            dueDate?.split("T")?.[0]?.split("-")[2],
            Number(today.toDateString().split(" ")?.[2]) + 1,
            "hiwifh"
          );
          console.log(
            Number(
              shortMonths.findIndex(
                (item) =>
                  item?.toLowerCase() ===
                  tomorrow?.toDateString().split(" ")?.[1].toLowerCase()
              )
            ),
            "hi2"
          );

          return (
            Number(dueDate?.split("T")?.[0].split("-")?.[2]) ===
              Number(today.toDateString().split(" ")?.[2]) + 1 &&
            Number(dueDate?.split("T")?.[0].split("-")?.[1]) ===
              Number(
                shortMonths.findIndex(
                  (item) =>
                    item?.toLowerCase() ===
                    tomorrow?.toDateString().split(" ")?.[1].toLowerCase()
                ) +1
              )
            // due.getMonth() === tomorrow.getMonth() &&
            // due.getFullYear() === tomorrow.getFullYear()
          );
        };

        // Filter cases into metrics categories
        const pastDue = casesList.filter(
          (caseItem) =>
            new Date(caseItem.due_date) < startOfToday &&
            caseItem.status !== "on_hold" &&
            caseItem.status !== "on_hold" &&
            caseItem.status !== "cancelled"
        );
        console.log(casesList, "casesList");
        const dueToday = casesList.filter(
          //active
          (caseItem) =>
            isDueToday(caseItem.due_date) && caseItem.status !== "on_hold"
        );
        const dueTomorrow = casesList.filter(
          (caseItem) =>
            isDueTomorrow(caseItem.due_date) && caseItem.status !== "on_hold"
        );
        const onHold = casesList.filter(
          (caseItem) => caseItem.status === "on_hold"
        );

        setTodaysCellEvent([
          {
            title: `${pastDue.length || 0}`,
            formattedCases: pastDue.map((caseItem) => ({
              case_id: caseItem.id,
              case_number: caseItem.case_number,
              client_name: caseItem.client_name.client_name,
              due_date: caseItem.due_date,
              doctor: caseItem.doctor,
              status: caseItem.status,
              case_products: caseItem.products.map((product) => ({
                name: product.name,
                product_type: product.product_type,
              })),
              invoicesData: caseItem.invoicesData,
              due_day: new Date(caseItem.due_date).getDate(),
            })),
            isActive: false,
            onHold: false,
            isPastDue: true,
            isAllOnHold: false,
            start: startOfToday,
            end: startOfToday,
          },
          {
            title: `${dueToday.length}`,
            formattedCases: dueToday.map((caseItem) => ({
              case_id: caseItem.id,
              case_number: caseItem.case_number,
              client_name: caseItem.client_name.client_name,
              due_date: caseItem.due_date,
              doctor: caseItem.doctor,
              status: caseItem.status,
              case_products: caseItem.products.map((product) => ({
                name: product.name,
                product_type: product.product_type,
              })),
              invoicesData: caseItem.invoicesData,
              due_day: new Date(caseItem.due_date).getDate(),
            })),
            isActive: true,
            onHold: false,
            isPastDue: false,
            isAllOnHold: false,
            start: startOfToday,
            end: startOfToday,
          },
          {
            title: `${dueTomorrow.length}`,
            formattedCases: dueTomorrow.map((caseItem) => ({
              case_id: caseItem.id,
              case_number: caseItem.case_number,
              client_name: caseItem.client_name.client_name,
              due_date: caseItem.due_date,
              doctor: caseItem.doctor,
              status: caseItem.status,
              case_products: caseItem.products.map((product) => ({
                name: product.name,
                product_type: product.product_type,
              })),
              invoicesData: caseItem.invoicesData,
              due_day: new Date(caseItem.due_date).getDate(),
            })),
            isActive: false,
            onHold: false,
            isPastDue: false,
            isTommorow: true,
            isAllOnHold: false,
            start: startOfToday,
            end: startOfToday,
          },
          {
            title: `${onHold.length}`,
            formattedCases: onHold.map((caseItem) => ({
              case_id: caseItem.id,
              case_number: caseItem.case_number,
              client_name: caseItem.client_name.client_name,
              due_date: caseItem.due_date,
              doctor: caseItem.doctor,
              status: caseItem.status,
              case_products: caseItem.products.map((product) => ({
                name: product.name,
                product_type: product.product_type,
              })),
              invoicesData: caseItem.invoicesData,
              due_day: new Date(caseItem.due_date).getDate(),
            })),
            isActive: false,
            onHold: false,
            isPastDue: false,
            isAllOnHold: true,
            start: startOfToday,
            end: startOfToday,
          },
        ]);

        // Set the metriccos
        setMetrics({
          pastDue: pastDue.length || 0,
          dueToday: dueToday.length || 0,
          dueTomorrow: dueTomorrow.length || 0,
          onHold: onHold.length || 0,
        });

        // Fetch all cases for calendar
        // const { data: casesData, error: casesError } = await supabase
        //   .from("cases")
        //   .select("id, due_date, status")
        //   .eq("lab_id", labData.labId)
        //   .gte(
        //     "due_date",
        //     new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
        //   )
        //   .lt(
        //     "due_date",
        //     new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString()
        //   )
        //   .neq("status", "completed");

        // if (casesError) throw casesError;

        // // Group cases by due date for calendar events
        // const eventsByDate = casesData.reduce(
        //   (acc: { [key: string]: number }, caseItem: any) => {
        //     const date = caseItem.due_date.split("T")[0];
        //     acc[date] = (acc[date] || 0) + 1;
        //     return acc;
        //   },
        //   {}
        // );
        console.log(casesList, "casesList");
        const groupedCases = casesList.reduce(
          (acc: Record<string, CasesDues[]>, caseItem: CasesDues) => {
            if (
              ["in_queue", "in_progress", "on_hold"].includes(caseItem.status)
            ) {
              const dueDate = new Date(caseItem.due_date);

              // Force UTC to 12 AM
              const year = dueDate.getUTCFullYear();
              const month = dueDate.getUTCMonth(); // Zero-based, keep as is
              const day = dueDate.getUTCDate();

              // Create a fixed UTC date with 12 AM
              const fixedUTCDate = new Date(
                Date.UTC(year, month, day, 0, 0, 0, 0)
              );

              // Format as YYYY-MM-DD (UTC)
              const dueDateUTC = fixedUTCDate.toISOString().split("T")[0];

              console.log(caseItem.due_date, dueDateUTC, "caseItem.due_date");

              acc[dueDateUTC] = acc[dueDateUTC] || [];
              acc[dueDateUTC].push(caseItem);
            }
            return acc;
          },
          {}
        );

        const events: CalendarEvents[] = Object.entries(groupedCases).map(
          ([date, cases]) => {
            const eventDate = new Date(date);
            console.log(eventDate, "eventDate");
            // const year = eventDate.getFullYear();
            // const month = eventDate.getMonth();
            // const day = eventDate.getDate();
            console.log(cases, "casescases");
            // Ensure start and end times are in UTC
            const [year, month, day] = date.split("-").map(Number);

            // Ensure start and end times are in UTC
            const start = new Date(year, month - 1, day, 0, 0, 0, 0); // 12 AM UTC
            const end = new Date(year, month - 1, day, 0, 0, 0, 0); // 11:59 PM UTC

            console.log("Start:", start.toISOString()); // This should always show the correct UTC date
            console.log("End:", end.toISOString());

            // const start = new Date(year, month, day, 0, 0, 0, 0); // UTC start
            // const end = new Date(year, month, day, 23, 59, 59, 999); // UTC end

            const today = new Date();
            const isPastDue = eventDate < today;

            // Separate cases into "on_hold" and active cases
            const onHoldCases = cases.filter(
              (caseItem) => caseItem.status === "on_hold"
            );
            const activeCases = cases.filter(
              (caseItem) => caseItem.status !== "on_hold"
            );

            // Format all cases
            const formattedCases = cases.map((caseItem) => ({
              case_id: caseItem.id,
              case_number: caseItem.case_number,
              client_name: caseItem.client_name.client_name,
              due_date: caseItem.due_date,
              doctor: caseItem.doctor,
              status: caseItem.status,
              case_products: caseItem.products.map((product) => ({
                name: product.name,
                product_type: product.product_type,
              })),
              invoicesData: caseItem.invoicesData,
              // due_day: new Date(caseItem.due_date).getDate(),
            }));

            return {
              title: `${cases.length}`, // Total number of cases for this date
              start,
              end,
              isActive: onHoldCases.length > 0 ? false : activeCases.length > 0, // Active should be false if any case is on hold
              onHold: onHoldCases.length > 0,
              isPastDue,
              formattedCases,
            };
          }
        );

        setCalendarEvents(events || []);

        // Fetch workstation issues
        const { data: workstationData } = await supabase
          .from("workstation_log")
          .select(
            `
            id,
            type:workstation_types!workstation_type_id (
              id,
              name
            ),
            status,
            issue_reported_at,
            issue_reported_notes,
            custom_workstation_type
          `
          )
          .eq("status", "issue_reported")
          .eq("lab_id", labData.labId)
          .order("issue_reported_at", { ascending: false });

        // Fetch total workstations
        const { count: totalCount } = await supabase
          .from("workstation_types")
          .select("*", { count: "exact", head: true })
          .eq("lab_id", labData.labId)
          .eq("is_active", true);

        let workstationApi: any = workstationData;
        setWorkstationIssues(
          workstationApi?.filter(
            (issue: WorkstationIssue) => issue.type !== null
          ) || []
        );
        setTotalWorkstations(totalCount || 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, [user, casesList, filterType]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
        new Date().getUTCHours(),
        new Date().getUTCMinutes(),
        new Date().getUTCSeconds(),
        new Date().getUTCMilliseconds()
      )
    );
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }
  };

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) {
      return "morning";
    } else if (hours < 17) {
      return "afternoon";
    } else {
      return "evening";
    }
  };

  const keyMetrics = [
    {
      icon: AlertTriangle,
      label: "Cases Past Due",
      value: metrics.pastDue,
      color: "bg-red-500",
      onClick: () => handleCardClick("past_due"),
    },
    {
      icon: Package,
      label: "Cases Due Today",
      value: metrics.dueToday,
      color: "bg-blue-500",
      onClick: () => handleCardClick("due_today"),
    },
    {
      icon: Clock,
      label: "Cases Due Tomorrow",
      value: metrics.dueTomorrow,
      color: "bg-green-400",
      onClick: () => handleCardClick("due_tomorrow"),
    },
    {
      icon: PauseCircle,
      label: "Cases On Hold",
      value: metrics.onHold,
      color: "bg-yellow-500",
      onClick: () => handleCardClick("on_hold"),
    },
  ];

  const handleCardClick = (filterType: string) => {
    navigate(`/cases?filter=${filterType}`);
  };
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">
              Good {getTimeOfDay()}, {user?.name}!
            </h2>
            <p className="text-gray-500">
              {`Here is what is happening in your lab on ${new Date().toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}.`}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="operations"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <div className="space-y-4 p-0">
            {/* Key Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => (
                <Card
                  key={index}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={metric.onClick}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${metric.color}`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Daily Counts and Calendar */}
            <div className="grid grid-cols-12 gap-4">
              {/* Daily Counts */}
              <div className="col-span-4">
                <DailyCountsCard
                  totalDue={keyMetrics[0].value}
                  todayDue={keyMetrics[1].value}
                />
              </div>

              {/* Calendar Section */}
              <Card className="col-span-8 p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-lg font-medium">
                    Due Dates Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <DueDatesCalendar
                    events={calendarEvents}
                    height={400}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    today_cell={todayCellEvents}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-12 gap-4 mt-4">
              {/* Workstation Status */}
              <Card className="col-span-12 lg:col-span-6 bg-white h-full p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-lg font-medium">
                    Workstation Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Active Workstations
                      </p>
                      <p className="text-2xl font-semibold mt-1">
                        {totalWorkstations - workstationIssues.length}/
                        {totalWorkstations}
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-red-50">
                      <p className="text-sm text-gray-500">Issues Reported</p>
                      <p className="text-2xl font-semibold text-red-600 mt-1">
                        {workstationIssues.length}
                      </p>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">
                      Active Issues
                    </h4>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {workstationIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="border-l-4 border-red-500 pl-4 py-3 bg-gray-50 rounded-r"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1 flex-1">
                              <p className="font-medium">
                                {issue.type?.name || "Unknown Workstation"}
                                {issue.custom_workstation_type &&
                                  ` - ${issue.custom_workstation_type}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {issue.issue_reported_notes ||
                                  "No description provided"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs whitespace-nowrap shrink-0"
                            >
                              {getTimeAgo(issue.issue_reported_at)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {workstationIssues.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <Wrench className="h-8 w-8 mb-2 text-gray-400" />
                          <p>No active issues</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="col-span-12 lg:col-span-6">
                <PerformanceMetricsCard />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <SalesDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
