"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"

export type CalendarProps = {
    className?: string
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    disabled?: (date: Date) => boolean
    mode?: "single"
    initialFocus?: boolean
    showOutsideDays?: boolean
    classNames?: any
}

/**
 * Optimized Calendar component for CareOps.
 * Fixes misalignment by using a unified 7-column grid for both headers and days.
 */
function Calendar({
    className,
    selected,
    onSelect,
    disabled,
}: CalendarProps) {
    // Prototype focused on current month/Feb 2026
    const [currentDate, setCurrentDate] = React.useState(new Date(2026, 1, 1))

    const days = React.useMemo(() => {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        const startDay = start.getDay() // 0 = Sunday
        const padding = Array.from({ length: startDay })
        const monthDays = eachDayOfInterval({ start, end })
        return { padding, monthDays }
    }, [currentDate])

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

    return (
        <div className={cn("p-4 bg-white rounded-2xl shadow-xl border border-border/40 w-[300px] select-none", className)}>
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-5 px-1">
                <span className="text-[13px] font-bold text-slate-900 tracking-tight">
                    {format(currentDate, "MMMM yyyy")}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-900 active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-900 active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Unified 7-Column Grid */}
            <div className="grid grid-cols-7 text-center items-center">
                {/* Structure: Day Names (First 7 children) */}
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                        key={day}
                        className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.1em] py-3 flex items-center justify-center h-8"
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
                    const isSelected = selected && isSameDay(day, selected)
                    const isTod = isToday(day)
                    const isDisabled = disabled?.(day) ?? false

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => {
                                if (!isDisabled) onSelect?.(day)
                            }}
                            disabled={isDisabled}
                            className={cn(
                                "aspect-square text-[13px] flex items-center justify-center rounded-xl m-0.5 transition-all duration-200 relative group",
                                isSelected
                                    ? "bg-primary text-white font-bold shadow-lg shadow-primary/20 scale-[1.05]"
                                    : "text-slate-600 hover:bg-slate-50 font-medium active:scale-95",
                                isTod && !isSelected && "text-primary font-bold",
                                isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                            )}
                        >
                            {format(day, "d")}
                            {isTod && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                            )}
                            {!isSelected && (
                                <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
