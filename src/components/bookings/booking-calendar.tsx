"use client";

import * as React from "react";
import { addDays, format, isSameDay } from "date-fns";
import { Booking } from "@prisma/client";
import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarProps {
  bookings: Booking[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function BookingCalendar({
  bookings,
  selectedDate,
  onSelectDate,
}: BookingCalendarProps) {
  // Get days that have bookings
  const bookedDays = bookings.map((b) => new Date(b.date));

  // Determine modifiers for the calendar
  // We want to show a dot or indicator for days with bookings
  // The default Calendar component (react-day-picker) supports modifiers
  
  // Custom modifier to match days with bookings
  const hasBooking = (date: Date) => {
    return bookings.some((b) => isSameDay(new Date(b.date), date));
  };

  return (
    <div className="rounded-md border p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        className="rounded-md"
        modifiers={{
          booked: (date) => hasBooking(date),
        }}
        modifiersStyles={{
          booked: {
            fontWeight: "bold",
            textDecoration: "underline",
            color: "var(--primary)",
          },
        }}
      />
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {selectedDate ? (
          <p>Bookings for {format(selectedDate, "MMMM do, yyyy")}</p>
        ) : (
          <p>Select a date to view bookings</p>
        )}
      </div>
    </div>
  );
}
