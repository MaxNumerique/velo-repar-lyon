"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",

        // Caption : titre centré
        month_caption: "flex justify-center pt-2 relative items-center mb-2",
        caption_label: "text-sm font-black text-slate-900 uppercase tracking-tighter",

        // Nav : les deux boutons
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-slate-50 transition-all border border-slate-100 shadow-sm absolute left-2 top-2 z-10 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-slate-50 transition-all border border-slate-100 shadow-sm absolute right-2 top-2 z-10 pointer-events-auto"
        ),

        // Grille
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full mb-1",
        weekday: "text-slate-400 font-bold w-9 text-[10px] uppercase text-center flex-1",
        week: "flex w-full mt-1.5",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-bold aria-selected:opacity-100 rounded-full hover:bg-slate-200 hover:scale-110 transition-all active:scale-95 text-slate-700"
        ),

        // États
        selected: "rounded-full bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white shadow-xl shadow-primary/30 [&>button]:text-white",
        today: "rounded-full bg-slate-100 text-slate-900 ring-2 ring-slate-200 border-none",
        outside: "day-outside text-slate-300 opacity-70 line-through aria-selected:bg-slate-100/50 aria-selected:text-slate-300 aria-selected:opacity-30",
        disabled: "text-slate-400 opacity-80 cursor-not-allowed [&>button]:line-through [&>button]:text-slate-300",
        range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
        range_end: "day-range-end",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
