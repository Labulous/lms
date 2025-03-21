import React, { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
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
  height?: number;
}

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  label: string;
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  date,
  onNavigate,
  label,
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
    <button
      type="button"
      onClick={() => onNavigate("TODAY")}
      className="rbc-btn-group"
    >
      Today
    </button>
  </div>
);

const CustomDateCell = ({ date, events }: { date: Date; events: any[] }) => {
  return (
    <div className="rbc-date-cell">
      <div className="custom-date-cell">
        <span className="date-number">{format(date, "d")}</span>
        {events.length > 0 && (
          <div className="badge-container">
            <span
              className="count-badge "
              style={{ backgroundColor: "green !important" }}
            >
              {events.length}
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
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvents | null>(null);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (action: "PREV" | "NEXT" | "TODAY") => {
      let newDate;
      switch (action) {
        case "PREV":
          setAnimationDirection("right");
          newDate = subMonths(currentDate, 1);
          break;
        case "NEXT":
          setAnimationDirection("left");
          newDate = addMonths(currentDate, 1);
          break;
        case "TODAY":
          newDate = new Date();
          setAnimationDirection(currentDate > new Date() ? "right" : "left");
          break;
        default:
          return;
      }

      setCurrentDate(newDate);

      // Reset animation direction after animation completes
      setTimeout(() => {
        setAnimationDirection(null);
      }, 300);
    },
    [currentDate]
  );

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
  console.log(events, "events");
  const components = {
    toolbar: (props: any) => (
      <CustomToolbar
        date={props.date}
        onNavigate={handleNavigate}
        label={format(props.date, "MMMM yyyy")}
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
            className="w--full grid"
          >
            hi
            {event.onHold && event.title && event.title === "0" && (
              <div className="bg-yellow-500 col-span-4 w text-sm absolute bottom-[8px] left-2 w-[22px] pt-0.5 h-[22px]  rounded-full text-center">
                {event.title}
              </div>
            )}
            {!event.onHold && event.title === "0" && (
              <div
                className={` ${"bg-blue-500"}  rounded-full h-[22px] text-center pt-0.5 w-[22px] text-sm col-span-8`}
              >
                {"event.title"}
              </div>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-80"
          align="end"
          onMouseLeave={() => handleEventHover(null)}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {format(event.start, "MMMM d, yyyy")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {event.title} {events.length === 1 ? "case" : "cases"} due
                </p>
              </div>
              <div>
                <Button onClick={() => handleEventClick(event)}>
                  View CaseList
                </Button>
              </div>
            </div>

            <Separator />

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {event.formattedCases.map((event: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col space-y-1 rounded-md p-2 hover:bg-muted/50 cursor-pointer border"
                    onClick={() => navigate(`/cases/${event.case_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">#{event.case_number}</span>
                      <Badge
                        variant={
                          event.status === "in_progress"
                            ? "default"
                            : event.status === "on_hold"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {event.status}
                      </Badge>
                    </div>

                    <div className="flex flex-col text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Client:</span>
                        <span className="font-medium text-foreground">
                          {event.client_name}
                        </span>
                      </div>
                      {event.doctor?.name && (
                        <div className="flex justify-between">
                          <span>Doctor:</span>
                          <span className="font-medium text-foreground">
                            {event.doctor.name}
                          </span>
                        </div>
                      )}
                      {event.case_products?.[0]?.name && (
                        <div className="flex justify-between">
                          <span>Product:</span>
                          <span className="font-medium text-foreground">
                            {event.case_products[0].name}
                            {event.case_products.length > 1 &&
                              ` +${event.case_products.length - 1}`}
                          </span>
                        </div>
                      )}

                      <div>
                        {event.invoicesData?.length > 0 && (
                          <div className="flex justify-between">
                            <span className="font-bold">Invoices:</span>
                            <span className="font-medium text-foreground">
                              {""}
                            </span>
                          </div>
                        )}

                        {event.invoicesData?.[0]?.status && (
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-medium text-foreground">
                              {event.invoicesData?.[0]?.status}
                            </span>
                          </div>
                        )}
                        {event.invoicesData?.[0]?.amount && (
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-medium text-foreground">
                              ${event.invoicesData?.[0]?.amount}
                            </span>
                          </div>
                        )}
                        {event.invoicesData?.[0]?.due_amount && (
                          <div className="flex justify-between">
                            <span>Due Amount:</span>
                            <span className="font-medium text-foreground">
                              ${event.invoicesData?.[0]?.due_amount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <p className="font-medium text-start">Status Breakdown</p>
                {Object.entries(
                  event.formattedCases.reduce(
                    (acc: Record<string, number>, event: any) => {
                      acc[event.status] = (acc[event.status] || 0) + 1;
                      return acc;
                    },
                    {}
                  )
                ).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span className="capitalize">
                      {status.replace("_", " ")}
                    </span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 px-4">
                <p className="font-medium text-start">Product Types</p>
                {Object.entries(
                  event.formattedCases.reduce(
                    (acc: Record<string, number>, currentCase: any) => {
                      currentCase.case_products?.forEach((cp: any) => {
                        const productTypeName = cp.product_type?.name;
                        if (productTypeName) {
                          acc[productTypeName] =
                            (acc[productTypeName] || 0) + 1;
                        }
                      });
                      return acc;
                    },
                    {}
                  )
                ).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
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
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "block",
      },
    };
  };

  const handleEventClick = (event: any) => {
    // Extract the start date of the event
    const date = event.start.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    navigate(`/cases?dueDate=${date}&status=in_progress%2Cin_queue`);
  };

  const handleEventHover = (event: CalendarEvents | null) => {
    setHoveredEvent(event);
  };
  const staticEvents: CalendarEvents[] = [
    {
      id: 1,
      title: "Client Meeting",
      start: new Date(2024, 7, 20, 10, 0), // August 20, 2024, 10:00 AM
      end: new Date(2024, 7, 20, 11, 30), // August 20, 2024, 11:30 AM
      onHold: false,
      formattedCases: [],
    },
    {
      id: 2,
      title: "Project Deadline",
      start: new Date(2024, 7, 22, 23, 59), // August 22, 2024, 11:59 PM
      end: new Date(2024, 7, 22, 23, 59),
      onHold: false,
      formattedCases: [],
    },
    {
      id: 3,
      title: "Team Standup",
      start: new Date(2024, 7, 25, 9, 30), // August 25, 2024, 9:30 AM
      end: new Date(2024, 7, 25, 10, 0),
      onHold: true,
      formattedCases: [],
    },
    {
      id: 4,
      title: "Doctor Appointment",
      start: new Date(2024, 7, 28, 15, 0), // August 28, 2024, 3:00 PM
      end: new Date(2024, 7, 28, 16, 0),
      onHold: false,
      formattedCases: [],
    },
    {
      id: 5,
      title: "Invoice Due",
      start: new Date(2024, 7, 30, 12, 0), // August 30, 2024, 12:00 PM
      end: new Date(2024, 7, 30, 13, 0),
      onHold: false,
      formattedCases: [],
    },
  ];

  return (
    <div className="calendar-wrapper" style={{ height }}>
      <div
        className={`calendar-slide ${
          animationDirection ? `slide-${animationDirection}` : ""
        }`}
      >
        <Calendar
          localizer={localizer}
          events={staticEvents}
          startAccessor="start"
          endAccessor="end"
          components={components}
          views={["month"] as View[]}
          defaultView="month"
          date={currentDate}
          onNavigate={handleNavigate as any}
          eventPropGetter={eventStyleGetter}
          // onSelectEvent={handleEventClick}
          dayPropGetter={dayPropGetter}
          className="calendar-container"
        />
      </div>
    </div>
  );
};

export default DueDatesCalendar;
