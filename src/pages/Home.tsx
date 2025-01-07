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

    const pastDue = casesList.filter(
      (caseItem) => new Date(caseItem.due_date) < new Date(today)
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

    const groupedCases: Record<string, number> = casesList.reduce(
      (acc, caseItem) => {
        if (["in_queue", "in_progress"].includes(caseItem.status)) {
          const dueDate = new Date(caseItem.due_date)
            .toISOString()
            .split("T")[0];
          acc[dueDate] = (acc[dueDate] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const calendarEvents = Object.entries(groupedCases).map(([date, count]) => {
      const eventDate = new Date(date);
      return {
        title: count.toString(),
        start: new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
          9,
          0
        ),
        end: new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
          17,
          0
        ),
      };
    });
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

    // Update the calendar events
    setCasesEvents(calendarEvents);
  }, [casesList]);

  return (
    <div className="container mx-auto px-5 py-4">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">{greeting}</h1>
      <p className="text-sm text-gray-500 mb-6">{formatCurrentDate()}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {keyMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center p-3 ${metric.color} rounded-lg`}
              >
                <metric.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <h3 className="text-sm font-medium text-gray-500 mt-0.5">
                  {metric.label}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/5">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Due Dates Calendar here
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Expand
              </Button>
            </div>
            <div className="h-[500px]">
              <DueDatesCalendar events={casesEvents} />
            </div>
          </div>
        </div>

        <div className="lg:w-2/5">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Cases In Progress
            </h2>
            <div className="space-y-4">
              {casesInProgress.map((caseItem, index) => (
                <div
                  key={index}
                  className="border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {caseItem.client}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {caseItem.patient}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {caseItem.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {caseItem.stage}
                    </span>
                    <div className="w-1/2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-700 h-2.5 rounded-full"
                          style={{ width: `${caseItem.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCalendarModalOpen && (
        <CalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          events={casesEvents}
        />
      )}
    </div>
  );
};

export default Home;
