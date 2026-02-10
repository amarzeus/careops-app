"use client";

import React, { useEffect, useState, use } from "react";
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft, Activity, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string; name: string; description: string; duration: number; location: string;
  availableDays: string; startTime: string; endTime: string;
}

export default function PublicBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workspace, setWorkspace] = useState<{ id: string; name: string; address: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/public/book?workspace=${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        setServices(data.services);
      }
    } catch {} finally { setLoading(false); }
  };

  const generateTimeSlots = (service: Service) => {
    const slots: string[] = [];
    const [startH, startM] = service.startTime.split(":").map(Number);
    const [endH, endM] = service.endTime.split(":").map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current + service.duration <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      current += 30; // 30-minute intervals
    }
    return slots;
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !contact.name) return;
    setBooking(true); setError("");
    try {
      const dateTime = `${selectedDate}T${selectedTime}:00`;
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selectedService.id, date: dateTime, name: contact.name, email: contact.email, phone: contact.phone, workspaceId: id }),
      });
      if (res.ok) { setSuccess(true); }
      else { const d = await res.json(); setError(d.error || "Booking failed"); }
    } catch { setError("Something went wrong"); } finally { setBooking(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">Your appointment has been scheduled. You'll receive a confirmation email shortly.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-2">
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            {selectedService?.location && <p><strong>Location:</strong> {selectedService.location}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{workspace?.name || "Business"}</h1>
              {workspace?.address && <p className="text-sm text-gray-500">{workspace.address}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Step 1: Select Service */}
        {!selectedService ? (
          <>
            <h2 className="text-lg font-semibold">Select a Service</h2>
            <div className="space-y-3">
              {services.map(service => (
                <Card key={service.id} className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all" onClick={() => setSelectedService(service)}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration} min</span>
                        {service.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{service.location}</span>}
                      </div>
                    </div>
                    <Badge variant="outline">Select</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Selected Service Header */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedService(null); setSelectedDate(""); setSelectedTime(""); }}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Badge variant="secondary">{selectedService.name} - {selectedService.duration} min</Badge>
            </div>

            {/* Step 2: Date & Time */}
            <Card>
              <CardHeader><CardTitle className="text-base">Choose Date & Time</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                {selectedDate && (
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {generateTimeSlots(selectedService).map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                            selectedTime === time ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50 hover:border-blue-300"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Contact Info */}
            {selectedTime && (
              <Card>
                <CardHeader><CardTitle className="text-base">Your Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
                  <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="John Doe" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="john@example.com" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input type="tel" placeholder="+1 (555) 123-4567" value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} /></div>
                  <Button onClick={handleBook} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base" disabled={booking || !contact.name}>
                    {booking ? "Booking..." : "Confirm Booking"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
