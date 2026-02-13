"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        notes: ""
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
            } catch (err) {
                console.error(err);
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
                const res = await fetch(`/api/booking/availability?serviceId=${selectedService.id}&date=${dateStr}`);
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
                        phone: form.phone
                    },
                    notes: form.notes
                })
            });

            if (res.ok) {
                setStep(4);
            } else {
                alert("Something went wrong. Please try again or choose a different slot.");
            }
        } catch (err) {
            alert("Error submitting booking.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!workspace) return <div className="h-screen flex items-center justify-center">Workspace not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">{workspace.name}</h1>
                    <p className="opacity-90 text-sm mt-1">{workspace.address}</p>
                </div>

                <div className="p-6 min-h-[400px]">
                    {/* Step 1: Select Service */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                Select a Service
                            </h2>
                            <div className="grid gap-3">
                                {workspace.services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service)}
                                        className="flex flex-col text-left p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="flex justify-between w-full">
                                            <span className="font-medium text-gray-900">{service.name}</span>
                                            <span className="text-gray-600">${service.price}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration} mins</span>
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{service.description}</p>
                                        )}
                                    </button>
                                ))}
                                {workspace.services.length === 0 && (
                                    <p className="text-center text-gray-500 py-10">No public services available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Date & Time */}
                    {step === 2 && selectedService && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                                <span className="text-sm font-medium text-gray-500">Booking: {selectedService.name}</span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 flex justify-center">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        disabled={(date) => date < addDays(new Date(), -1)}
                                        className="rounded-md border"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium mb-3">Available Times ({date ? format(date, "MMM d") : ""})</h3>

                                    {loadingSlots ? (
                                        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-gray-400" /></div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                            {availableSlots.length > 0 ? availableSlots.map(time => (
                                                <Button
                                                    key={time}
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => handleTimeSelect(time)}
                                                >
                                                    {time}
                                                </Button>
                                            )) : (
                                                <p className="col-span-2 text-center text-gray-500 py-4 text-sm">No slots available for this day.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {step === 3 && selectedService && (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="flex items-center gap-2 mb-4">
                                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="-ml-2">
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Service</span>
                                    <span className="font-medium">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{date ? format(date, "MMMM d, yyyy") : ""}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Time</span>
                                    <span className="font-medium">{selectedTime}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements?" />
                                </div>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2" onClick={handleBook} disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirm Booking
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
                            <p className="text-gray-600 max-w-sm">
                                We have sent a confirmation email to <strong>{form.email}</strong>. See you on {date ? format(date, "MMMM d") : ""} at {selectedTime}.
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
