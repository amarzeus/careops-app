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
  startOfDay,
  differenceInMinutes,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isWithinInterval,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

// Premium color palette (lighter backgrounds, stronger accents)
const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-blue-50/80 border-l-4 border-blue-500 text-blue-700 hover:bg-blue-100",
  PENDING: "bg-yellow-50/80 border-l-4 border-yellow-500 text-yellow-700 hover:bg-yellow-100",
  COMPLETED: "bg-green-50/80 border-l-4 border-green-500 text-green-700 hover:bg-green-100",
  CANCELLED: "bg-red-50/50 border-l-4 border-red-300 text-red-600/70 opacity-80 hover:opacity-100",
  NO_SHOW: "bg-red-50/50 border-l-4 border-red-300 text-red-600/70 opacity-80 hover:opacity-100",
};

const HOUR_HEIGHT = 50; // More compact height

export function FullCalendar({ bookings, onEdit, onNewBooking }: FullCalendarProps) {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM on mount/view change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT; 
    }
  }, [view]);

  // Generate time slots (0-23 hours)
  const timeSlots = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // --- Navigation ---
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
        : `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM do, yyyy");
  }, [view, currentDate]);

  // --- Data Helpers ---
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // --- Renderers ---

  const renderMonthView = () => (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-muted/5">
        {monthDays.map((day) => {
          const isSelectedMonth = isSameMonth(day, currentDate);
          const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
          const isTodayDate = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-border/40 hover:bg-white transition-all cursor-pointer relative group flex flex-col",
                !isSelectedMonth && "bg-muted/10 text-muted-foreground/50",
                isTodayDate && "bg-blue-50/10"
              )}
              onClick={() => {
                const d = new Date(day);
                d.setHours(9, 0); 
                onNewBooking(d);
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all",
                    isTodayDate 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px] no-scrollbar">
                {dayBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(booking);
                    }}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded-sm truncate font-medium cursor-pointer transition-all hover:scale-[1.02] shadow-sm",
                      STATUS_STYLES[booking.status]?.replace("border-l-4", "border-l-2") || "bg-gray-100"
                    )}
                  >
                    {format(new Date(booking.date), "h:mm a")} {booking.contact.name.split(" ")[0]}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                    <div className="text-[9px] text-muted-foreground pl-1 font-medium">
                        +{dayBookings.length - 3} more
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTimeGrid = (days: Date[]) => (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Header Row */}
      <div className="flex border-b border-border/50 sticky top-0 bg-white z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="w-14 flex-shrink-0 border-r border-transparent"></div> {/* Gutter */}
        <div className="flex flex-1">
          {days.map((day) => {
            const isTodayDate = isToday(day);
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "flex-1 text-center py-3 border-r border-border/30 last:border-r-0 transition-colors",
                  isTodayDate && "bg-blue-50/20"
                )}
              >
                <div className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest mb-1",
                  isTodayDate ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(day, "EEE")}
                </div>
                <div className={cn(
                  "text-lg font-light w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-all",
                  isTodayDate ? "bg-primary text-primary-foreground shadow-md font-medium" : "text-foreground"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Time Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-1 overflow-y-auto relative bg-white"
        style={{ height: '600px' }}
      >
        <div className="flex w-full relative" style={{ height: 24 * HOUR_HEIGHT }}>
          
          {/* Time Labels Column */}
          <div className="w-14 flex-shrink-0 border-r border-border/40 select-none sticky left-0 z-20 bg-white">
            {timeSlots.map((hour) => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground/70 font-medium font-mono">
                  {hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Content */}
          <div className="flex flex-1 relative bg-[url('/grid-pattern.svg')]">
            
            {/* Horizontal Hour Lines */}
            <div className="absolute inset-0 w-full pointer-events-none z-0">
               {timeSlots.map((hour) => (
                 <div 
                    key={`line-${hour}`} 
                    className="border-b border-dashed border-gray-100 w-full"
                    style={{ height: HOUR_HEIGHT }}
                 />
               ))}
            </div>

            {/* Day Columns */}
            {days.map((day, colIndex) => {
              const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
              const isTodayDate = isToday(day);
              
              return (
                <div key={day.toISOString()} className={cn(
                  "flex-1 border-r border-dashed border-gray-100 last:border-r-0 relative group min-w-[100px]",
                  isTodayDate && "bg-blue-50/5"
                )}>
                   
                   {/* Current Time Indicator */}
                   {isTodayDate && (
                     <div 
                        className="absolute w-full border-t-2 border-red-500/80 z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        style={{ top: `${(getHours(new Date()) * 60 + getMinutes(new Date())) * (HOUR_HEIGHT / 60)}px` }}
                     >
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-[5px] ring-2 ring-white"></div>
                     </div>
                   )}

                   {/* Clickable Slots */}
                   {timeSlots.map((hour) => (
                      <div 
                        key={`slot-${hour}`}
                        className="w-full absolute hover:bg-muted/20 cursor-pointer z-10 transition-colors"
                        style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        onClick={() => {
                            const d = new Date(day);
                            d.setHours(hour, 0);
                            onNewBooking(d);
                        }}
                      />
                   ))}

                   {/* Events */}
                   {dayBookings.map((booking) => {
                      const start = new Date(booking.date);
                      const end = new Date(booking.endTime);
                      
                      const startMinutes = getHours(start) * 60 + getMinutes(start);
                      const durationMinutes = differenceInMinutes(end, start);
                      
                      // Calculate position based on HOUR_HEIGHT (e.g. 50px per 60min)
                      const top = startMinutes * (HOUR_HEIGHT / 60);
                      const height = Math.max(durationMinutes * (HOUR_HEIGHT / 60), 24); // Min height 24px

                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(booking);
                          }}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: "3px",
                            right: "3px",
                          }}
                          className={cn(
                            "absolute z-20 rounded-sm shadow-sm cursor-pointer overflow-hidden transition-all hover:z-30 hover:shadow-md hover:translate-y-[-1px] flex flex-col p-1.5",
                            STATUS_STYLES[booking.status] || "bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                             <span className="font-semibold text-[11px] truncate leading-tight">
                               {booking.service.name}
                             </span>
                          </div>
                          
                          {height > 30 && (
                            <div className="text-[10px] font-medium opacity-80 truncate mt-0.5 flex items-center gap-1">
                              <span className="truncate">{booking.contact.name}</span>
                            </div>
                          )}
                          
                          {height > 50 && (
                             <div className="flex items-center gap-1 mt-auto text-[9px] opacity-70 font-mono">
                               <Clock className="w-3 h-3" />
                               <span>
                                 {format(start, "h:mm")} - {format(end, "h:mm a")}
                               </span>
                             </div>
                          )}
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
    <Card className="flex flex-col h-full shadow-sm border-border/60 overflow-hidden bg-gray-50/50">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-b border-border/40 gap-4">
        
        {/* Navigation Group */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center rounded-lg border border-border/50 bg-white shadow-sm p-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={prev}>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium hover:bg-muted" onClick={goToToday}>
                    Today
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={next}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            
            <h2 className="text-lg font-semibold tracking-tight min-w-[160px] text-center sm:text-left ml-2">
                {headerTitle}
            </h2>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="bg-muted/50 p-0.5 rounded-lg border border-border/20 flex">
                {(['month', 'week', 'day'] as ViewMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setView(m)}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                            view === m 
                                ? "bg-white text-foreground shadow-sm border border-border/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>
            
            <Button onClick={() => onNewBooking(currentDate)} size="sm" className="h-8 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4">
                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                Add Booking
            </Button>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 bg-white overflow-hidden relative">
        {view === "month" && renderMonthView()}
        {view === "week" && renderTimeGrid(weekDays)}
        {view === "day" && renderTimeGrid([currentDate])}
      </div>
    </Card>
  );
}
