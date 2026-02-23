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
  addMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Booking, Contact, Service } from "@prisma/client";

// Types
export interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

export interface ExternalEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  [key: string]: unknown;
}

interface FullCalendarProps {
  bookings: BookingWithRelations[];
  externalEvents?: ExternalEvent[];
  onEdit: (booking: BookingWithRelations) => void;
  onNewBooking: (date?: Date) => void;
}

type ViewMode = "month" | "week" | "day";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED:
    "bg-blue-50/90 border-l-[3px] border-blue-500 text-primary/90 shadow-sm ring-1 ring-blue-500/10 hover:bg-blue-100",
  PENDING:
    "bg-amber-50/90 border-l-[3px] border-amber-500 text-amber-700 shadow-sm ring-1 ring-amber-500/10 hover:bg-amber-100",
  COMPLETED:
    "bg-emerald-50/90 border-l-[3px] border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/10 hover:bg-emerald-100",
  CANCELLED:
    "bg-muted/30 border-l-[3px] border-border/40 text-muted-foreground/80 grayscale shadow-none hover:grayscale-0",
  NO_SHOW:
    "bg-rose-50/90 border-l-[3px] border-rose-500 text-rose-700 shadow-sm ring-1 ring-rose-500/10 hover:bg-rose-100",
  EXTERNAL:
    "bg-purple-50/80 border-l-[3px] border-purple-400 text-purple-700 shadow-none ring-1 ring-purple-500/10 hover:bg-purple-100 opacity-80",
};

const HOUR_HEIGHT = 48; // Compact B2B scale (h-12 equivalent)
// Calendar height in pixels
// Width of the time gutter

/**
 * FullCalendar component for managing bookings.
 * @param props - Component props
 * @param props.bookings - List of bookings
 * @param props.externalEvents - External events (e.g. Google Calendar)
 * @param props.onEdit - Callback when booking is clicked
 * @param props.onNewBooking - Callback when slot is clicked
 */
