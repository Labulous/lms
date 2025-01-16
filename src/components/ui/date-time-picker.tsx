import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import {
  format,
  parse,
  isValid,
  addDays,
  subDays,
  startOfWeek,
  setHours,
  setMinutes,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  X,
  ChevronDown,
} from "lucide-react";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date?: Date;
  onSelect?: (date?: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  placeholder?: string;
  updatedDate?: Date | undefined;
}

const css = `
.datetime-picker-container {
  position: relative;
}

.datetime-picker {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: flex;
  gap: 1rem;
}

.datetime-picker .rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: #2563eb;
  --rdp-background-color: #e0e7ff;
  margin: 0;
}

.datetime-picker .rdp-day_selected {
  background-color: var(--rdp-accent-color);
  color: white;
  font-weight: bold;
}

.datetime-picker .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
  background-color: #f1f5f9;
}

.datetime-picker-input {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  cursor: pointer;
  width: 100%;
  position: relative;
  gap: 0.5rem;
}

.datetime-picker-input:hover {
  background: #f8fafc;
}

.datetime-picker-input svg {
  width: 1rem;
  height: 1rem;
  color: #64748b;
  flex-shrink: 0;
}

.datetime-picker-input .display-text {
  flex: 1;
  font-size: 0.875rem;
  color: #4b5563;
}

.datetime-picker-input .placeholder {
  color: #9ca3af;
}

.datetime-picker-input .clear-button {
  margin-left: auto;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-picker {
  width: 120px;
  border-left: 1px solid #e2e8f0;
  padding-left: 1rem;
}

.time-picker-header {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-list {
  max-height: 300px;
  overflow-y: auto;
}

.time-option {
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
}

.time-option:hover {
  background-color: #f1f5f9;
}

.time-option.selected {
  background-color: #e0e7ff;
  color: #2563eb;
  font-weight: 500;
}

.quick-select {
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.quick-select button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  border-radius: 0.25rem;
}

.quick-select button:hover {
  background-color: #f1f5f9;
}
`;

export function DateTimePicker({
  date,
  onSelect,
  className,
  minDate,
  maxDate,
  dateFormat = "MM/dd/yyyy h:mm aa",
  placeholder = "Pick date and time",
  updatedDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(() => {
    if (!selectedDate) return -1;
    const currentTime = format(selectedDate, "HH:mm");
    return times.findIndex((time) => time === currentTime);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const times = React.useMemo(() => {
    const times = [];
    for (let i = 8; i <= 17; i++) {
      // 8 AM to 5 PM
      for (let j = 0; j < 60; j += 15) {
        // Every 15 minutes
        const hour = i.toString().padStart(2, "0");
        const minute = j.toString().padStart(2, "0");
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      if (minDate && date < minDate) return;
      if (maxDate && date > maxDate) return;

      // Preserve the current time when selecting a new date
      if (selectedDate) {
        date = setHours(date, selectedDate.getHours());
        date = setMinutes(date, selectedDate.getMinutes());
      } else {
        date = setHours(date, 9);
        date = setMinutes(date, 0);
      }
    }
    setSelectedDate(date);
    onSelect?.(date);
  };

  const handleTimeSelect = (timeStr: string) => {
    if (selectedDate) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setSelectedDate(newDate);
      onSelect?.(newDate);
      setIsOpen(false); // Close the picker after time selection
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    onSelect?.(undefined);
  };

  const handleQuickSelect = (date: Date) => {
    handleSelect(date);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          setIsOpen(false);
          break;
        case "Enter":
          if (selectedDate) {
            handleSelect(selectedDate);
            setIsOpen(false);
          }
          break;
        case "Tab":
          // Prevent default tab behavior when dropdown is open
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Tab: Move focus backward
            setSelectedTimeIndex((prev) =>
              prev <= 0 ? times.length - 1 : prev - 1
            );
          } else {
            // Tab: Move focus forward
            setSelectedTimeIndex((prev) =>
              prev >= times.length - 1 ? 0 : prev + 1
            );
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (event.altKey) {
            // Alt+ArrowDown: Time selection
            setSelectedTimeIndex((prev) =>
              prev >= times.length - 1 ? 0 : prev + 1
            );
            if (selectedTimeIndex >= 0 && selectedDate) {
              const time = times[selectedTimeIndex];
              handleTimeSelect(time);
            }
          } else {
            // ArrowDown: Date selection
            if (!selectedDate) {
              handleSelect(new Date());
            } else {
              handleSelect(addDays(selectedDate, 7));
            }
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (event.altKey) {
            // Alt+ArrowUp: Time selection
            setSelectedTimeIndex((prev) =>
              prev <= 0 ? times.length - 1 : prev - 1
            );
            if (selectedTimeIndex >= 0 && selectedDate) {
              const time = times[selectedTimeIndex];
              handleTimeSelect(time);
            }
          } else {
            // ArrowUp: Date selection
            if (!selectedDate) {
              handleSelect(new Date());
            } else {
              handleSelect(subDays(selectedDate, 7));
            }
          }
          break;
        case "ArrowLeft":
          if (!event.altKey) {
            event.preventDefault();
            if (selectedDate) {
              handleSelect(subDays(selectedDate, 1));
            }
          }
          break;
        case "ArrowRight":
          if (!event.altKey) {
            event.preventDefault();
            if (selectedDate) {
              handleSelect(addDays(selectedDate, 1));
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedDate, selectedTimeIndex, times]);

  // Scroll selected time into view
  useEffect(() => {
    if (isOpen && selectedTimeIndex >= 0) {
      const timeList = document.querySelector(".time-list");
      const selectedOption = document.querySelector(".time-option.selected");
      if (timeList && selectedOption) {
        selectedOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [isOpen, selectedTimeIndex]);

  useEffect(() => {
    setSelectedDate(updatedDate);
  }, [updatedDate]);
  return (
    <>
      <style>{css}</style>
      <div className="datetime-picker-container" ref={containerRef}>
        <div
          className={cn("datetime-picker-input", className)}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon />
          <span className={cn("display-text", !selectedDate && "placeholder")}>
            {selectedDate ? format(selectedDate, dateFormat) : placeholder}
          </span>
          {selectedDate && (
            <button
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear date and time"
            >
              <X />
            </button>
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
        {isOpen && (
          <div className="datetime-picker">
            <div>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                defaultMonth={selectedDate}
                disabled={[
                  (date) =>
                    (minDate ? date < minDate : false) ||
                    (maxDate ? date > maxDate : false),
                ]}
              />
              <div className="quick-select">
                <button onClick={() => handleQuickSelect(new Date())}>
                  Today
                </button>
                <button
                  onClick={() => handleQuickSelect(subDays(new Date(), 1))}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => handleQuickSelect(startOfWeek(new Date()))}
                >
                  Start of Week
                </button>
              </div>
            </div>
            <div className="time-picker">
              <div className="time-picker-header">
                <ClockIcon className="w-4 h-4" />
                <span>Time</span>
              </div>
              <div className="time-list" role="listbox" tabIndex={0}>
                {times.map((time, index) => (
                  <div
                    key={time}
                    role="option"
                    aria-selected={selectedTimeIndex === index}
                    className={cn(
                      "time-option",
                      selectedTimeIndex === index && "selected"
                    )}
                    onClick={() => {
                      setSelectedTimeIndex(index);
                      handleTimeSelect(time);
                    }}
                  >
                    {format(parse(time, "HH:mm", new Date()), "h:mm aa")}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
