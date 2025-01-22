import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { CalendarDays } from "lucide-react";

export type TimeFilterType = 'fixed' | 'rolling';

export interface TimeFilterOption {
  label: string;
  type: TimeFilterType;
  value: string;
  days?: number;
  getDateRange?: () => { start: Date; end: Date };
}

export interface TimeFilterProps {
  selectedFilter: TimeFilterOption;
  onFilterChange: (filter: TimeFilterOption) => void;
}

// Helper function to get start of today
const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Helper function to get start of month
const getStartOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper function to get start of year
const getStartOfYear = () => {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const timeFilterOptions: TimeFilterOption[] = [
  // Fixed Time Periods
  {
    label: "Today",
    type: "fixed",
    value: "today",
    getDateRange: () => {
      const today = getStartOfToday();
      return { start: today, end: new Date() };
    }
  },
  {
    label: "This Month",
    type: "fixed",
    value: "this_month",
    getDateRange: () => {
      const start = getStartOfMonth();
      return { start, end: new Date() };
    }
  },
  {
    label: "This Year",
    type: "fixed",
    value: "this_year",
    getDateRange: () => {
      const start = getStartOfYear();
      return { start, end: new Date() };
    }
  },
  // Rolling Time Periods
  {
    label: "Last 24 Hours",
    type: "rolling",
    value: "last_24h",
    days: 1
  },
  {
    label: "Last 7 Days",
    type: "rolling",
    value: "last_7d",
    days: 7
  },
  {
    label: "Last 30 Days",
    type: "rolling",
    value: "last_30d",
    days: 30
  },
  {
    label: "Last 90 Days",
    type: "rolling",
    value: "last_90d",
    days: 90
  },
  {
    label: "Last 6 Months",
    type: "rolling",
    value: "last_180d",
    days: 180
  },
  {
    label: "Last 12 Months",
    type: "rolling",
    value: "last_365d",
    days: 365
  }
];

export const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <CalendarDays className="mr-2 h-4 w-4" />
          {selectedFilter.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Fixed Periods</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {timeFilterOptions
                .filter(filter => filter.type === 'fixed')
                .map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => onFilterChange(filter)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Rolling Periods</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {timeFilterOptions
                .filter(filter => filter.type === 'rolling')
                .map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => onFilterChange(filter)}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