export function FullCalendar({
  bookings,
  externalEvents = [],
  onEdit,
  onNewBooking,
}: FullCalendarProps) {
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
    <div className="bg-background border-border/40 flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border/40 bg-background sticky top-0 z-20 grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-muted-foreground border-border/40 border-r py-2 text-center text-[10px] font-bold tracking-widest uppercase last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="border-border/40 no-scrollbar grid flex-1 auto-rows-fr grid-cols-7 overflow-y-auto border-l">
        {monthDays.map((day) => {
          const isSelectedMonth = isSameMonth(day, currentDate);
          const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
          const dayExternalEvents = externalEvents.filter((e) => isSameDay(new Date(e.start), day));
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-border/40 group relative flex min-h-[80px] cursor-pointer flex-col border-r border-b p-1.5 transition-all",
                !isSelectedMonth && "bg-muted/30 text-slate-300",
                isTodayDate && "bg-blue-50/30"
              )}
              onClick={() => onNewBooking(setHours(day, 9))}
            >
              <div className="mb-0.5 flex justify-start">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                    isTodayDate
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="no-scrollbar mt-0.5 max-h-[50px] space-y-0.5 overflow-y-auto">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(booking);
                    }}
                    className={cn(
                      "truncate rounded border-l-2 px-1 py-0.5 text-[9px] leading-tight font-semibold shadow-sm",
                      STATUS_STYLES[booking.status] || "bg-muted/50"
                    )}
                  >
                    {format(new Date(booking.date), "H:mm")} {booking.contact.name.split(" ")[0]}
                  </div>
                ))}
                {dayExternalEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "truncate rounded border-l-2 px-1 py-0.5 text-[9px] leading-tight font-medium shadow-sm",
                      STATUS_STYLES.EXTERNAL
                    )}
                    title={`${event.title}\n(Google Calendar)`}
                  >
                    {format(new Date(event.start), "H:mm")} {event.title}
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
    <div className="bg-background relative flex h-full flex-col">
      {/* Sticky Header Row */}
      <div className="border-border/40 bg-background sticky top-0 z-30 flex shrink-0 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
        <div className="border-border/40 bg-muted/30 w-12 flex-shrink-0 border-r"></div>
        <div className="flex grid flex-1 grid-cols-7">
          {daysList.map((day) => {
            const isTodayDate = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-border/40 border-r py-2 text-center transition-colors last:border-r-0",
                  isTodayDate && "bg-blue-50/20"
                )}
              >
                <div
                  className={cn(
                    "mb-0.5 text-[9px] font-bold tracking-widest uppercase",
                    isTodayDate ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isTodayDate ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body - ONLY this div should scroll */}
      <div ref={scrollContainerRef} className="no-scrollbar relative flex-1 overflow-y-auto">
        <div className="bg-background relative flex flex-1" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time Gutter */}
          <div className="border-border/40 bg-muted/30 w-12 flex-shrink-0 border-r select-none">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="relative h-[48px] border-b border-slate-50/50">
                <span className="text-muted-foreground absolute -top-2 w-full text-center text-[9px] font-bold tracking-tight">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="grid flex-1 grid-cols-7">
            {daysList.map((day) => {
              const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
              const dayExternalEvents = externalEvents.filter((e) =>
                isSameDay(new Date(e.start), day)
              );
              const isTodayDate = isToday(day);
              const _showTimeIndicator = true;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-border/40 bg-background relative border-r last:border-r-0",
                    isTodayDate && "bg-blue-50/[0.1]"
                  )}
                >
                  {/* Grid Lines */}
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className={cn(
                        "hover:bg-muted/30 h-[48px] cursor-pointer border-b border-slate-50/50 transition-colors",
                        hour % 2 === 0 ? "bg-transparent" : "bg-muted/30"
                      )}
                      onClick={() => onNewBooking(setHours(day, hour))}
                    />
                  ))}

                  {/* Current Time Line - Subtle Blue */}
                  {isTodayDate && (
                    <div
                      className="pointer-events-none absolute z-20 flex w-full items-center border-t border-blue-500/50"
                      style={{
                        top: `${(getHours(now) * 60 + getMinutes(now)) * (HOUR_HEIGHT / 60)}px`,
                      }}
                    >
                      <div className="-ml-[3px] h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm ring-1 ring-white" />
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
                          "absolute inset-x-0.5 z-10 flex cursor-pointer flex-col overflow-hidden rounded border border-black/5 p-1 leading-tight shadow-sm transition-all hover:z-20 hover:scale-[1.01]",
                          STATUS_STYLES[booking.status] || "bg-muted/50"
                        )}
                      >
                        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1">
                          <span className="text-foreground line-clamp-1 text-[9px] font-bold tracking-tight break-words uppercase">
                            {booking.service.name}
                          </span>
                          <span className="text-[8px] font-black whitespace-nowrap opacity-50">
                            {format(start, "H:mm")}
                          </span>
                        </div>
                        <div className="truncate text-[9px] font-bold text-slate-700">
                          {booking.contact.name}
                        </div>
                      </div>
                    );
                  })}

                  {/* External Events (Google) */}
                  {dayExternalEvents.map((event) => {
                    const start = new Date(event.start);
                    const end = event.end ? new Date(event.end) : addMinutes(start, 30);
                    const startMin = getHours(start) * 60 + getMinutes(start);
                    const duration = Math.max(differenceInMinutes(end, start), 30); // Min 30 mins for visibility

                    const top = startMin * (HOUR_HEIGHT / 60);
                    const height = duration * (HOUR_HEIGHT / 60);

                    return (
                      <div
                        key={event.id}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${event.title}\n(Google Calendar)`}
                        className={cn(
                          "absolute inset-x-0.5 z-10 flex flex-col overflow-hidden rounded border border-black/5 p-1 leading-tight shadow-none transition-all hover:z-20 hover:scale-[1.01]",
                          STATUS_STYLES.EXTERNAL
                        )}
                      >
                        <div className="mb-0.5 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 opacity-50" />
                          <span className="truncate text-[9px] font-bold tracking-tight text-purple-900">
                            {event.title}
                          </span>
                        </div>
                        <div className="text-[8px] font-black opacity-50">
                          {format(start, "H:mm")} - {format(end, "H:mm")}
                        </div>
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Navigation Toolbar */}
      <div className="border-border/40 bg-background flex shrink-0 items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="bg-muted/30 border-border/40 flex rounded-lg border p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-background h-7 w-7 rounded-md"
              onClick={prev}
            >
              <ChevronLeft className="text-muted-foreground h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-background h-7 rounded-md px-3 text-[10px] font-bold transition-all active:scale-95"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-background h-7 w-7 rounded-md"
              onClick={next}
            >
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-foreground ml-1 text-sm font-bold tracking-tight">{headerTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted/30 border-border/40 flex rounded-lg border p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={cn(
                  "rounded-md px-3 py-1 text-[9px] font-bold capitalize transition-all",
                  view === m
                    ? "bg-background text-primary border-border/40 border shadow-sm"
                    : "text-muted-foreground hover:text-muted-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button
            onClick={() => onNewBooking(currentDate)}
            className="bg-primary hover:bg-primary/90 h-7 rounded-lg px-3 text-[10px] font-bold text-white shadow-sm transition-all active:scale-95"
          >
            Add Booking
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 min-h-0 flex-1">
        {view === "month" && renderMonthView()}
        {view === "week" && renderTimeGrid(weekDays)}
        {view === "day" && renderTimeGrid([currentDate])}
      </div>
    </div>
  );
}
