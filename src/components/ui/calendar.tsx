"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export type CalendarProps = {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  mode?: "single";
  initialFocus?: boolean;
  showOutsideDays?: boolean;
  classNames?: Record<string, string>;
};

/**
 * Optimized Calendar component for CareOps.
 * Fixes misalignment by using a unified 7-column grid for both headers and days.
 * @param root0
 * @param root0.className
 * @param root0.selected
 * @param root0.onSelect
 * @param root0.disabled
 */
function Calendar({ className, selected, onSelect, disabled }: CalendarProps) {
  // Prototype focused on current month/Feb 2026
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 1, 1));

  const days = React.useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDay = start.getDay(); // 0 = Sunday
    const padding = Array.from({ length: startDay });
    const monthDays = eachDayOfInterval({ start, end });
    return { padding, monthDays };
  }, [currentDate]);

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div
      className={cn(
        "bg-background border-border/40 w-[300px] rounded-2xl border p-4 shadow-xl select-none",
        className
      )}
    >
      {/* Navigation Header */}
      <div className="mb-5 flex items-center justify-between px-1">
        <span className="text-foreground text-[13px] font-bold tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-all active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Unified 7-Column Grid */}
      <div className="grid grid-cols-7 items-center text-center">
        {/* Structure: Day Names (First 7 children) */}
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="flex h-8 items-center justify-center py-3 text-[10px] font-bold tracking-[0.1em] text-slate-300 uppercase"
          >
            {day}
          </div>
        ))}

        {/* Structure: Month Padding */}
        {days.padding.map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Structure: Date buttons (Sequential blocks) */}
        {days.monthDays.map((day) => {
          const isSelected = selected && isSameDay(day, selected);
          const isTod = isToday(day);
          const isDisabled = disabled?.(day) ?? false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (!isDisabled) onSelect?.(day);
              }}
              disabled={isDisabled}
              className={cn(
                "group relative m-0.5 flex aspect-square items-center justify-center rounded-xl text-[13px] transition-all duration-200",
                isSelected
                  ? "bg-primary shadow-primary/20 scale-[1.05] font-bold text-white shadow-lg"
                  : "text-muted-foreground hover:bg-muted/30 font-medium active:scale-95",
                isTod && !isSelected && "text-primary font-bold",
                isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
              )}
            >
              {format(day, "d")}
              {isTod && !isSelected && (
                <div className="bg-primary absolute bottom-1 h-1 w-1 rounded-full" />
              )}
              {!isSelected && (
                <div className="bg-primary/5 absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
