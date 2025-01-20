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
import enUS from "date-fns/locale/en-US";
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
  "en-US": enUS,
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
        <span className="date-number">{format(date, 'd')}</span>
        {events.length > 0 && (
          <div className="badge-container">
            <span className="count-badge">{events.length}</span>
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

  const components = {
    toolbar: (props: any) => (
      <CustomToolbar
        date={props.date}
        onNavigate={handleNavigate}
        label={format(props.date, "MMMM yyyy")}
      />
    ),
    dateCellWrapper: (props: any) => {
      const eventsForDate = events.filter(event => {
        const eventDate = new Date(event.start);
        return (
          eventDate.getDate() === props.value.getDate() &&
          eventDate.getMonth() === props.value.getMonth() &&
          eventDate.getFullYear() === props.value.getFullYear()
        );
      });
      return <CustomDateCell date={props.value} events={eventsForDate} />;
    },
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

  const rbcNowElement = document.querySelector(".rbc-now");
  useEffect(() => {
    if (rbcNowElement) {
      const nextSibling = rbcNowElement.nextElementSibling;
      if (nextSibling && nextSibling instanceof HTMLElement) {
        nextSibling.classList.add("due-by-tommorow-cell");
      } else {
        console.log("Next sibling not found or not an HTMLElement");
      }
    } else {
      console.log("rbc-now element not found");
    }
  }, [rbcNowElement]);

  const handleEventHover = (event: CalendarEvents | null) => {
    setHoveredEvent(event);
  };
  console.log(events, "nextSibling");
  return (
    <div className="calendar-wrapper" style={{ height }}>
      <div
        className={`calendar-slide ${
          animationDirection ? `slide-${animationDirection}` : ""
        }`}
      >
        <Calendar
          localizer={localizer}
          events={events}
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
