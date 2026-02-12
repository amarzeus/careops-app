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
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
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
import { Booking, Contact, Service } from "@prisma/client";

// Types matching the parent component
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

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  COMPLETED: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 opacity-60",
  NO_SHOW: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 opacity-60",
};

export function FullCalendar({ bookings, onEdit, onNewBooking }: FullCalendarProps) {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM on mount/view change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 480; // 8 AM * 60px
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
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {monthDays.map((day) => {
          const isSelectedMonth = isSameMonth(day, currentDate);
          const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[120px] p-2 border-b border-r hover:bg-muted/5 transition-colors cursor-pointer relative group",
                !isSelectedMonth && "bg-muted/5 text-muted-foreground",
                isToday(day) && "bg-blue-50/30"
              )}
              onClick={() => {
                const d = new Date(day);
                d.setHours(9, 0); // Default to 9 AM
                onNewBooking(d);
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) ? "bg-blue-600 text-white shadow-sm" : "text-foreground group-hover:bg-muted"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayBookings.length > 0 && (
                   <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                     {dayBookings.length}
                   </span>
                )}
              </div>
              
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                {dayBookings.slice(0, 4).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(booking);
                    }}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded border truncate font-medium cursor-pointer shadow-sm transition-all hover:scale-[1.02]",
                      STATUS_COLORS[booking.status] || "bg-gray-100 border-gray-200"
                    )}
                  >
                    {format(new Date(booking.date), "h:mm a")} {booking.contact.name}
                  </div>
                ))}
                {dayBookings.length > 4 && (
                    <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                        + {dayBookings.length - 4} more
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
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Header Row */}
      <div className="flex border-b bg-muted/5">
        <div className="w-16 flex-shrink-0 border-r bg-muted/10"></div> {/* Time Label Gutter */}
        <div className="flex flex-1">
          {days.map((day) => (
            <div 
              key={day.toISOString()} 
              className={cn(
                "flex-1 text-center py-3 border-r last:border-r-0 transition-colors",
                isToday(day) && "bg-blue-50/30"
              )}
            >
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{format(day, "EEE")}</div>
              <div className={cn(
                "text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full mx-auto transition-all",
                isToday(day) ? "bg-blue-600 text-white shadow-md scale-110" : "text-foreground hover:bg-muted"
              )}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Time Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-1 overflow-y-auto relative custom-scrollbar bg-white"
        style={{ height: '600px' }}
      >
        <div className="flex w-full min-h-[1440px] relative"> {/* 1440px = 24h * 60px/hr */}
          
          {/* Time Labels Column */}
          <div className="w-16 flex-shrink-0 border-r bg-background select-none sticky left-0 z-20">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-[60px] relative">
                <span className="absolute -top-3 right-2 text-xs text-muted-foreground font-medium bg-background px-1">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Content */}
          <div className="flex flex-1 relative">
            
            {/* Horizontal Hour Lines (Background) */}
            <div className="absolute inset-0 w-full pointer-events-none z-0">
               {timeSlots.map((hour) => (
                 <div 
                    key={`line-${hour}`} 
                    className="h-[60px] border-b border-gray-100 w-full"
                 />
               ))}
            </div>

            {/* Day Columns */}
            {days.map((day, colIndex) => {
              const dayBookings = bookings.filter((b) => isSameDay(new Date(b.date), day));
              
              return (
                <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 relative group min-w-[100px]">
                   
                   {/* Current Time Indicator Line (if today) */}
                   {isToday(day) && (
                     <div 
                        className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                        style={{ top: `${getHours(new Date()) * 60 + getMinutes(new Date())}px` }}
                     >
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                     </div>
                   )}

                   {/* Clickable Slots (Hour blocks) */}
                   {timeSlots.map((hour) => (
                      <div 
                        key={`slot-${hour}`}
                        className="h-[60px] w-full absolute hover:bg-blue-50/30 cursor-pointer z-10 transition-colors"
                        style={{ top: `${hour * 60}px` }}
                        onClick={() => {
                            const d = new Date(day);
                            d.setHours(hour, 0);
                            onNewBooking(d);
                        }}
                      />
                   ))}

                   {/* Booking Events */}
                   {dayBookings.map((booking) => {
                      const start = new Date(booking.date);
                      const end = new Date(booking.endTime);
                      
                      const startMinutes = getHours(start) * 60 + getMinutes(start);
                      const durationMinutes = differenceInMinutes(end, start);
                      const height = Math.max(durationMinutes, 30); // Min height 30px (30 mins)

                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(booking);
                          }}
                          style={{
                            top: `${startMinutes}px`, // 1px per minute
                            height: `${height}px`,
                            left: "4px",
                            right: "4px",
                          }}
                          className={cn(
                            "absolute z-20 rounded-md border shadow-sm cursor-pointer overflow-hidden transition-all hover:z-30 hover:shadow-md hover:scale-[1.02] flex flex-col p-2",
                            STATUS_COLORS[booking.status] || "bg-gray-100 border-gray-200"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                             <span className="font-semibold text-xs truncate leading-tight">
                               {booking.service.name}
                             </span>
                             {height > 40 && (
                                <Avatar className="h-4 w-4 text-[8px]">
                                    <AvatarFallback className="bg-white/50 text-foreground">
                                        {booking.contact.name.substring(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                             )}
                          </div>
                          
                          <div className="text-[10px] font-medium opacity-90 truncate mt-0.5">
                            {booking.contact.name}
                          </div>
                          
                          {height > 45 && (
                             <div className="flex items-center gap-1 mt-auto text-[10px] opacity-75">
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
    <div className="flex flex-col h-full space-y-4 animate-in fade-in-50 duration-500">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
        
        {/* Navigation Group */}
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight min-w-[200px]">{headerTitle}</h2>
            
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background shadow-sm" onClick={prev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium hover:bg-background shadow-sm" onClick={goToToday}>
                    Today
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background shadow-sm" onClick={next}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
                <SelectTrigger className="w-[110px] h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                </SelectContent>
            </Select>
            
            <Button onClick={() => onNewBooking(currentDate)} className="h-9 shadow-sm bg-primary hover:bg-primary/90">
                <CalendarIcon className="w-4 h-4 mr-2" />
                New Booking
            </Button>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 bg-background rounded-lg">
        {view === "month" && renderMonthView()}
        {view === "week" && renderTimeGrid(weekDays)}
        {view === "day" && renderTimeGrid([currentDate])}
      </div>
    </div>
  );
}
