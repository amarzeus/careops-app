"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, FileText, Calendar, ClipboardList,
  Package, Users, Rocket, Sparkles, Send, Check,
  ArrowRight, ArrowLeft, Mic, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Workspace", icon: Building2, description: "Set up your business" },
  { id: 2, title: "Communication", icon: Mail, description: "Email & SMS" },
  { id: 3, title: "Contact Form", icon: FileText, description: "Lead capture" },
  { id: 4, title: "Bookings", icon: Calendar, description: "Services & availability" },
  { id: 5, title: "Intake Forms", icon: ClipboardList, description: "Post-booking forms" },
  { id: 6, title: "Inventory", icon: Package, description: "Track resources" },
  { id: 7, title: "Staff", icon: Users, description: "Team members" },
  { id: 8, title: "Activate", icon: Rocket, description: "Go live!" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your CareOps AI assistant. I'll help you set up your workspace. You can fill in the forms on the left, or just tell me about your business and I'll help configure everything. What's your business name?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form state for all steps
  const [workspace, setWorkspace] = useState({ name: "", address: "", timezone: "UTC", contactEmail: "", contactPhone: "" });
  const [emailConfig, setEmailConfig] = useState({ emailProvider: "smtp", emailFromName: "", emailFromAddress: "", emailConfigured: false });
  const [contactForm, setContactForm] = useState({ name: "Contact Us", welcomeMessage: "Thank you for reaching out! We'll get back to you shortly." });
  const [services, setServices] = useState<Array<{ name: string; duration: string; location: string; availableDays: string; startTime: string; endTime: string }>>([]);
  const [newService, setNewService] = useState({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
  const [intakeForms, setIntakeForms] = useState<Array<{ name: string; description: string }>>([]);
  const [newIntakeForm, setNewIntakeForm] = useState({ name: "", description: "" });
  const [inventoryItems, setInventoryItems] = useState<Array<{ name: string; quantity: string; threshold: string; unit: string }>>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "0", threshold: "5", unit: "units" });
  const [staffMembers, setStaffMembers] = useState<Array<{ name: string; email: string; password: string }>>([]);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    fetchCurrentStep();
  }, []);

  const fetchCurrentStep = async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const { workspace: ws } = await res.json();
        if (ws) {
          setCurrentStep(ws.onboardingStep || 1);
          setWorkspace({ name: ws.name || "", address: ws.address || "", timezone: ws.timezone || "UTC", contactEmail: ws.contactEmail || "", contactPhone: ws.contactPhone || "" });
        }
      }
    } catch {}
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, currentStep, businessInfo: { workspace, emailConfig, services, inventoryItems } }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.message || "I understand. Let me help you with that." }]);
      
      if (data.extractedData) {
        applyExtractedData(data.extractedData);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble processing that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyExtractedData = (data: Record<string, any>) => {
    if (currentStep === 1) {
      setWorkspace(prev => ({
        ...prev,
        ...(data.businessName && { name: data.businessName }),
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.contactEmail && { contactEmail: data.contactEmail }),
        ...(data.email && { contactEmail: data.email }),
      }));
    }
  };

  const saveStep = async () => {
    setLoading(true);
    try {
      switch (currentStep) {
        case 1:
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...workspace, onboardingStep: 2 }),
          });
          break;
        case 2:
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...emailConfig, onboardingStep: 3 }),
          });
          break;
        case 3:
          await fetch("/api/forms/contact-forms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactForm),
          });
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 4 }),
          });
          break;
        case 4:
          for (const svc of services) {
            await fetch("/api/services", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(svc),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 5 }),
          });
          break;
        case 5:
          for (const form of intakeForms) {
            await fetch("/api/forms/intake-forms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 6 }),
          });
          break;
        case 6:
          for (const item of inventoryItems) {
            await fetch("/api/inventory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 7 }),
          });
          break;
        case 7:
          for (const staff of staffMembers) {
            await fetch("/api/staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(staff),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 8 }),
          });
          break;
        case 8:
          // Create default automation rules
          const defaultRules = [
            { name: "Welcome New Contact", trigger: "NEW_CONTACT", messageTemplate: "Welcome! Thank you for reaching out." },
            { name: "Booking Confirmation", trigger: "BOOKING_CREATED", messageTemplate: "Your booking has been confirmed." },
            { name: "Form Reminder", trigger: "FORM_PENDING", messageTemplate: "Please complete your pending form." },
            { name: "Low Inventory Alert", trigger: "INVENTORY_LOW", messageTemplate: "Inventory is running low." },
          ];
          for (const rule of defaultRules) {
            await fetch("/api/automation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(rule),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ACTIVE", onboardingStep: 8 }),
          });
          router.push("/dashboard");
          return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 8));
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    if (newService.name) {
      setServices(prev => [...prev, { ...newService }]);
      setNewService({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
    }
  };

  const addIntakeForm = () => {
    if (newIntakeForm.name) {
      setIntakeForms(prev => [...prev, { ...newIntakeForm }]);
      setNewIntakeForm({ name: "", description: "" });
    }
  };

  const addInventoryItem = () => {
    if (newItem.name) {
      setInventoryItems(prev => [...prev, { ...newItem }]);
      setNewItem({ name: "", quantity: "0", threshold: "5", unit: "units" });
    }
  };

  const addStaffMember = () => {
    if (newStaff.name && newStaff.email && newStaff.password) {
      setStaffMembers(prev => [...prev, { ...newStaff }]);
      setNewStaff({ name: "", email: "", password: "" });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input placeholder="Acme Health Clinic" value={workspace.name} onChange={e => setWorkspace(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Main St, City, State" value={workspace.address} onChange={e => setWorkspace(prev => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={workspace.timezone} onValueChange={v => setWorkspace(prev => ({ ...prev, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Email *</Label>
              <Input type="email" placeholder="contact@business.com" value={workspace.contactEmail} onChange={e => setWorkspace(prev => ({ ...prev, contactEmail: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1 (555) 123-4567" value={workspace.contactPhone} onChange={e => setWorkspace(prev => ({ ...prev, contactPhone: e.target.value }))} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Connect at least one communication channel. Email is recommended for automated messages.
            </div>
            <div className="space-y-2">
              <Label>Email From Name</Label>
              <Input placeholder="Acme Clinic" value={emailConfig.emailFromName} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email From Address</Label>
              <Input type="email" placeholder="hello@acmeclinic.com" value={emailConfig.emailFromAddress} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromAddress: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Switch checked={emailConfig.emailConfigured} onCheckedChange={v => setEmailConfig(prev => ({ ...prev, emailConfigured: v }))} />
              <div>
                <p className="text-sm font-medium">Enable Email Communication</p>
                <p className="text-xs text-gray-500">Automated emails will be sent for confirmations and reminders</p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              This form will be public. When visitors submit it, they become a contact and a conversation starts automatically.
            </div>
            <div className="space-y-2">
              <Label>Form Name</Label>
              <Input placeholder="Contact Us" value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea placeholder="Thank you for reaching out..." value={contactForm.welcomeMessage} onChange={e => setContactForm(prev => ({ ...prev, welcomeMessage: e.target.value }))} />
              <p className="text-xs text-gray-500">This message is sent automatically to new contacts</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-medium mb-2">Default Form Fields:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>- Full Name (required)</p>
                <p>- Email (required)</p>
                <p>- Phone (optional)</p>
                <p>- Message (optional)</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Create services that customers can book. Each service generates a public booking page.
            </div>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input placeholder="Initial Consultation" value={newService.name} onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={newService.duration} onChange={e => setNewService(prev => ({ ...prev, duration: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="Office" value={newService.location} onChange={e => setNewService(prev => ({ ...prev, location: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={newService.startTime} onChange={e => setNewService(prev => ({ ...prev, startTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={newService.endTime} onChange={e => setNewService(prev => ({ ...prev, endTime: e.target.value }))} />
                </div>
              </div>
              <Button onClick={addService} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newService.name}>Add Service</Button>
            </div>
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Added Services:</Label>
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.duration} min | {s.location || "No location"}</p>
                    </div>
                    <Badge variant="success">Added</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Intake forms are sent automatically after a booking is made. Collect information like medical history or required documents.
            </div>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Form Name *</Label>
                <Input placeholder="Patient Intake Form" value={newIntakeForm.name} onChange={e => setNewIntakeForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Please fill out this form before your appointment..." value={newIntakeForm.description} onChange={e => setNewIntakeForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <Button onClick={addIntakeForm} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newIntakeForm.name}>Add Intake Form</Button>
            </div>
            {intakeForms.length > 0 && (
              <div className="space-y-2">
                <Label>Added Forms:</Label>
                {intakeForms.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <p className="font-medium text-sm">{f.name}</p>
                    <Badge variant="success">Added</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Track items used per booking. Get alerts when stock runs low and auto-notify vendors.
            </div>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input placeholder="Surgical Gloves" value={newItem.name} onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={newItem.quantity} onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input type="number" value={newItem.threshold} onChange={e => setNewItem(prev => ({ ...prev, threshold: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="boxes" value={newItem.unit} onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))} />
                </div>
              </div>
              <Button onClick={addInventoryItem} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newItem.name}>Add Item</Button>
            </div>
            {inventoryItems.length > 0 && (
              <div className="space-y-2">
                <Label>Added Items:</Label>
                {inventoryItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} {item.unit} (alert at {item.threshold})</p>
                    </div>
                    <Badge variant="success">Added</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Invite staff to help manage bookings, inbox, and forms. They'll get their own login.
            </div>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Jane Smith" value={newStaff.name} onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="jane@clinic.com" value={newStaff.email} onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Temporary password" value={newStaff.password} onChange={e => setNewStaff(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              <Button onClick={addStaffMember} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!newStaff.name || !newStaff.email || !newStaff.password}>Add Staff</Button>
            </div>
            {staffMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Staff Members:</Label>
                {staffMembers.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <Badge variant="success">Added</Badge>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">You can skip this step and add staff later from Settings.</p>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg text-sm text-green-800 border border-green-200">
              Your workspace is ready to go live! Review the checklist below.
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", workspace.name ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Workspace configured: <strong>{workspace.name || "Not set"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", emailConfig.emailConfigured ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Communication channel: <strong>{emailConfig.emailConfigured ? "Email enabled" : "Not configured"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm">Contact form created</span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", services.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Services: <strong>{services.length} service(s)</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", intakeForms.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Intake forms: <strong>{intakeForms.length} form(s)</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", inventoryItems.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Inventory items: <strong>{inventoryItems.length} item(s)</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Check className={cn("w-5 h-5", staffMembers.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Staff members: <strong>{staffMembers.length} member(s)</strong></span>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              Once activated: Contact forms go live, booking links work, and automation starts running.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">CareOps Setup</h1>
          <div className="ml-auto">
            <Badge variant="secondary">Step {currentStep} of 8</Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <Progress value={(currentStep / 8) * 100} className="h-2" />
          <div className="flex justify-between mt-3 overflow-x-auto">
            {steps.map((step) => (
              <div key={step.id} className={cn("flex flex-col items-center min-w-[70px]", step.id === currentStep ? "text-blue-600" : step.id < currentStep ? "text-green-600" : "text-gray-400")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                  step.id === currentStep ? "bg-blue-100 text-blue-700" : step.id < currentStep ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                )}>
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-[10px] font-medium text-center hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 text-blue-600" })}
                  <div>
                    <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={saveStep} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? "Saving..." : currentStep === 8 ? "Activate Workspace" : "Save & Continue"}
                    {currentStep < 8 && <ArrowRight className="w-4 h-4 ml-2" />}
                    {currentStep === 8 && <Rocket className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">AI Setup Assistant</CardTitle>
                    <CardDescription className="text-xs">Powered by Gemini</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about setup..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
