import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onSelect?: (date?: Date) => void
  className?: string
}

export function DatePicker({ date, onSelect, className }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    onSelect?.(date)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 bg-white",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-white p-0 border border-gray-200 rounded-lg shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className="rounded-lg bg-white"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex flex-row items-center justify-between px-2",
            caption_label: "text-sm font-medium text-gray-900",
            nav: "flex items-center space-x-1",
            nav_button: "h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 rounded-md border border-gray-200 hover:bg-gray-50",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-50",
              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            ),
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
            day_range_end: "day-range-end",
            day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
            day_today: "bg-gray-100 text-gray-900",
            day_outside: "text-gray-400 opacity-50 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30",
            day_disabled: "text-gray-400 opacity-50",
            day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
