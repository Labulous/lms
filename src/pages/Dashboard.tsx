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
  isPastDue?: boolean;
  isActive?: boolean;
  resource: any;
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
        const today = new Date(
          Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate()
          )
        );

        // Get tomorrow's date in UTC
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(today.getUTCDate() + 1); // Set tomorrow's date in UTC
        // Set tomorrow's date

        // Set the start and end of today to compare full date range
        const startOfToday = new Date(today);
        startOfToday.setUTCHours(0, 0, 0, 0); // Set hours to 12:00 AM (UTC)

        // End of today in UTC (11:59:59.999 PM UTC)
        const endOfToday = new Date(today);
        endOfToday.setUTCHours(23, 59, 59, 999); //

        // Function to check if a date is due today
        const isDueToday = (dueDate: string) => {
          const due = new Date(dueDate);
          return due >= startOfToday && due <= endOfToday;
        };

        // Function to check if a date is due tomorrow
        const isDueTomorrow = (dueDate: string) => {
          const due = new Date(dueDate);
          return (
            due.getDate() === tomorrow.getDate() &&
            due.getMonth() === tomorrow.getMonth() &&
            due.getFullYear() === tomorrow.getFullYear()
          );
        };

        // Filter cases into metrics categories
        const pastDue = casesList.filter(
          (caseItem) =>
            new Date(caseItem.due_date) < startOfToday &&
            caseItem.status !== "on_hold"
        ).length;
        const dueToday = casesList.filter(
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
        // Set the metriccos
        setMetrics({
          pastDue: pastDue || 0,
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

        const groupedCases = casesList.reduce(
          (acc: Record<string, CasesDues[]>, caseItem: CasesDues) => {
            if (
              ["in_queue", "in_progress", "on_hold"].includes(caseItem.status)
            ) {
              const dueDate = new Date(caseItem.due_date)
                .toISOString()
                .split("T")[0];
              acc[dueDate] = acc[dueDate] || [];
              acc[dueDate].push(caseItem);
            }
            return acc;
          },
          {}
        );

        const events: CalendarEvents[] = Object.entries(groupedCases)
          .map(([date, cases]) => {
            const eventDate = new Date(date); // Assuming this is already in local time
            const year = eventDate.getFullYear(); // Local year
            const month = eventDate.getMonth(); // Local month (0-based)
            const day = eventDate.getDate(); // Local day of the month
            // Set the event start and end times in local time (12:00 AM to 11:59 PM)
            const start = new Date(year, month, day, 0, 0); // 12:00 AM Local Time
            const end = new Date(year, month, day, 23, 59, 59, 999); // 11:59 PM Local Time

            const today = new Date();
            const isPastDue = eventDate < today;

            // Separate cases into "on_hold" and active cases
            const onHoldCases = cases.filter(
              (caseItem) => caseItem.status === "on_hold"
            );
            const activeCases = cases.filter(
              (caseItem) => caseItem.status !== "on_hold"
            );

            // Format active cases
            const formattedActiveCases = activeCases.map((caseItem) => {
              const caseDueDate = new Date(caseItem.due_date); // Convert case due date to Date object
              const caseDueDay = caseDueDate.getDate(); // Get local day of the case's due date

              return {
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
                due_day: caseDueDay, // Store the actual due day to check later
              };
            });

            // Format "on_hold" cases
            const formattedOnHoldCases = onHoldCases.map((caseItem) => {
              const caseDueDate = new Date(caseItem.due_date); // Convert case due date to Date object
              const caseDueDay = caseDueDate.getDate(); // Get local day of the case's due date

              return {
                case_id: caseItem.id,
                case_number: caseItem.case_number,
                client_name: caseItem.client_name.client_name,
                doctor: caseItem.doctor,
                status: caseItem.status,
                due_date: caseItem.due_date,
                case_products: caseItem.products.map((product) => ({
                  name: product.name,
                  product_type: product.product_type,
                })),
                invoicesData: caseItem.invoicesData,
                due_day: caseDueDay, // Store the actual due day to check later
              };
            });
            const formattedDueTommorwCases = dueTomorrow.map((caseItem) => {
              const caseDueDate = new Date(caseItem.due_date); // Convert case due date to Date object
              const caseDueDay = caseDueDate.getDate(); // Get local day of the case's due date

              return {
                case_id: caseItem.id,
                case_number: caseItem.case_number,
                client_name: caseItem.client_name.client_name,
                doctor: caseItem.doctor,
                status: caseItem.status,
                due_date: caseItem.due_date,
                case_products: caseItem.products.map((product) => ({
                  name: product.name,
                  product_type: product.product_type,
                })),
                invoicesData: caseItem.invoicesData,
                due_day: caseDueDay, // Store the actual due day to check later
              };
            });
            const formattedOnholdCases = onHold.map((caseItem) => {
              const caseDueDate = new Date(caseItem.due_date); // Convert case due date to Date object
              const caseDueDay = caseDueDate.getDate(); // Get local day of the case's due date

              return {
                case_id: caseItem.id,
                case_number: caseItem.case_number,
                client_name: caseItem.client_name.client_name,
                doctor: caseItem.doctor,
                status: caseItem.status,
                due_date: caseItem.due_date,
                case_products: caseItem.products.map((product) => ({
                  name: product.name,
                  product_type: product.product_type,
                })),
                invoicesData: caseItem.invoicesData,
                due_day: caseDueDay, // Store the actual due day to check later
              };
            });

            // Create the event for active cases
            const activeEvent = {
              title: `${formattedActiveCases.length}`, // Example: "3 active cases"
              start,
              end,
              isActive: true,
              resource: { count: activeCases.length, isPastDue: isPastDue },
              formattedCases: formattedActiveCases, // Filter cases to only show on the correct day
            };

            // Create the event for "on_hold" cases
            const onHoldEvent = {
              title: `${
                formattedOnHoldCases.length > 0
                  ? formattedOnHoldCases.filter(
                      (caseItem) => caseItem.due_day === day
                    ).length
                  : ""
              }`, // Example: "2 on hold"
              start,
              end,
              onHold: true,
              resource: { count: onHoldCases.length, isPastDue: isPastDue },
              formattedCases: formattedOnHoldCases.filter(
                (caseItem) => caseItem.due_day === day
              ), // Filter cases to only show on the correct day
            };

            const pastDueEvent = {
              title: `${
                formattedOnHoldCases.length > 0
                  ? formattedActiveCases.filter(
                      (caseItem) => caseItem.due_day < day
                    ).length
                  : ""
              }`, // Example: "2 on hold"
              start: startOfToday,
              end: endOfToday,
              isPastDue: true,
              resource: { count: onHoldCases.length, isPastDue: isPastDue },
              formattedCases: formattedActiveCases.filter(
                (caseItem) => caseItem.due_day < day
              ), // Filter cases to only show on the correct day
            };
            const tomorowEvent = {
              title: `${formattedDueTommorwCases.length || ""}`, // Example: "2 on hold"
              start: startOfToday,
              end: endOfToday,
              isTommorow: true,
              isAllOnHold: false,
              id: 1,
              resource: { count: 0, isPastDue: false },
              formattedCases: formattedDueTommorwCases,
            };
            const onHoldAllEvent = {
              title: `${formattedOnholdCases.length ?? ""}`, // Example: "2 on hold"
              start: startOfToday,
              end: endOfToday,
              id: 2,
              // isAllOnHold: true,
              resource: { count: 0, isPastDue: false },
              formattedCases: formattedOnholdCases,
            };
            // Return both events (active and on hold)
            if (filterType === "on_hold") {
              return [onHoldEvent];
            } else if (filterType === "today_cell") {
              // Assuming tomorowEvent and onHoldAllEvent are arrays or objects that contain events
              const allEvents = [
                ...tomorowEvent.formattedCases, // assuming formattedCases is an array in tomorowEvent
                ...onHoldAllEvent.formattedCases, // assuming formattedCases is an array in onHoldAllEvent
              ];
              const tommorow = [tomorowEvent][0];
              const onHOld = [onHoldAllEvent][0];

              return [tommorow, onHOld];
            } else {
              return [activeEvent];
            }

            // return [activeEvent, onHoldEvent, tomorowEvent, onHoldAllEvent];
          })
          .flat(); // Flatten the array because we have two events per date (active and on hold)

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
    const now = new Date();
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
              Here's what's happening in your lab today.
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
