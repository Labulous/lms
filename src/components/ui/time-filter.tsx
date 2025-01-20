import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TimeFilterOption {
  label: string;
  days: number;
}

export const timeFilterOptions: TimeFilterOption[] = [
  { label: "This week", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
];

interface TimeFilterProps {
  selectedFilter: TimeFilterOption;
  onFilterChange: (filter: TimeFilterOption) => void;
}

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
      <DropdownMenuContent align="end">
        {timeFilterOptions.map((filter) => (
          <DropdownMenuItem
            key={filter.days}
            onClick={() => onFilterChange(filter)}
          >
            {filter.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
