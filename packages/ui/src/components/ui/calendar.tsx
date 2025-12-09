"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"
import "../../styles/calendar.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white dark:bg-gray-800", className)}
      style={{ backgroundColor: 'white', color: 'black' }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center text-black dark:text-white font-black",
        caption_label: "text-lg font-black text-black dark:text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 font-black"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-black dark:text-white rounded-md w-9 font-black text-sm uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-blue-50 dark:[&:has([aria-selected].day-outside)]:bg-blue-900/20 [&:has([aria-selected])]:bg-blue-50 dark:[&:has([aria-selected])]:bg-blue-900/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-extrabold text-base aria-selected:opacity-100 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-white font-black hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white dark:bg-blue-500 dark:hover:bg-blue-600",
        day_today: "bg-gray-100 dark:bg-gray-700 text-black dark:text-white font-black ring-2 ring-blue-600 dark:ring-blue-500",
        day_outside:
          "day-outside text-gray-400 dark:text-gray-600 opacity-50 font-normal aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-gray-400 dark:aria-selected:text-gray-600 aria-selected:opacity-30",
        day_disabled: "text-gray-400 dark:text-gray-600 opacity-50 font-normal",
        day_range_middle:
          "aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-black dark:aria-selected:text-white font-extrabold",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
