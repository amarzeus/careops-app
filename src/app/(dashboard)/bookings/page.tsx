"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, List, ChevronRight, Clock } from "lucide-react";
import { Booking, Contact, Service } from "@prisma/client";
import { format, parseISO } from "date-fns";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BookingList } from "@/components/bookings/booking-list";
import { FullCalendar } from "@/components/bookings/full-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";

interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [externalEvents, setExternalEvents] = useState<any[]>([]);

  // Google Calendar Integration Status
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [initialDialogDate, setInitialDialogDate] = useState<Date | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, contactsRes, servicesRes, calendarStatusRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/contacts"),
        fetch("/api/services"),
        fetch("/api/integrations/google-calendar")
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings((data.bookings || []).map((b: any) => ({
          ...b,
          date: new Date(b.date),
          endTime: new Date(b.endTime),
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        })));
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
        setIsCalendarConnected(status.connected);

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
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleBookingSubmit = async (data: any) => {
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
    } catch (error) {
      console.error("Error saving booking:", error);
      throw error;
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
      filtered = filtered.filter(b =>
        b.contact.name.toLowerCase().includes(term) ||
        b.service.name.toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(b => b.date >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(b => b.date <= end);
    }

    return filtered;
  };

  const getTabBookings = (tab: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = filterBookings(bookings);

    switch (tab) {
      case "today":
        return filtered.filter(b => {
          const d = new Date(b.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
      case "upcoming":
        return filtered.filter(b => new Date(b.date) > new Date() && ["PENDING", "CONFIRMED"].includes(b.status));
      case "completed":
        return filtered.filter(b => b.status === "COMPLETED");
      default:
        return filtered;
    }
  };

  const stats = {
    today: getTabBookings("today").length,
    upcoming: getTabBookings("upcoming").length,
    completed: bookings.filter(b => b.status === "COMPLETED").length,
    noShow: bookings.filter(b => b.status === "NO_SHOW").length,
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50/20">
      {/* Fixed Sticky Header */}
      <Header title="Bookings" subtitle="Manage appointments and schedules">
        <div className="flex items-center gap-4">
          {/* List/Calendar Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-7 px-3 text-[10px] font-bold rounded-md", viewMode === "list" && "bg-white shadow-sm")}
            >
              <List className="w-3.5 h-3.5 mr-1.5" /> List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={cn("h-7 px-3 text-[10px] font-bold rounded-md", viewMode === "calendar" && "bg-white shadow-sm")}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Calendar
            </Button>
          </div>

          <Button onClick={() => handleNewBooking()} className="h-8 px-4 bg-primary text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Booking
          </Button>
        </div>
      </Header>

      {/* Main Content Area - Non-Scrolling Body */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
        <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 min-h-0">

          {/* Professional B2B Stats Cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            {[
              { label: "Today's Bookings", val: stats.today, icon: CalendarIcon, color: "blue" },
              { label: "Upcoming Bookings", val: stats.upcoming, icon: Clock, color: "amber" },
              { label: "Completed services", val: stats.completed, icon: Plus, color: "emerald", rotate: true },
              { label: "No Show alerts", val: stats.noShow, icon: Filter, color: "rose" },
            ].map((s) => (
              <Card key={s.label} className="border border-border/40 shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-4 relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{s.val}</h3>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl transition-transform group-hover:scale-110 shadow-sm border border-black/5",
                      s.color === "blue" && "bg-blue-50 text-blue-600",
                      s.color === "amber" && "bg-amber-50 text-amber-600",
                      s.color === "emerald" && "bg-emerald-50 text-emerald-600",
                      s.color === "rose" && "bg-rose-50 text-rose-600",
                    )}>
                      <s.icon className={cn("w-5 h-5", s.rotate && "rotate-45")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-xl border border-border/40 shadow-sm overflow-hidden flex flex-col min-h-0">
            {viewMode === "list" ? (
              <div className="flex flex-col h-full">
                {/* Inline Filters for List View */}
                <div className="p-3 border-b border-border/40 bg-slate-50/30 flex flex-col md:flex-row gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
                    <Input
                      placeholder="Search bookings..."
                      className="pl-8 h-8 text-[11px] bg-white border-slate-200 rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-slate-200">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-7 px-2 text-[10px] font-medium text-slate-500">
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
                        <Button variant="ghost" className="h-7 px-2 text-[10px] font-medium text-slate-500">
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
