"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  differenceInMinutes,
  setHours,
  getHours,
  getMinutes,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Booking, Contact, Service } from "@prisma/client";

// Types
export interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

interface FullCalendarProps {
  bookings: BookingWithRelations[];
  onEdit: (booking: BookingWithRelations) => void;
  onNewBooking: (date?: Date) => void;
}

type ViewMode = "month" | "week" | "day";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-blue-50/90 border-l-[3px] border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/10 hover:bg-blue-100",
  PENDING: "bg-amber-50/90 border-l-[3px] border-amber-500 text-amber-700 shadow-sm ring-1 ring-amber-500/10 hover:bg-amber-100",
  COMPLETED: "bg-emerald-50/90 border-l-[3px] border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/10 hover:bg-emerald-100",
  CANCELLED: "bg-slate-50/70 border-l-[3px] border-slate-300 text-slate-500/80 grayscale shadow-none hover:grayscale-0",
  NO_SHOW: "bg-rose-50/90 border-l-[3px] border-rose-500 text-rose-700 shadow-sm ring-1 ring-rose-500/10 hover:bg-rose-100",
};

const HOUR_HEIGHT = 48; // Compact B2B scale (h-12 equivalent)

export function FullCalendar({ bookings, onEdit, onNewBooking }: FullCalendarProps) {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update "now" every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && (view === "week" || view === "day")) {
      scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, [view]);

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const headerTitle = useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return isSameMonth(start, end)
        ? format(start, "MMMM yyyy")
        : `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM do, yyyy");
  }, [view, currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const renderMonthView = () => (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-100 sticky top-0 bg-white z-20">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto border-l border-slate-100 no-scrollbar">
        {monthDays.map((day) => {
          const isSelectedMonth = isSameMonth(day, currentDate);
          const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[80px] p-1.5 border-b border-r border-slate-100 transition-all cursor-pointer relative group flex flex-col",
                !isSelectedMonth && "bg-slate-50/30 text-slate-300",
                isTodayDate && "bg-blue-50/30"
              )}
              onClick={() => onNewBooking(setHours(day, 9))}
            >
              <div className="flex justify-start mb-0.5">
                <span
                  className={cn(
                    "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-all",
                    isTodayDate
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 group-hover:text-slate-900"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5 mt-0.5 overflow-y-auto no-scrollbar max-h-[50px]">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(booking);
                    }}
                    className={cn(
                      "text-[9px] px-1 py-0.5 rounded truncate font-semibold border-l-2 shadow-sm leading-tight",
                      STATUS_STYLES[booking.status] || "bg-slate-100"
                    )}
                  >
                    {format(new Date(booking.date), "H:mm")} {booking.contact.name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTimeGrid = (daysList: Date[]) => (
    <div className="flex flex-col h-full bg-white relative">
      {/* Sticky Header Row */}
      <div className="flex border-b border-slate-100 sticky top-0 bg-white z-30 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] shrink-0">
        <div className="w-12 flex-shrink-0 border-r border-slate-100 bg-slate-50/30"></div>
        <div className="flex flex-1 grid grid-cols-7">
          {daysList.map((day) => {
            const isTodayDate = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "text-center py-2 border-r border-slate-100 last:border-r-0 transition-colors",
                  isTodayDate && "bg-blue-50/20"
                )}
              >
                <div className={cn(
                  "text-[9px] font-bold uppercase tracking-widest mb-0.5",
                  isTodayDate ? "text-blue-600" : "text-slate-400"
                )}>
                  {format(day, "EEE")}
                </div>
                <div className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-all",
                  isTodayDate ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body - ONLY this div should scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative no-scrollbar"
      >
        <div className="flex flex-1 relative bg-white" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time Gutter */}
          <div className="w-12 flex-shrink-0 border-r border-slate-100 bg-slate-50/30 select-none">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="relative border-b border-slate-50/50 h-[48px]">
                <span className="absolute -top-2 w-full text-center text-[9px] text-slate-400 font-bold tracking-tight">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="flex-1 grid grid-cols-7">
            {daysList.map((day) => {
              const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
              const isTodayDate = isToday(day);
              const currentHour = getHours(now);
              const showTimeIndicator = isTodayDate && currentHour < 21 && currentHour >= 6;

              return (
                <div key={day.toISOString()} className={cn(
                  "border-r border-slate-100 last:border-r-0 relative bg-white",
                  isTodayDate && "bg-blue-50/[0.1]"
                )}>
                  {/* Grid Lines */}
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className={cn(
                        "border-b border-slate-50/50 h-[48px] hover:bg-slate-50/30 cursor-pointer transition-colors",
                        hour % 2 === 0 ? "bg-transparent" : "bg-slate-50/20"
                      )}
                      onClick={() => onNewBooking(setHours(day, hour))}
                    />
                  ))}

                  {/* Current Time Line - Subtle Blue */}
                  {isTodayDate && (
                    <div
                      className="absolute w-full border-t border-blue-500/50 z-20 pointer-events-none flex items-center"
                      style={{ top: `${(getHours(now) * 60 + getMinutes(now)) * (HOUR_HEIGHT / 60)}px` }}
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full -ml-[3px] ring-1 ring-white shadow-sm" />
                    </div>
                  )}

                  {/* Booking Events */}
                  {dayBookings.map((booking) => {
                    const start = new Date(booking.date);
                    const end = new Date(booking.endTime);
                    const startMin = getHours(start) * 60 + getMinutes(start);
                    const duration = differenceInMinutes(end, start);

                    const top = startMin * (HOUR_HEIGHT / 60);
                    const height = Math.max(duration * (HOUR_HEIGHT / 60), 24);

                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(booking);
                        }}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        className={cn(
                          "absolute inset-x-0.5 z-10 rounded shadow-sm border border-black/5 p-1 flex flex-col transition-all hover:z-20 hover:scale-[1.01] cursor-pointer overflow-hidden leading-tight",
                          STATUS_STYLES[booking.status] || "bg-slate-100"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-[9px] text-slate-900 break-words line-clamp-1 uppercase tracking-tight">{booking.service.name}</span>
                          <span className="text-[8px] font-black opacity-50 whitespace-nowrap">{format(start, "H:mm")}</span>
                        </div>
                        <div className="text-[9px] font-bold text-slate-700 truncate">{booking.contact.name}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white" onClick={prev}>
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </Button>
            <Button variant="ghost" className="h-7 px-3 text-[10px] font-bold text-slate-600 rounded-md hover:bg-white transition-all active:scale-95" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white" onClick={next}>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-800 ml-1">
            {headerTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            {(["month", "week", "day"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={cn(
                  "px-3 py-1 text-[9px] font-bold rounded-md capitalize transition-all",
                  view === m
                    ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button
            onClick={() => onNewBooking(currentDate)}
            className="h-7 px-3 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95"
          >
            Add Booking
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-50/10">
        {view === "month" && renderMonthView()}
        {view === "week" && renderTimeGrid(weekDays)}
        {view === "day" && renderTimeGrid([currentDate])}
      </div>
    </div>
  );
}
