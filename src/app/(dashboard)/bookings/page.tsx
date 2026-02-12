"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar, Plus, Clock, User, MapPin, Filter,
  CheckCircle, XCircle, AlertCircle, MoreHorizontal,
  Search, Share2, Copy, ExternalLink, FileText, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
  const [newBooking, setNewBooking] = useState({ serviceId: "", contactId: "", date: "", time: "", notes: "" });
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [linkCopied, setLinkCopied] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editBooking, setEditBooking] = useState({ serviceId: "", date: "", time: "", notes: "" });
  const [saving, setSaving] = useState(false);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load bookings";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const createBooking = async () => {
    if (!newBooking.serviceId || !newBooking.contactId || !newBooking.date || !newBooking.time) return;
    setCreating(true);
    try {
      const dateTime = `${newBooking.date}T${newBooking.time}`;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: newBooking.serviceId,
          contactId: newBooking.contactId,
          date: dateTime,
          notes: newBooking.notes || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Booking created", variant: "success" });
        setDialogOpen(false);
        setNewBooking({ serviceId: "", contactId: "", date: "", time: "", notes: "" });
        fetchAll();
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: `Booking marked as ${status.toLowerCase()}`, variant: "success" });
      fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openEditDialog = (booking: Booking) => {
    const d = new Date(booking.date);
    setEditBooking({
      serviceId: booking.service.id,
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
      notes: booking.notes || "",
    });
    setEditOpen(true);
  };

  const saveBookingEdit = async () => {
    if (!selectedBooking || !editBooking.date || !editBooking.time) return;
    setSaving(true);
    try {
      const dateTime = `${editBooking.date}T${editBooking.time}`;
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateTime,
          notes: editBooking.notes,
          serviceId: editBooking.serviceId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      toast({ title: "Success", description: "Booking updated", variant: "success" });
      setEditOpen(false);
      setDetailOpen(false);
      fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setSaving(false); }
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

  const searchBookings = (bookingsList: Booking[]) => {
    let filtered = bookingsList;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.contact.name.toLowerCase().includes(term) ||
        b.service.name.toLowerCase().includes(term)
      );
    }
    if (dateFrom) {
      filtered = filtered.filter(b => b.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(b => b.date <= dateTo + "T23:59:59");
    }
    return filtered;
  };

  const sortByDate = (bookingsList: Booking[]) => {
    return [...bookingsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredSorted = (tab: string) => {
    return sortByDate(searchBookings(filterBookings(tab)));
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const copyBookingLink = (bookingId: string) => {
    const url = `${window.location.origin}/booking/${bookingId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(bookingId);
    setTimeout(() => setLinkCopied(""), 2000);
  };

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const renderBookingCard = (booking: Booking) => {
    const { date, time } = formatDateTime(booking.date);
    const config = statusConfig[booking.status] || statusConfig.PENDING;

    return (
      <div
        key={booking.id}
        className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
        onClick={() => openDetail(booking)}
      >
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
          {booking.notes && (
            <p className="text-xs text-gray-400 mt-1 truncate">Note: {booking.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400"
            onClick={() => copyBookingLink(booking.id)}
          >
            {linkCopied === booking.id ? <CheckCircle className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
          </Button>
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
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about this booking..."
                  value={newBooking.notes}
                  onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <Button onClick={createBooking} className="w-full bg-blue-600 hover:bg-blue-700" disabled={creating}>
                {creating ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="p-6">
        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filterBookings("today").length}</p>
              <p className="text-xs text-gray-500">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filterBookings("upcoming").length}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === "COMPLETED").length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{bookings.filter(b => b.status === "NO_SHOW").length}</p>
              <p className="text-xs text-gray-500">No-Show</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by contact or service name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-auto"
              placeholder="From"
            />
            <span className="text-gray-400 text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-auto"
              placeholder="To"
            />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                Clear
              </Button>
            )}
          </div>
        </div>

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
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                      <Skeleton className="h-10 w-14 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  ))
                ) : getFilteredSorted(tab).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">
                      {searchTerm || dateFrom || dateTo
                        ? "No bookings match your filters"
                        : "No bookings found"}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {searchTerm || dateFrom || dateTo
                        ? "Try adjusting your search or date range"
                        : "Create your first booking to get started"}
                    </p>
                    {!searchTerm && !dateFrom && !dateTo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Create Booking
                      </Button>
                    )}
                  </div>
                ) : (
                  getFilteredSorted(tab).map(renderBookingCard)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Full details for this appointment.</DialogDescription>
          </DialogHeader>
          {selectedBooking && (() => {
            const { date, time } = formatDateTime(selectedBooking.date);
            const endTime = selectedBooking.endTime ? formatDateTime(selectedBooking.endTime).time : null;
            const config = statusConfig[selectedBooking.status] || statusConfig.PENDING;
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant={config.variant} className="text-sm">{config.label}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyBookingLink(selectedBooking.id)}
                  >
                    {linkCopied === selectedBooking.id
                      ? <><CheckCircle className="w-3 h-3 mr-1" /> Copied!</>
                      : <><Share2 className="w-3 h-3 mr-1" /> Share Link</>
                    }
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    <p className="font-medium text-sm flex items-center gap-1"><User className="w-3 h-3" /> {selectedBooking.contact.name}</p>
                    {selectedBooking.contact.email && <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.contact.email}</p>}
                    {selectedBooking.contact.phone && <p className="text-xs text-gray-500">{selectedBooking.contact.phone}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Service</p>
                    <p className="font-medium text-sm">{selectedBooking.service.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.service.duration} minutes</p>
                    {selectedBooking.service.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{selectedBooking.service.location}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="font-medium text-sm flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Time</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {time}
                      {endTime && <span className="text-gray-400">- {endTime}</span>}
                    </p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedBooking.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-xs text-gray-400">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
                  {["PENDING", "CONFIRMED"].includes(selectedBooking.status) && (
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedBooking)}>
                      <Pencil className="w-3 h-3 mr-1" /> Reschedule
                    </Button>
                  )}
                  {selectedBooking.status === "PENDING" && (
                    <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedBooking.id, "CONFIRMED"); setDetailOpen(false); }}>Confirm</Button>
                  )}
                  {selectedBooking.status === "CONFIRMED" && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { updateStatus(selectedBooking.id, "COMPLETED"); setDetailOpen(false); }}>Complete</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => { updateStatus(selectedBooking.id, "NO_SHOW"); setDetailOpen(false); }}>No-Show</Button>
                    </>
                  )}
                  {["PENDING", "CONFIRMED"].includes(selectedBooking.status) && (
                    <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => { updateStatus(selectedBooking.id, "CANCELLED"); setDetailOpen(false); }}>Cancel Booking</Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit/Reschedule Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Reschedule or update this appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={editBooking.serviceId} onValueChange={v => setEditBooking(prev => ({ ...prev, serviceId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration}min)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editBooking.date} onChange={e => setEditBooking(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={editBooking.time} onChange={e => setEditBooking(prev => ({ ...prev, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes..."
                value={editBooking.notes}
                onChange={e => setEditBooking(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveBookingEdit} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
