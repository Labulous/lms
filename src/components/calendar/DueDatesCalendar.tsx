import React, { useState, useCallback, useEffect, SetStateAction } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  View,
  NavigateAction,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
// import enUS from "date-fns/locale/en-US";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalendarEvents } from "@/pages/Home";
import "./calendar.css";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";

const locales = {
  "en-US": "en",
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DueDatesCalendarProps {
  events?: CalendarEvents[];
  today_cell?: CalendarEvents[];
  height?: number;
  filterType: string;
  setFilterType: React.Dispatch<SetStateAction<string>>;
}

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: NavigateAction) => void;
  label: string;
  filterType?: string;
  onFilterChange?: (filter: string) => void;
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  date,
  onNavigate,
  label,
  filterType = "due_date",
  onFilterChange = () => {},
}) => (
  <div className="rbc-toolbar">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onNavigate("PREV")}
        className="rbc-btn-group"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onNavigate("NEXT")}
        className="rbc-btn-group"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <h2 className="text-lg font-semibold">{label}</h2>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onNavigate("TODAY")}
        className="rbc-btn-group"
      >
        Today
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 px-3 text-xs">
            {filterType === "due_date"
              ? "Due Date"
              : filterType === "on_hold"
              ? "On Hold"
              : filterType}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1">
          <div className="space-y-1">
            <Button
              variant={filterType === "due_date" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs"
              onClick={() => onFilterChange("due_date")}
            >
              Due Date
            </Button>
            <Button
              variant={filterType === "on_hold" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs"
              onClick={() => onFilterChange("on_hold")}
            >
              On Hold
            </Button>
            <Button
              variant={filterType === "on_hold" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs"
              onClick={() => onFilterChange("today_cell")}
            >
              Today's Cell
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

const CustomDateCell = ({ date, events }: { date: Date; events: any[] }) => {
  return (
    <div className="rbc-date-cell">
      <div className="custom-date-cell">
        <span className="date-number">{format(date, "d")}</span>
        {events.length + 1 > 0 && (
          <div className="badge-container">
            <span
              className="count-badge "
              style={{ backgroundColor: "green !important" }}
            >
              {events.length + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const DueDatesCalendar: React.FC<DueDatesCalendarProps> = ({
  events = [],
  height = 500,
  filterType,
  setFilterType,
  today_cell = [],
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvents | null>(null);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);
  const navigate = useNavigate();

  const filteredEvents = events.filter((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Filter based on filterType
    if (filterType === "due_date") {
      return event.isActive;
    } else if (filterType === "on_hold") {
      return event.onHold;
    }

    return true;
  });

  const handleNavigate = useCallback(
    (action: "PREV" | "NEXT" | "TODAY") => {
      let newDate = new Date(currentDate);

      switch (action) {
        case "PREV":
          setAnimationDirection("right");
          newDate = subMonths(newDate, 1);
          break;
        case "NEXT":
          setAnimationDirection("left");
          newDate = addMonths(newDate, 1);
          break;
        case "TODAY":
          newDate = new Date();
          setAnimationDirection(currentDate > newDate ? "right" : "left");
          break;
        default:
          return;
      }

      setCurrentDate(newDate);

      setTimeout(() => {
        setAnimationDirection(null);
      }, 300);
    },
    [currentDate]
  );

  const calendarNavigate = useCallback(
    (newDate: Date, view: View, action: NavigateAction) => {
      if (!isNaN(newDate.getTime())) {
        switch (action) {
          case "PREV":
          case "NEXT":
          case "TODAY":
            handleNavigate(action);
            break;
          default:
            setCurrentDate(newDate);
        }
      }
    },
    [handleNavigate]
  );

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
  };

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return {
        style: {
          backgroundColor: "#DEECF9", // Highlight color
        },
      };
    }
    return {};
  };

  const components = {
    toolbar: (props: any) => (
      <CustomToolbar
        {...props}
        date={currentDate}
        onNavigate={handleNavigate}
        label={format(currentDate, "MMMM yyyy")}
        filterType={filterType}
        onFilterChange={handleFilterChange}
      />
    ),
    dateCellWrapper: (props: any) => {
      const eventsForDate = events.filter((event) => {
        const eventDate = new Date(event.start);
        return (
          eventDate.getDate() === props.value.getDate() &&
          eventDate.getMonth() === props.value.getMonth() &&
          eventDate.getFullYear() === props.value.getFullYear()
        );
      });
      return <CustomDateCell date={props.value} events={eventsForDate} />;
    },
    event: ({ event }: { event: CalendarEvents }) => (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            onMouseEnter={() => handleEventHover(event)}
            title=""
            className="w--full grid relative"
          >
            {filterType !== "today_cell" && (
              <>
                {event.onHold &&
                  !event.isActive &&
                  event.title &&
                  event.title !== "0" && (
                    <div className="bg-yellow-500 col-span-4 w text-sm absolute bottom-[8px] left-2 w-[22px] pt-0.5 h-[22px]  rounded-full text-center">
                      {event.title}
                    </div>
                  )}
                {event.isActive && !event.onHold && event.title !== "0" && (
                  <div
                    className={` ${"bg-blue-500"}  rounded-full h-[22px] text-center pt-0.5 w-[22px] text-sm col-span-8`}
                  >
                    {event.title}
                  </div>
                )}
              </>
            )}

            <div>
              {filterType === "today_cell" && (
                <div className=" flex justify-between items-center ">
                  {event.isPastDue && (
                    <div className="bg-red-500   col-span-4 w text-sm left-4 bottom-0 w-[22px] pt-0.5 h-[22px]  rounded-full text-center">
                      {event.title}
                    </div>
                  )}
                  {event.isActive && event.title !== "0" && (
                    <div
                      className={` ${"bg-blue-500"}  absolute -top-9 left-2 rounded-full h-[22px] text-center pt-0.5 w-[22px] text-sm col-span-8`}
                    >
                      {event.title}
                    </div>
                  )}
                  {event.isTommorow && event.title !== "0" && (
                    <div
                      className={` ${"bg-green-500"}  absolute -top-16 left-8 rounded-full h-[22px] text-center pt-0.5 w-[22px] text-sm col-span-8`}
                    >
                      {event.title}
                    </div>
                  )}

                  {event.isAllOnHold && event.title && event.title !== "0" && (
                    <div className="bg-yellow-500  mb-6 z-50  absolute  col-span-4 w text-sm left-16 bottom-6 w-[22px] pt-0.5 h-[22px]  rounded-full text-center">
                      {event.title}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          onMouseLeave={() => handleEventHover(null)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {format(event.start, "MMMM d, yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {event.title} {events.length === 1 ? "case" : "cases"} due
                </p>
              </div>
              <Button
                onClick={() =>
                  handleEventClick(event.formattedCases[0].due_date)
                }
                size="sm"
                className="whitespace-nowrap"
              >
                View CaseList
              </Button>
            </div>

            <Separator />

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {event.formattedCases.map((event: any, index: number) => (
                  <div
                    key={index}
                    className="group flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate(`/cases/${event.case_id}`)}
                  >
                    {/* Header Section */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          #{event.case_number}
                        </span>
                        <Badge
                          variant={
                            event.status === "in_progress"
                              ? "default"
                              : event.status === "on_hold"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] px-2 py-0"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      {/* <span className="text-xs text-muted-foreground">{event.due_date}</span> */}
                    </div>

                    {/* Main Content */}
                    <div className="space-y-3 text-sm">
                      {/* Client & Doctor Section */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Client</span>
                          <span
                            className="font-medium truncate max-w-[180px]"
                            title={event.client_name}
                          >
                            {event.client_name}
                          </span>
                        </div>
                        {event.doctor?.name && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Doctor
                            </span>
                            <span
                              className="font-medium truncate max-w-[180px]"
                              title={event.doctor.name}
                            >
                              {event.doctor.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Products Section */}
                      {event.case_products?.[0]?.name && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Product
                            </span>
                            <span
                              className="font-medium truncate max-w-[180px]"
                              title={event.case_products[0].name}
                            >
                              {event.case_products[0].name}
                              {event.case_products.length > 1 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  +{event.case_products.length - 1}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Invoice Section */}
                      {event.invoicesData?.length > 0 && (
                        <div className="rounded-md bg-muted/50 p-2 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">Invoice Details</span>
                          </div>
                          {event.invoicesData?.[0]?.status && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Status
                              </span>
                              <span className="font-medium">
                                {event.invoicesData[0].status}
                              </span>
                            </div>
                          )}
                          {event.invoicesData?.[0]?.amount && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Total
                              </span>
                              <span className="font-medium">
                                ${event.invoicesData[0].amount}
                              </span>
                            </div>
                          )}
                          {event.invoicesData?.[0]?.due_amount && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Due</span>
                              <span className="font-medium text-destructive">
                                ${event.invoicesData[0].due_amount}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </HoverCardContent>
      </HoverCard>
    ),
  };

  const eventStyleGetter = (event: any) => {
    const isPastDue = event.resource?.isPastDue;

    return {
      style: {
        backgroundColor: isPastDue ? "#ef4444" : "#2563eb", // red-500 for past due, blue-600 for normal
        color: "white",
        border: "0px",
        padding: "2px",
        whiteSpace: "normal", // Allow text wrapping
        overflow: "visible", // Prevent hidden text
        display: "flex", // Use flex to align multiple events properly
        justifyContent: "start",
        alignItems: "start",
        fontSize: "12px",
      },
    };
  };

  const handleEventClick = (event: any) => {
    // Convert to ISO string and extract only the date part (YYYY-MM-DD)
    const date = new Date(event).toISOString().split("T")[0];

    // Pass the formatted date to the URL
    navigate(`/cases?dueDate=${date}&status=in_progress%2Cin_queue`);
  };

  const handleEventHover = (event: CalendarEvents | null) => {
    setHoveredEvent(event);
  };
  console.log(events, "event hover");
  const staticEvents: CalendarEvents[] = [
    {
      id: 1,
      title: "1",
      start: new Date(2025, 1, 16, 10, 0),
      end: new Date(2025, 1, 16, 11, 30),
      isPastDue: true,
      formattedCases: [
        {
          case_id: "1",
          client_name: "zahid",
          doctor: {
            name: "hussain",
          },
          due_date: "caseItem.due_date",
          case_products: [1, 2].map((product) => ({
            name: "product.name",
            product_type: { name: "name" },
          })),
          invoicesData: [],
        },
      ],
    },
    {
      id: 2,
      title: "2",
      start: new Date(2025, 1, 16, 10, 0),
      end: new Date(2025, 1, 16, 11, 30),
      isAllOnHold: true,
      formattedCases: [
        {
          case_id: "2",
          client_name: "zahid",
          doctor: {
            name: "hussain",
          },
          due_date: "caseItem.due_date",
          case_products: [1, 2].map((product) => ({
            name: "product.name",
            product_type: { name: "name" },
          })),
          invoicesData: [],
        },
      ],
    },
    {
      id: 3,
      title: "3",
      start: new Date(2025, 1, 16, 10, 0),
      end: new Date(2025, 1, 16, 11, 30),
      isTommorow: true,
      formattedCases: [
        {
          case_id: "3",
          client_name: "zahid",
          doctor: {
            name: "hussain",
          },
          due_date: "caseItem.due_date",
          case_products: [1, 2].map((product) => ({
            name: "product.name",
            product_type: { name: "name" },
          })),
          invoicesData: [],
        },
      ],
    },
    {
      id: 3,
      title: "4",
      start: new Date(2025, 1, 16, 10, 0),
      end: new Date(2025, 1, 16, 11, 30),
      isActive: true,
      formattedCases: [],
    },
  ];
  console.log(filteredEvents, "filteredEvents");
  return (
    <>
      <div className="calendar-wrapper" style={{ height }}>
        <div
          className={`calendar-container ${
            animationDirection ? `slide-${animationDirection}` : ""
          }`}
        >
          <Calendar
            localizer={localizer}
            events={filterType === "today_cell" ? today_cell : filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height }}
            views={["month"]} // Make sure to include the right views
            components={components}
            onNavigate={calendarNavigate}
            date={currentDate}
            toolbar={true}
            defaultDate={currentDate}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventStyleGetter}
            showAllEvents={filterType === "today_cell"}
            className="calendar-container"
          />
        </div>
      </div>
    </>
  );
};

export default DueDatesCalendar;
