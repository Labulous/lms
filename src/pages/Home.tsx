import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  PauseCircle,
  Package,
  Maximize2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import DueDatesCalendar from "../components/calendar/DueDatesCalendar";
import CalendarModal from "../components/calendar/CalendarModal";
import { getCases, Case } from "../data/mockCasesData";
import { Button } from "../components/ui/button";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import DailyCountsCard from "../components/operations/DailyCountsCard";
import { format } from "date-fns";

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

export interface CalendarEvents {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  onHold?: boolean;
  isTommorow?: boolean;
  isAllOnHold?: boolean;
  isPastDue?: boolean;
  isActive?: boolean;
  formattedCases: {
    due_date?: string;
    case_id: string;
    client_name: string;
    doctor: { name: string };
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

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (filterType: string) => {
    switch (filterType) {
      case "past_due":
        navigate("/cases?filter=past_due");
        break;
      case "due_today":
        navigate("/cases?filter=due_today");
        break;
      case "due_tomorrow":
        navigate("/cases?filter=due_tomorrow");
        break;
      case "on_hold":
        navigate("/cases?filter=on_hold");
        break;
    }
  };

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  // const [cases, setCases] = useState<Case[]>([]);
  const [casesList, setCasesList] = useState<CasesDues[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [greeting, setGreeting] = useState("");
  const [keyMetrics, setKeyMetrics] = useState([
    {
      icon: AlertTriangle,
      label: "Cases Past Due",
      value: 0,
      color: "bg-red-500",
      onClick: () => handleCardClick("past_due"),
    },
    {
      icon: Package,
      label: "Cases Due Today",
      value: 0,
      color: "bg-blue-500",
      onClick: () => handleCardClick("due_today"),
    },
    {
      icon: Clock,
      label: "Cases Due Tomorrow",
      value: 0,
      color: "bg-green-400",
      onClick: () => handleCardClick("due_tomorrow"),
    },
    {
      icon: PauseCircle,
      label: "Cases On Hold",
      value: 0,
      color: "bg-yellow-500",
      onClick: () => handleCardClick("on_hold"),
    },
  ]);
  const [casesEvents, setCasesEvents] = useState<CalendarEvents[]>([]);
  const [activeTab, setActiveTab] = useState("operations");
  const { user } = useAuth();
  const userName = user ? user.name : "User";

  useEffect(() => {
    // setCases(getCases());

    const hour = new Date().getHours();
    if (hour < 12) setGreeting(`Good morning, ${userName}!`);
    else if (hour < 18) setGreeting(`Good afternoon, ${userName}!`);
    else setGreeting(`Good evening, ${userName}!`);
  }, []);

  useEffect(() => {
    const getCompletedInvoices = async () => {
      setLoading(true);

      try {
        const lab = await getLabIdByUserId(user?.id as string);

        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }

        const { data: casesData, error: casesError } = await supabase
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
              )
            `
          )
          .eq("lab_id", lab.labId)
          .in("status", ["in_queue", "in_progress"]) // Filter for both statuses
          .order("created_at", { ascending: true });

        if (casesError) {
          console.error("Error fetching completed invoices:", casesError);
          return;
        }

        const enhancedCases = await Promise.all(
          casesData.map(async (singleCase) => {
            const productsIdArray =
              singleCase.product_ids?.map((p) => p.products_id) || [];

            if (productsIdArray.length === 0) {
              return { ...singleCase, products: [] }; // No products for this case
            }

            // Fetch products for the current case
            const { data: productData, error: productsError } = await supabase
              .from("products")
              .select(
                `
                  id,
                  name,
                  product_type:product_types!product_type_id (
                    name
                  )
                `
              )
              .eq("lab_id", lab.labId)
              .in("id", productsIdArray);

            if (productsError) {
              console.error(
                `Error fetching products for case ${singleCase.id}:`,
                productsError
              );
            }

            return { ...singleCase, products: productData || [] };
          })
        );

        console.log(enhancedCases, "enhancedCases");

        setCasesList(enhancedCases as any); // Set the enhanced cases list
      } catch (error) {
        console.error("Error fetching completed invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    getCompletedInvoices();
  }, []);

  const casesInProgress = [
    {
      client: "Coal Harbour Dental",
      patient: "Matthias Cook",
      dueDate: "Today",
      stage: "Custom Shading",
      progress: 60,
    },
    {
      client: "Smile Dental",
      patient: "Emma Thompson",
      dueDate: "Tomorrow",
      stage: "Waxing",
      progress: 40,
    },
    {
      client: "Bright Teeth Clinic",
      patient: "John Doe",
      dueDate: "In 2 days",
      stage: "Modeling",
      progress: 20,
    },
  ];

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(
      new Date().setUTCDate(new Date().getUTCDate() + 1)
    )
      .toISOString()
      .split("T")[0];

    const pastDue = casesList.filter(
      (caseItem: CasesDues) =>
        new Date(caseItem.due_date).toISOString().split("T")[0] < today
    ).length;

    const dueToday = casesList.filter(
      (caseItem: CasesDues) => caseItem.due_date.split("T")[0] === today
    ).length;

    const dueTomorrow = casesList.filter(
      (caseItem: CasesDues) => caseItem.due_date.split("T")[0] === tomorrow
    ).length;

    const onHold = casesList.filter(
      (caseItem: CasesDues) => caseItem.status === "on_hold"
    ).length;

    const groupedCases = casesList.reduce(
      (acc: Record<string, CasesDues[]>, caseItem: CasesDues) => {
        if (["in_queue", "in_progress"].includes(caseItem.status)) {
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

    const calendarEvents: CalendarEvents[] = Object.entries(groupedCases).map(
      ([date, cases]) => {
        const eventDate = new Date(date);
        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth();
        const day = eventDate.getUTCDate();
        const start = new Date(Date.UTC(year, month, day, 9, 0));
        const end = new Date(Date.UTC(year, month, day, 17, 0));

        const formattedCases = cases.map((caseItem) => ({
          case_id: caseItem.id,
          case_number: caseItem.case_number,
          client_name: caseItem.client_name.client_name,
          doctor: caseItem.doctor,
          status: caseItem.status,
          case_products: caseItem.products.map((product) => ({
            name: product.name,
            product_type: product.product_type,
          })),
          invoicesData: caseItem.invoicesData,
        }));
        // Map the grouped cases to calendar events

        return {
          title: `${cases.length}`, // Example: "3 cases"
          start,
          end,
          formattedCases,
        };
      }
    );

    setKeyMetrics([
      {
        icon: AlertTriangle,
        label: "Cases Past Due",
        value: pastDue,
        color: "bg-red-500",
        onClick: () => handleCardClick("past_due"),
      },
      {
        icon: Package,
        label: "Cases Due Today",
        value: dueToday,
        color: "bg-blue-500",
        onClick: () => handleCardClick("due_today"),
      },
      {
        icon: Clock,
        label: "Cases Due Tomorrow",
        value: dueTomorrow,
        color: "bg-green-400",
        onClick: () => handleCardClick("due_tomorrow"),
      },
      {
        icon: PauseCircle,
        label: "Cases On Hold",
        value: onHold,
        color: "bg-yellow-500",
        onClick: () => handleCardClick("on_hold"),
      },
    ]);

    setCasesEvents(calendarEvents);
  }, [casesList]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {keyMetrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow flex items-center space-x-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-gray-50"
                onClick={metric.onClick}
              >
                <div
                  className={`p-3 rounded-full ${metric.color} bg-opacity-10 flex items-center justify-center transition-all duration-200 group-hover:bg-opacity-20`}
                >
                  <metric.icon
                    className={`w-6 h-6 ${metric.color.replace(
                      "bg",
                      "text"
                    )} text-opacity-100`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-xl font-semibold">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar and Daily Counts */}
          <div className="grid grid-cols-12 gap-4">
            {/* Calendar Section */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">Due Dates Calendar</h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCalendarModalOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* <DueDatesCalendar events={casesEvents} /> */}
              </div>
            </div>

            {/* Daily Counts Section */}
            <div className="col-span-12 lg:col-span-4">
              {/* <DailyCountsCard /> */}
            </div>
          </div>

          {isCalendarModalOpen && (
            <CalendarModal
              isOpen={isCalendarModalOpen}
              onClose={() => setIsCalendarModalOpen(false)}
              events={casesEvents}
            />
          )}
        </TabsContent>

        <TabsContent value="sales">
          <SalesDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
