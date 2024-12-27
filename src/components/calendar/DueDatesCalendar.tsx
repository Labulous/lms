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
  events?: Case[];
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
  events = getCases(),
  height = 500,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);

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
        (event) => format(new Date(event.dueDate), "yyyy-MM-dd") === dateStr
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

  const eventStyleGetter = () => ({
    style: {
      display: "none",
    },
  });

  return (
    <div className="calendar-wrapper" style={{ height }}>
      <div
        className={`calendar-slide ${
          animationDirection ? `slide-${animationDirection}` : ""
        }`}
      >
        <Calendar
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          components={components}
          views={["month"] as View[]}
          defaultView="month"
          date={currentDate}
          onNavigate={handleNavigate as any}
          eventPropGetter={eventStyleGetter}
          className="calendar-container"
        />
      </div>
    </div>
  );
};

export default DueDatesCalendar;
