import React, { useState, useEffect } from "react";
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
import { format } from "date-fns";

interface CasesDues {
  due_date: string;
  status: string;
}

export interface CalendarEvents {
  title: string;
  start: Date;
  end: Date;
}

const initialKeyMetrics = [
  {
    icon: AlertTriangle,
    label: "Cases Past Due",
    value: 0,
    color: "bg-red-500",
  },
  { icon: Package, label: "Cases Due Today", value: 0, color: "bg-blue-500" },
  {
    icon: Clock,
    label: "Cases Due Tomorrow",
    value: 0,
    color: "bg-green-400",
  },
  {
    icon: PauseCircle,
    label: "Cases On Hold",
    value: 0,
    color: "bg-yellow-500",
  },
];

const Home: React.FC = () => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesList, setCasesList] = useState<CasesDues[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [greeting, setGreeting] = useState("");
  const [keyMetrics, setKeyMetrics] = useState(initialKeyMetrics);
  const [casesEvents, setCasesEvents] = useState<CalendarEvents[]>([]);
  const [activeTab, setActiveTab] = useState("operations");
  const { user } = useAuth();
  const userName = user ? user.name : "User";

  useEffect(() => {
    setCases(getCases());

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
                id,
                status,
               due_date
              `
          )
          .eq("lab_id", lab.labId)
          .order("created_at", { ascending: true });
        const data = casesData
          ? casesData
              .filter(
                (caseItem) =>
                  caseItem.status !== "completed" &&
                  caseItem.status !== "cancelled"
              )
              .map((caseItem) => caseItem)
          : [];
        console.log(casesData, "casesData");
        if (casesError) {
          console.error("Error fetching completed invoices:", casesError);
          return;
        }

        setCasesList(data);
      } catch (error) {
        console.error("Error fetching completed invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    getCompletedInvoices();
  }, []);

  console.log(casesList, "casesList");

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

  const formatCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
      .toISOString()
      .split("T")[0];

    // Count cases based on the given conditions
    const pastDue = casesList.filter(
      (caseItem) =>
        new Date(caseItem.due_date).toISOString().split("T")[0] < today
    ).length;

    const dueToday = casesList.filter(
      (caseItem) => caseItem.due_date.split("T")[0] === today
    ).length;

    const dueTomorrow = casesList.filter(
      (caseItem) => caseItem.due_date.split("T")[0] === tomorrow
    ).length;

    const onHold = casesList.filter(
      (caseItem) => caseItem.status === "on_hold"
    ).length;

    console.log(casesList, "casesList");

    // Group the cases by due date and status
    const groupedCases: Record<string, number> = casesList.reduce(
      (acc, caseItem) => {
        // Debugging log to inspect each case
        console.log(
          `Processing case: ${caseItem.due_date}, Status: ${caseItem.status}`
        );

        if (["in_queue", "in_progress"].includes(caseItem.status)) {
          const dueDate = new Date(caseItem.due_date)
            .toISOString()
            .split("T")[0]; // Ensure consistent date format (YYYY-MM-DD)
          console.log(`Due Date (formatted): ${dueDate}`);

          acc[dueDate] = (acc[dueDate] || 0) + 1;
        }

        return acc;
      },
      {} as Record<string, number>
    );

    console.log(groupedCases, "groupedCases");

    // Map the grouped cases to calendar events
    const calendarEvents = Object.entries(groupedCases).map(([date, count]) => {
      // Parse the date string into a Date object
      const eventDate = new Date(date);

      // Extract the year, month, and day
      const year = eventDate.getFullYear();
      const month = eventDate.getMonth(); // Month is 0-based, so it will be 0-11
      const day = eventDate.getDate();

      // Format the event date (for display purposes)
      const formattedDate = format(eventDate, "MMM dd, yyyy");

      // Create the start and end Date objects based on the parsed eventDate
      const start = new Date(year, month, day, 9, 0); // 9 AM
      const end = new Date(year, month, day, 17, 0); // 5 PM

      return {
        title: count.toString(),
        start,
        end,
        formattedDate, // Optionally add this for display purposes
      };
    });

    // Update key metrics
    setKeyMetrics([
      {
        icon: AlertTriangle,
        label: "Cases Past Due",
        value: pastDue,
        color: "bg-red-500",
      },
      {
        icon: Package,
        label: "Cases Due Today",
        value: dueToday,
        color: "bg-blue-500",
      },
      {
        icon: Clock,
        label: "Cases Due Tomorrow",
        value: dueTomorrow,
        color: "bg-green-400",
      },
      {
        icon: PauseCircle,
        label: "Cases On Hold",
        value: onHold,
        color: "bg-yellow-500",
      },
    ]);

    // Update calendar events
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {keyMetrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow flex items-center space-x-4"
              >
                <div
                  className={`p-3 rounded-full ${metric.color} bg-opacity-10 flex items-center justify-center`}
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

          <div className="grid grid-cols-1 gap-6">
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
              <DueDatesCalendar events={casesEvents} />
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
