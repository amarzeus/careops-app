"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, List, Clock } from "lucide-react";
import { Booking, Contact, Service } from "@prisma/client";
import { format, parseISO } from "date-fns";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BookingList } from "@/components/bookings/booking-list";
import { FullCalendar } from "@/components/bookings/full-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";

interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

/**
 *
 */
export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [externalEvents, setExternalEvents] = useState<
    { id: string; title: string; start: string; end?: string }[]
  >([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [initialDialogDate, setInitialDialogDate] = useState<Date | undefined>();

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, contactsRes, servicesRes, calendarStatusRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/contacts"),
        fetch("/api/services"),
        fetch("/api/integrations/google-calendar"),
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(
          (data.bookings || []).map((b: Record<string, unknown>) => ({
            ...b,
            date: new Date(b.date as string),
            endTime: new Date(b.endTime as string),
            createdAt: new Date(b.createdAt as string),
            updatedAt: new Date(b.updatedAt as string),
          }))
        );
      }

      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }

      if (calendarStatusRes.ok) {
        const status = await calendarStatusRes.json();

        // If connected, fetch events for the next 30 days and previous 7 days
        if (status.connected) {
          const timeMin = new Date();
          timeMin.setDate(timeMin.getDate() - 7);
          const timeMax = new Date();
          timeMax.setDate(timeMax.getDate() + 30);

          const eventsRes = await fetch(
            `/api/integrations/google-calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`
          );
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setExternalEvents(eventsData.events || []);
          }
        }
      }
    } catch (_error) {
      console.error("Error fetching data:", _error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (_error) {
      console.error("Error updating status:", _error);
    }
  };

  const handleBookingSubmit = async (data: unknown) => {
    const url = selectedBooking ? `/api/bookings/${selectedBooking.id}` : "/api/bookings";
    const method = selectedBooking ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchData();
      } else {
        throw new Error("Failed to save booking");
      }
    } catch (_error) {
      console.error("Error saving booking:", _error);
      throw _error;
    }
  };

  const handleEdit = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setInitialDialogDate(undefined);
    setDialogOpen(true);
  };

  const handleNewBooking = (date?: Date) => {
    setSelectedBooking(null);
    setInitialDialogDate(date);
    setDialogOpen(true);
  };

  // Filtering Logic
  const filterBookings = (list: BookingWithRelations[]) => {
    let filtered = list;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.contact.name.toLowerCase().includes(term) || b.service.name.toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((b) => b.date >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((b) => b.date <= end);
    }

    return filtered;
  };

  const getTabBookings = (tab: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = filterBookings(bookings);

    switch (tab) {
      case "today":
        return filtered.filter((b) => {
          const d = new Date(b.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      case "upcoming":
        return filtered.filter(
          (b) => new Date(b.date) > new Date() && ["PENDING", "CONFIRMED"].includes(b.status)
        );
      case "completed":
        return filtered.filter((b) => b.status === "COMPLETED");
      default:
        return filtered;
    }
  };

  const stats = {
    today: getTabBookings("today").length,
    upcoming: getTabBookings("upcoming").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    noShow: bookings.filter((b) => b.status === "NO_SHOW").length,
  };

  return (
    <div className="bg-muted/30 flex h-screen flex-col overflow-hidden">
      {/* Fixed Sticky Header */}
      <Header title="Bookings" subtitle="Manage appointments and schedules">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* List/Calendar Switcher */}
          <div className="xs:flex border-border/40 bg-muted/50 flex hidden rounded-lg border p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-7 rounded-md px-2 text-[10px] font-bold sm:px-3 sm:text-[11px]",
                viewMode === "list" && "bg-background shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "h-7 rounded-md px-2 text-[10px] font-bold sm:px-3 sm:text-[11px]",
                viewMode === "calendar" && "bg-background shadow-sm"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>

          <Button
            onClick={() => handleNewBooking()}
            className="bg-primary h-8 rounded-lg px-3 text-[10px] font-bold shadow-sm sm:px-4 sm:text-[11px]"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </Header>

      {/* Main Content Area - Non-Scrolling Body */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-6">
          {/* Professional B2B Stats Cards */}
          <div className="grid shrink-0 grid-cols-2 gap-3 overflow-x-hidden px-1 sm:gap-4 md:grid-cols-4">
            {[
              { label: "Today", val: stats.today, icon: CalendarIcon, color: "blue" },
              { label: "Upcoming", val: stats.upcoming, icon: Clock, color: "amber" },
              {
                label: "Completed",
                val: stats.completed,
                icon: Plus,
                color: "emerald",
                rotate: true,
              },
              { label: "No Show", val: stats.noShow, icon: Filter, color: "rose" },
            ].map((s) => (
              <Card
                key={s.label}
                className="border-border/40 group bg-background overflow-hidden border shadow-sm"
              >
                <CardContent className="relative p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground mb-0.5 truncate text-[10px] font-bold tracking-widest uppercase sm:text-xs">
                        {s.label}
                      </p>
                      <h3 className="text-foreground text-xl leading-none font-black tracking-tight sm:text-2xl">
                        {s.val}
                      </h3>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 rounded-xl border border-black/5 p-2 shadow-sm transition-transform group-hover:scale-110 sm:p-3",
                        s.color === "blue" && "text-primary bg-blue-50",
                        s.color === "amber" && "bg-amber-50 text-amber-600",
                        s.color === "emerald" && "bg-emerald-50 text-emerald-600",
                        s.color === "rose" && "bg-rose-50 text-rose-600"
                      )}
                    >
                      <s.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", s.rotate && "rotate-45")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border-border/40 bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
            {viewMode === "list" ? (
              <div className="flex h-full flex-col">
                {/* Inline Filters for List View */}
                <div className="border-border/40 bg-muted/30 flex flex-col items-center gap-2 border-b p-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground/60 absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2" />
                    <Input
                      placeholder="Search bookings..."
                      className="border-border/40 bg-background h-8 rounded-lg pl-8 text-[11px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="border-border/40 bg-background flex items-center gap-1.5 rounded-lg border p-0.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-muted-foreground h-7 px-2 text-[10px] font-medium"
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3 opacity-60" />
                          {dateFrom ? format(parseISO(dateFrom), "MMM d") : "Start Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={dateFrom ? parseISO(dateFrom) : undefined}
                          onSelect={(date) => setDateFrom(date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="h-3 w-px bg-slate-200" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-muted-foreground h-7 px-2 text-[10px] font-medium"
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3 opacity-60" />
                          {dateTo ? format(parseISO(dateTo), "MMM d") : "End Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={dateTo ? parseISO(dateTo) : undefined}
                          onSelect={(date) => setDateTo(date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <BookingList
                    bookings={getTabBookings("all")}
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={handleEdit}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <FullCalendar
                  bookings={bookings}
                  externalEvents={externalEvents}
                  onEdit={handleEdit}
                  onNewBooking={handleNewBooking}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleBookingSubmit}
        contacts={contacts}
        services={services}
        initialData={selectedBooking}
        initialDate={initialDialogDate}
      />
    </div>
  );
}
