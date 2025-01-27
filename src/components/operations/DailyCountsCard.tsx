import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Clock, CheckCircle, CalendarDays, Package } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DailyCounts {
  casesDue: number;
  pastDueCases: number;
  dueTodayCases: number;
  casesCompleted: number;
  casesReceived: number;
  casesShipped: number;
}

const DailyCountsCard = ({
  totalDue,
  todayDue,
}: {
  totalDue: number;
  todayDue: number;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DailyCounts>({
    casesDue: 0,
    pastDueCases: 0,
    dueTodayCases: 0,
    casesCompleted: 0,
    casesReceived: 0,
    casesShipped: 0,
  });

  useEffect(() => {
    const fetchDailyCounts = async () => {
      if (!user?.id) {
        console.log("No user ID found");
        return;
      }

      // Set today to start of day in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Set tomorrow to start of tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      try {
        // Get all cases that are past due or due today
        const { data: dueCases, error: dueError } = await supabase
          .from("cases")
          .select("id, status, due_date")
          .in("status", ["in_progress", "in_queue"])
          .lte("due_date", tomorrow.toISOString());

        // Get completed cases today
        const { data: completedCases, error: completedError } = await supabase
          .from("cases")
          .select("id, status, updated_at")
          .eq("status", "completed")
          .gte("updated_at", today.toISOString())
          .lt("updated_at", tomorrow.toISOString());

        // Get received cases today
        const { data: receivedCases, error: receivedError } = await supabase
          .from("cases")
          .select("id, created_at")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString());

        // Get shipped cases today
        const { data: shippedCases, error: shippedError } = await supabase
          .from("cases")
          .select("id, status, updated_at")
          .eq("status", "shipped")
          .gte("updated_at", today.toISOString())
          .lt("updated_at", tomorrow.toISOString());

        if (dueCases) {
          // Group cases by past due vs due today
          const pastDueCases = dueCases.filter((c) => {
            const dueDate = new Date(c.due_date);
            return dueDate < today;
          });

          const dueTodayCases = dueCases.filter((c) => {
            const dueDate = new Date(c.due_date);
            return dueDate >= today && dueDate < tomorrow;
          });

          if (dueError || completedError || receivedError || shippedError) {
            console.error("Error fetching daily counts:", {
              dueError,
              completedError,
              receivedError,
              shippedError,
            });
            return;
          }

          setMetrics({
            casesDue: pastDueCases.length + dueTodayCases.length,
            pastDueCases: pastDueCases.length,
            dueTodayCases: dueTodayCases.length,
            casesCompleted: completedCases?.length || 0,
            casesReceived: receivedCases?.length || 0,
            casesShipped: shippedCases?.length || 0,
          });
        }
      } catch (error) {
        console.error("Error in fetchDailyCounts:", error);
      }
    };

    fetchDailyCounts();
    // Set up an interval to refresh data every 5 minutes
    const interval = setInterval(fetchDailyCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const completedCases = metrics.casesCompleted;
  const totalDueCases = metrics.casesDue;
  const completionPercentage =
    totalDueCases > 0 ? Math.round((completedCases / totalDueCases) * 100) : 0;

  // Create segments for the progress bar
  const segments = Array.from({ length: totalDueCases || 1 }, (_, i) => {
    const isCompleted = i < completedCases;
    return {
      id: i + 1,
      status: isCompleted ? "completed" : "pending",
    };
  });

  const metricsDisplay = [
    {
      label: "Cases Due",
      value: metrics.casesDue,
      icon: <Clock className="h-4 w-4 text-white" />,
      bgColor: "bg-purple-500",
    },
    {
      label: "Cases Completed",
      value: metrics.casesCompleted,
      icon: <CheckCircle className="h-4 w-4 text-white" />,
      bgColor: "bg-emerald-500",
    },
    {
      label: "Cases Received",
      value: metrics.casesReceived,
      icon: <Package className="h-4 w-4 text-white" />,
      bgColor: "bg-blue-500",
    },
    {
      label: "Cases Shipped",
      value: metrics.casesShipped,
      icon: <CalendarDays className="h-4 w-4 text-white" />,
      bgColor: "bg-orange-500",
    },
  ];

  return (
    <Card className="bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Today's Daily Counts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="space-y-3 mt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">
                {completedCases}/{totalDueCases}
              </span>
              <span className="text-sm font-medium text-gray-500">
                Cases Completed
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <TooltipProvider>
            <div className="space-y-2">
              <div className="flex gap-1">
                {segments.map((segment) => (
                  <Tooltip key={segment.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          h-2 flex-1 rounded-full transition-all duration-200
                          ${
                            segment.status === "completed"
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-gray-200 hover:bg-gray-300"
                          }
                        `}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        Case {segment.id}:{" "}
                        {segment.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-600">Progress</span>
                <span className="font-medium text-gray-600">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Auto margin spacer */}
        <div className="flex-grow" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-1">
          {/* Cases Due Card */}
          <div
            className="flex items-start space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("/cases")}
          >
            <div className={`rounded-lg p-1.5 ${metricsDisplay[0].bgColor}`}>
              {metricsDisplay[0].icon}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium leading-none">
                {metricsDisplay[0].label}
              </p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold">{totalDue}</p>
                <div className="flex flex-col text-xs space-y-0.5 mt-0.5">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-red-600 font-medium">
                      {totalDue -todayDue} Past Due
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600 font-medium">
                      {todayDue} Due Today
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other metric cards */}
          {metricsDisplay.slice(1).map((metric, index) => (
            <div
              key={metric.label}
              className="flex items-start space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-100 cursor-pointer"
              onClick={() => navigate("/cases")}
            >
              <div className={`rounded-lg p-1.5 ${metric.bgColor}`}>
                {metric.icon}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCountsCard;
