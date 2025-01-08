import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import {
  format,
  parse,
  isValid,
  addDays,
  subDays,
  startOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

interface DatePickerProps {
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
.date-picker-container {
  position: relative;
}

.date-picker {
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
}

.date-picker .rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: #2563eb;
  --rdp-background-color: #e0e7ff;
  margin: 0;
}

.date-picker .rdp-day_selected {
  background-color: var(--rdp-accent-color);
  color: white;
  font-weight: bold;
}

.date-picker .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
  background-color: #f1f5f9;
}

.date-picker-input {
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

.date-picker-input:hover {
  background: #f8fafc;
}

.date-picker-input svg {
  width: 1rem;
  height: 1rem;
  color: #64748b;
  flex-shrink: 0;
}

.date-picker-input .display-text {
  flex: 1;
  font-size: 0.875rem;
  color: #4b5563;
}

.date-picker-input .placeholder {
  color: #9ca3af;
}

.date-picker-input .clear-button {
  margin-left: auto;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-picker-input .clear-button:hover {
  background-color: #f1f5f9;
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

export function DatePicker({
  date,
  onSelect,
  className,
  minDate,
  maxDate,
  dateFormat = "PPP",
  placeholder = "Pick a date",
  updatedDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const containerRef = useRef<HTMLDivElement>(null);

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
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (!selectedDate) {
            handleSelect(new Date());
          } else {
            handleSelect(addDays(selectedDate, 7));
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (!selectedDate) {
            handleSelect(new Date());
          } else {
            handleSelect(subDays(selectedDate, 7));
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedDate]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      if (minDate && date < minDate) return;
      if (maxDate && date > maxDate) return;
    }
    setSelectedDate(date);
    onSelect?.(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    onSelect?.(undefined);
  };

  const handleQuickSelect = (date: Date) => {
    handleSelect(date);
  };

  useEffect(() => {
    setSelectedDate(updatedDate);
  }, [updatedDate]);
  return (
    <>
      <style>{css}</style>
      <div className="date-picker-container" ref={containerRef}>
        <div
          className={cn("date-picker-input", className)}
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
              aria-label="Clear date"
            >
              <X />
            </button>
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
        {isOpen && (
          <div className="date-picker">
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
              <button onClick={() => handleQuickSelect(subDays(new Date(), 1))}>
                Yesterday
              </button>
              <button
                onClick={() => handleQuickSelect(startOfWeek(new Date()))}
              >
                Start of Week
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
