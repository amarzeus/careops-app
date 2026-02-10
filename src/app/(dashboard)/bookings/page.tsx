"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar, Plus, Clock, User, MapPin, Filter,
  CheckCircle, XCircle, AlertCircle, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  date: string;
  endTime: string;
  status: string;
  notes: string;
  service: { id: string; name: string; duration: number; location: string };
  contact: { id: string; name: string; email: string; phone: string };
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  location: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  NO_SHOW: { label: "No Show", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({ serviceId: "", contactId: "", date: "", time: "" });
  const [creating, setCreating] = useState(false);

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
      if (bookRes.ok) setBookings((await bookRes.json()).bookings);
      if (svcRes.ok) setServices((await svcRes.json()).services);
      if (conRes.ok) setContacts((await conRes.json()).contacts);
    } catch {} finally { setLoading(false); }
  };

  const createBooking = async () => {
    if (!newBooking.serviceId || !newBooking.contactId || !newBooking.date || !newBooking.time) return;
    setCreating(true);
    try {
      const dateTime = `${newBooking.date}T${newBooking.time}`;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: newBooking.serviceId, contactId: newBooking.contactId, date: dateTime }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setNewBooking({ serviceId: "", contactId: "", date: "", time: "" });
        fetchAll();
      }
    } catch {} finally { setCreating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchAll();
    } catch {}
  };

  const today = new Date().toISOString().split("T")[0];
  const filterBookings = (tab: string) => {
    switch (tab) {
      case "today": return bookings.filter(b => b.date.startsWith(today));
      case "upcoming": return bookings.filter(b => b.date > new Date().toISOString() && ["PENDING", "CONFIRMED"].includes(b.status));
      case "completed": return bookings.filter(b => b.status === "COMPLETED");
      default: return bookings;
    }
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const renderBookingCard = (booking: Booking) => {
    const { date, time } = formatDateTime(booking.date);
    const config = statusConfig[booking.status] || statusConfig.PENDING;

    return (
      <div key={booking.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
        <div className="w-14 text-center shrink-0">
          <p className="text-xs text-gray-500">{date.split(" ")[0]}</p>
          <p className="text-xl font-bold">{date.split(" ")[1]?.replace(",", "")}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{booking.contact.name}</p>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.service.name}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time} ({booking.service.duration}min)</span>
            {booking.service.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.service.location}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {booking.status === "PENDING" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "CONFIRMED")}>Confirm</Button>
          )}
          {booking.status === "CONFIRMED" && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(booking.id, "COMPLETED")}>Complete</Button>
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus(booking.id, "NO_SHOW")}>No-Show</Button>
            </>
          )}
          {["PENDING", "CONFIRMED"].includes(booking.status) && (
            <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => updateStatus(booking.id, "CANCELLED")}>Cancel</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header title="Bookings" subtitle="Manage all your appointments">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>Schedule a new appointment for a contact.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={newBooking.serviceId} onValueChange={v => setNewBooking(prev => ({ ...prev, serviceId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration}min)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select value={newBooking.contactId} onValueChange={v => setNewBooking(prev => ({ ...prev, contactId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newBooking.date} onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={newBooking.time} onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))} />
                </div>
              </div>
              <Button onClick={createBooking} className="w-full bg-blue-600 hover:bg-blue-700" disabled={creating}>
                {creating ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
            <TabsTrigger value="today">Today ({filterBookings("today").length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({filterBookings("upcoming").length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({filterBookings("completed").length})</TabsTrigger>
          </TabsList>
          {["all", "today", "upcoming", "completed"].map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-2 mt-4">
                {loading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)
                ) : filterBookings(tab).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  filterBookings(tab).map(renderBookingCard)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
