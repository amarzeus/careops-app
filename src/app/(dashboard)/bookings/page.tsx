"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, List } from "lucide-react";
import { Booking, Contact, Service } from "@prisma/client";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";

import { BookingList } from "@/components/bookings/booking-list";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { FullCalendar } from "@/components/bookings/full-calendar";

interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [initialDialogDate, setInitialDialogDate] = useState<Date | undefined>(undefined);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [bookRes, svcRes, conRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/services"),
        fetch("/api/contacts"),
      ]);
      
      if (bookRes.ok) {
        const data = await bookRes.json();
        // Ensure dates are Date objects if needed, or handle strings. 
        // Prisma returns strings for dates in JSON. 
        // But our components might expect Date objects or strings.
        // The BookingList expects BookingWithRelations which extends Booking (Prisma types have Date).
        // However, JSON serialization turns Dates to strings.
        // We might need to map them back to Dates if we strictly follow the type, 
        // OR rely on the fact that JS handles it loosely, but TypeScript might complain.
        // For safety, let's map dates.
        const parsedBookings = data.bookings.map((b: any) => ({
          ...b,
          date: new Date(b.date),
          endTime: new Date(b.endTime),
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        }));
        setBookings(parsedBookings);
      }
      if (svcRes.ok) setServices((await svcRes.json()).services);
      if (conRes.ok) setContacts((await conRes.json()).contacts);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      // Combine date and time
      const dateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(":");
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      const payload = {
        serviceId: data.serviceId,
        contactId: data.contactId,
        date: dateTime.toISOString(),
        notes: data.notes,
      };

      let res;
      if (selectedBooking) {
        res = await fetch(`/api/bookings/${selectedBooking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Operation failed");
      
      toast({ 
        title: "Success", 
        description: `Booking ${selectedBooking ? "updated" : "created"} successfully`,
        variant: "default" // success variant is not standard in shadcn toast unless customized, using default
      });
      
      fetchAll();
    } catch (error) {
      throw error; // Let the dialog handle the error state
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      toast({ title: "Updated", description: `Booking status changed to ${status}` });
      fetchAll();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.contact.name.toLowerCase().includes(term) ||
        b.service.name.toLowerCase().includes(term)
      );
    }

    // Date Range
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

  return (
    <div className="flex flex-col h-full">
      <Header title="Bookings" subtitle="Manage appointments and schedules">
        <div className="flex items-center gap-2">
           <div className="flex bg-muted rounded-lg p-1">
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("list")}
                className="h-7 px-3"
              >
                <List className="w-4 h-4 mr-2" /> List
              </Button>
              <Button 
                variant={viewMode === "calendar" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("calendar")}
                className="h-7 px-3"
              >
                <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
              </Button>
           </div>
           <Button onClick={() => handleNewBooking()} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </div>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{getTabBookings("today").length}</span>
              <span className="text-xs text-muted-foreground">Today</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{getTabBookings("upcoming").length}</span>
              <span className="text-xs text-muted-foreground">Upcoming</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === "COMPLETED").length}
              </span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </CardContent>
          </Card>
           <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-destructive">
                {bookings.filter(b => b.status === "NO_SHOW").length}
              </span>
              <span className="text-xs text-muted-foreground">No Show</span>
            </CardContent>
          </Card>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                    type="date" 
                    className="w-auto" 
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)} 
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input 
                    type="date" 
                    className="w-auto" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)} 
                />
                {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="icon" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                        <Filter className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              {["all", "today", "upcoming", "completed"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <BookingList 
                    bookings={getTabBookings(tab)} 
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={handleEdit}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <FullCalendar
            bookings={bookings}
            onEdit={handleEdit}
            onNewBooking={handleNewBooking}
          />
        )}
      </div>

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateOrUpdate}
        contacts={contacts}
        services={services}
        initialData={selectedBooking}
        initialDate={initialDialogDate}
      />
    </div>
  );
}
