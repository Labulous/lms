import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, PauseCircle, Package, Settings, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";
import DueDatesCalendar from "@/components/calendar/DueDatesCalendar";
import SalesDashboard from "@/components/dashboard/SalesDashboard";

interface WorkstationIssue {
  id: string;
  workstation_type: {
    id: string;
    name: string;
  };
  issue_reported_at: string;
  issue_reported_notes: string;
  custom_workstation_type?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("operations");
  const { user } = useAuth();
  const [workstationIssues, setWorkstationIssues] = useState<WorkstationIssue[]>([]);
  const [totalWorkstations, setTotalWorkstations] = useState(0);
  const [metrics, setMetrics] = useState({
    pastDue: 0,
    dueToday: 0,
    dueTomorrow: 0,
    onHold: 0
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.id) return;
        
        const labData = await getLabIdByUserId(user.id);
        if (!labData?.labId) return;

        // Fetch case metrics and calendar events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all cases for calendar
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, due_date, status')
          .eq('lab_id', labData.labId)
          .gte('due_date', new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
          .lt('due_date', new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString())
          .neq('status', 'completed');

        if (casesError) throw casesError;

        // Group cases by due date for calendar events
        const eventsByDate = casesData.reduce((acc: { [key: string]: number }, caseItem: any) => {
          const date = caseItem.due_date.split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const events = Object.entries(eventsByDate).map(([date, count]) => {
          const eventDate = new Date(date);
          const isPastDue = eventDate < today;
          return {
            id: date,
            title: `${count}`,
            start: eventDate,
            end: eventDate,
            resource: { count, isPastDue }
          };
        });

        setCalendarEvents(events);

        // Fetch past due cases
        const { count: pastDue } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('lab_id', labData.labId)
          .lt('due_date', today.toISOString())
          .neq('status', 'completed');

        // Fetch cases due today
        const { count: dueToday } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('lab_id', labData.labId)
          .gte('due_date', today.toISOString())
          .lt('due_date', tomorrow.toISOString())
          .neq('status', 'completed');

        // Fetch cases due tomorrow
        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);
        const { count: dueTomorrow } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('lab_id', labData.labId)
          .gte('due_date', tomorrow.toISOString())
          .lt('due_date', nextDay.toISOString())
          .neq('status', 'completed');

        // Fetch on hold cases
        const { count: onHold } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('lab_id', labData.labId)
          .eq('status', 'on_hold');

        // Fetch workstation issues
        const { data: workstationData } = await supabase
          .from("workstation_log")
          .select(`
            id,
            type:workstation_types!workstation_type_id (
              id,
              name
            ),
            status,
            issue_reported_at,
            issue_reported_notes,
            custom_workstation_type
          `)
          .eq("status", "issue_reported")
          .eq("lab_id", labData.labId)
          .order("issue_reported_at", { ascending: false });

        // Fetch total workstations
        const { count: totalCount } = await supabase
          .from("workstation_types")
          .select("*", { count: 'exact', head: true })
          .eq("lab_id", labData.labId)
          .eq("is_active", true);

        setMetrics({
          pastDue: pastDue || 0,
          dueToday: dueToday || 0,
          dueTomorrow: dueTomorrow || 0,
          onHold: onHold || 0
        });

        setWorkstationIssues(workstationData?.filter(issue => issue.type !== null) || []);
        setTotalWorkstations(totalCount || 0);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  const getTimeOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) {
      return 'morning';
    } else if (hours < 17) {
      return 'afternoon';
    } else {
      return 'evening';
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Good {getTimeOfDay()}, {user?.full_name}!
          </h1>
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

            {/* Calendar and Workstation Status */}
            <div className="grid grid-cols-12 gap-4">
              {/* Calendar Section */}
              <Card className="col-span-8 p-6">
                <h3 className="text-lg font-semibold mb-4">Due Dates Calendar</h3>
                <DueDatesCalendar events={calendarEvents} height={400} />
              </Card>

              {/* Workstation Status */}
              <Card className="col-span-4 p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Workstation Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Active Workstations</p>
                      <p className="text-xl font-semibold">
                        {totalWorkstations - workstationIssues.length}/{totalWorkstations}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Issues Reported</p>
                      <p className="text-xl font-semibold text-red-600">{workstationIssues.length}</p>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Active Issues</h4>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {workstationIssues.map((issue) => (
                        <div key={issue.id} className="border-l-4 border-red-500 pl-4 py-2 bg-gray-50 rounded-r">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {issue.workstation_type?.name || 'Unknown Workstation'}
                                {issue.custom_workstation_type && ` - ${issue.custom_workstation_type}`}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {issue.issue_reported_notes || 'No description provided'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                              {getTimeAgo(issue.issue_reported_at)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {workstationIssues.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No active issues</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
