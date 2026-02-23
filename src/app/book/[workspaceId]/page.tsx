"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { Clock, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
// Keep these as they are used later in the original code
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Types
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface Workspace {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
  services: Service[];
}

/**
 *
 */
export default function BookingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  // State
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Service, 2: Date/Time, 3: Details, 4: Success

  // Selection
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Workspace Data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await fetch(`/api/booking/context/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data);
        } else {
          // Handle 404
        }
      } catch (_err) {
        console.error(_err);
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId) fetchWorkspace();
  }, [workspaceId]);

  // Fetch Slots when Date/Service changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedService || !date) return;

      setLoadingSlots(true);
      setSelectedTime(null);

      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const res = await fetch(
          `/api/booking/availability?serviceId=${selectedService.id}&date=${dateStr}`
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
        }
      } catch (err) {
        console.error("Slot fetch error", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedService, date]);

  // Handlers
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const _showTimeIndicator = true;
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBook = async () => {
    if (!selectedService || !date || !selectedTime || !form.name || !form.email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: format(date, "yyyy-MM-dd"),
          time: selectedTime,
          contact: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          notes: form.notes,
        }),
      });

      if (res.ok) {
        setStep(4);
      } else {
        alert("Something went wrong. Please try again or choose a different slot.");
      }
    } catch (_err) {
      toast({ title: "Error", description: "Failed to submit booking", variant: "destructive" }); // Changed alert to toast
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary animate-spin" />
      </div>
    );
  if (!workspace)
    return <div className="flex h-screen items-center justify-center">Workspace not found</div>;

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center px-4 py-10">
      <div className="bg-background w-full max-w-7xl overflow-hidden rounded-xl border shadow-sm">
        {/* Header */}
        <div className="bg-primary p-6 text-center text-white">
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="mt-1 text-sm opacity-90">{workspace.address}</p>
        </div>

        <div className="min-h-[400px] p-6">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">Select a Service</h2>
              <div className="grid gap-3">
                {workspace.services.map(
                  (
                    service // Kept original mapping, assuming instruction was a placeholder error
                  ) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="group flex flex-col rounded-lg border p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
                    >
                      <div className="flex w-full justify-between">
                        <span className="text-foreground font-medium">{service.name}</span>
                        <span className="text-muted-foreground">${service.price}</span>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {service.duration} mins
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          {service.description}
                        </p>
                      )}
                    </button>
                  )
                )}
                {workspace.services.length === 0 && (
                  <p className="text-muted-foreground py-10 text-center">
                    No public services available.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <span className="text-muted-foreground text-sm font-medium">
                  Booking: {selectedService.name}
                </span>
              </div>

              <div className="flex flex-col gap-8 md:flex-row">
                <div className="flex flex-1 justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < addDays(new Date(), -1)}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 font-medium">
                    Available Times ({date ? format(date, "MMM d") : ""})
                  </h3>

                  {loadingSlots ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="text-muted-foreground animate-spin" />
                    </div>
                  ) : (
                    <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <Button
                            key={time}
                            variant="outline"
                            className="w-full"
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground col-span-2 py-4 text-center text-sm">
                          No slots available for this day.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && selectedService && (
            <div className="mx-auto max-w-md space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="-ml-2">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              </div>

              <div className="bg-muted/30 space-y-2 rounded-lg p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{date ? format(date, "MMMM d, yyyy") : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any specific requirements?"
                  />
                </div>

                <Button
                  className="bg-primary hover:bg-primary/90 mt-2 w-full"
                  onClick={handleBook}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-foreground text-2xl font-bold">Booking Confirmed!</h2>
              <p className="text-muted-foreground max-w-sm">
                We have sent a confirmation email to <strong>{form.email}</strong>. See you on{" "}
                {date ? format(date, "MMMM d") : ""} at {selectedTime}.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Book Another
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
