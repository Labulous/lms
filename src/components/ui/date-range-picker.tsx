import React, { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, isBefore,setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import cn from 'classnames';


interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

const css = `
.date-range-picker-container {
  position: relative;
}

.date-range-picker {
  position: relative;
  top: 100%; /* Ensures it opens below */
  left: 0;
  z-index: 50;
  margin-top: 0rem; /* Space between trigger and picker */
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.date-range-picker .rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: #2563eb;
  --rdp-background-color: #e0e7ff;
  margin: 0;
}

.date-range-picker .rdp-day_selected {
  background-color: var(--rdp-accent-color);
  color: white;
  font-weight: bold;
}

.date-range-picker .rdp-day_range_start:not(.rdp-day_range_end) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  background-color: var(--rdp-accent-color);
  color: white;
}

.date-range-picker .rdp-day_range_end:not(.rdp-day_range_start) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  background-color: var(--rdp-accent-color);
  color: white;
}

.date-range-picker .rdp-day_range_middle {
  background-color: var(--rdp-background-color);
  color: var(--rdp-accent-color);
}

.date-range-picker .rdp-day_range_middle:hover {
  background-color: #c7d2fe;
  color: var(--rdp-accent-color);
}

.date-range-picker .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
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
  min-width: 260px;
  position: relative;
  gap: 0.5rem;
}

.date-picker-input.has-filter {
  border-color: #2563eb;
  background-color: #f0f9ff;
}

.date-picker-input:hover {
  background: #f8fafc;
}

.date-picker-input.has-filter:hover {
  background: #e0f2fe;
}

.date-picker-input svg {
  width: 1rem;
  height: 1rem;
  color: #64748b;
  flex-shrink: 0;
}

.date-picker-input .text {
  flex: 1;
}

.date-picker-input .clear-button {
  padding: 0.125rem;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.date-picker-input .clear-button:hover {
  opacity: 1;
  background-color: #f1f5f9;
}

.selection-info {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.date-range-picker .footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.date-range-picker button {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.date-range-picker button.clear {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.date-range-picker button.clear:hover {
  background: #f8fafc;
}

.date-range-picker button.done {
  background: #1d4ed8;
  border: 1px solid #1d4ed8;
  color: white;
}

.date-range-picker button.done:hover {
  background: #1e40af;
}`;

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
 
  const [isOpen, setIsOpen] = useState(true);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toUtcMidnight = (date: Date) => {
    return setMilliseconds(setSeconds(setMinutes(setHours(date, 0), 0), 0), 0);
  };
  

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // const handleSelect = (range: DateRange | undefined) => {
  //   if (!range?.from) {
  //     onDateRangeChange(undefined);
  //     setSelectionStep('start');
  //     return;
  //   }

  //   if (selectionStep === 'start') {
  //     onDateRangeChange({ from: range.from, to: undefined });
  //     setSelectionStep('end');
  //     return;
  //   }

  //   if (selectionStep === 'end' && range.to) {
  //     if (isBefore(range.to, range.from)) {
  //       onDateRangeChange({ from: range.to, to: range.from });
  //     } else {
  //       onDateRangeChange(range);
  //     }
  //     setSelectionStep('start');
  //   }
  // };

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onDateRangeChange(undefined);
      setSelectionStep('start');
      return;
    }

    const fromUtc = toUtcMidnight(range.from);
    const toUtc = range.to ? toUtcMidnight(range.to) : fromUtc;

    if (selectionStep === 'start') {
      onDateRangeChange({ from: fromUtc, to: fromUtc });
      setSelectionStep('end');
      return;
    }

    if (selectionStep === 'end' && range.to) {
      if (isBefore(toUtc, fromUtc)) {
        onDateRangeChange({ from: toUtc, to: fromUtc });
      } else {
        onDateRangeChange({ from: fromUtc, to: toUtc });
      }
      setSelectionStep('start');
    }
  };


  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
    setSelectionStep('start');
    setIsOpen(false);
  
    // Allow immediate re-opening on next click
    setTimeout(() => setIsOpen(true), 0);
  };
  

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range";
    if (!dateRange.to) return `Start: ${format(dateRange.from, "MMM dd, yyyy")}`;
    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(
      dateRange.to,
      "MMM dd, yyyy"
    )}`;
  };

  const getSelectionText = () => {
    if (!dateRange?.from) return "Select start date";
    if (!dateRange.to) return "Select end date";
    return "Date range selected";
  };

  
  

  const hasFilter = dateRange?.from != null;

  return (
    <div ref={containerRef} className={cn("date-range-picker-container", className)}>
      <style>{css}</style>
      {/* <div
        className={cn("date-picker-input", { "has-filter": hasFilter })}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon />
        <span className="text">{formatDateRange()}</span>
        {hasFilter && (
          <button className="clear-button" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div> */}
      
      {isOpen && (
        <div className="date-range-picker">
          {/* <div className="selection-info">
            {getSelectionText()}
          </div> */}
          <DayPicker
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={1}
            showOutsideDays={false}
          />
          <div className="footer">
            <button
              className="clear"
              onClick={handleClear} 
            >
              Clear
            </button>
            {/* <button
              className="done"
              onClick={() => {
                if (dateRange?.from && !dateRange.to) {
                  onDateRangeChange({
                    from: dateRange.from,
                    to: dateRange.from,
                  });
                }
                //setSelectionStep('start');
                setIsOpen(false);
              }}
            >
              Done
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}
