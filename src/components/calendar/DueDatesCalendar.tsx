import React, { useState, useCallback } from "react";
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
import CustomDateCell from "./CustomDateCell";
import { Case, getCases } from "../../data/mockCasesData";
import "./calendar.css";
import { position } from "html2canvas/dist/types/css/property-descriptors/position";
import { useNavigate } from "react-router-dom";
import { CalendarEvents } from "@/pages/Home";

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

/* eslint-disable no-unused-vars */
const CustomToolbar: React.FC<CustomToolbarProps> = ({
  date,
  onNavigate,
  label,
}) => {
  return (
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
};

const DueDatesCalendar: React.FC<DueDatesCalendarProps> = ({
  events = [],
  height = 500,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const components = {
    dateCell: (props: any) => {
      const { date } = props;
      const dateStr = format(date, "yyyy-MM-dd");
      const dateEvents = events.filter(
        (event) => format(new Date(event.start), "yyyy-MM-dd") === dateStr
      );

      return <CustomDateCell value={date} events={dateEvents} />;
    },
    toolbar: (props: any) => (
      <CustomToolbar
        date={props.date}
        onNavigate={handleNavigate}
        label={format(props.date, "MMMM yyyy")}
      />
    ),
  };

  const eventStyleGetter = (
    event: any,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => {
    return {
      style: {
        backgroundColor: isSelected ? "#3174ad" : "#3B82F6", // Highlight selected events
        borderRadius: "5px",
        color: "white",
        border: "0px",
        padding: "2px", // Ensure padding fits within the box
        whiteSpace: "nowrap", // Prevent text overflow
        overflow: "hidden", // Hide overflow content
        textOverflow: "ellipsis", // Add ellipsis for long text
        display: "block", //
      },
    };
  };

  const handleEventClick = (event: any) => {
    // Extract the start date of the event
    const date = event.start.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    navigate(`/cases?dueDate=${date}&status=in_progress%2Cin_queue`);
  };

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
          onSelectEvent={handleEventClick} // Add the event click handler
          className="calendar-container"
        />
      </div>
    </div>
  );
};

export default DueDatesCalendar;
