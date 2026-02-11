"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, FileText, Calendar, ClipboardList,
  Package, Users, Rocket, Sparkles, Send, Check,
  ArrowRight, ArrowLeft, Mic, Activity, MessageSquare, Edit2, Trash2
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
import { InlineVoiceMode } from "@/components/voice-assistant";
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
    { role: "assistant", content: "Hi! I'm your CareOps AI assistant. Tell me about your business — name, type, and location — and I'll set up everything for you. You can also tap the mic button to talk to me!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Form state for all steps
  const [workspace, setWorkspace] = useState({ name: "", address: "", timezone: "UTC", contactEmail: "", contactPhone: "" });
  const [emailConfig, setEmailConfig] = useState({ emailProvider: "smtp", emailFromName: "", emailFromAddress: "", emailConfigured: false });
  const [contactForm, setContactForm] = useState({ id: "", name: "Contact Us", welcomeMessage: "Thank you for reaching out! We'll get back to you shortly." });
  const [services, setServices] = useState<Array<{ id?: string; name: string; duration: string; location: string; availableDays: string; startTime: string; endTime: string }>>([]);
  const [newService, setNewService] = useState({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
  const [intakeForms, setIntakeForms] = useState<Array<{ id?: string; name: string; description: string; fields?: string }>>([]);
  const [newIntakeForm, setNewIntakeForm] = useState({ name: "", description: "" });
  const [inventoryItems, setInventoryItems] = useState<Array<{ id?: string; name: string; quantity: string; threshold: string; unit: string }>>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "0", threshold: "5", unit: "units" });
  const [staffMembers, setStaffMembers] = useState<Array<{ id?: string; name: string; email: string; password: string }>>([]);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    fetchCurrentStep(true);
  }, []);

  // Scroll chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Track step changes to trigger AI greeting (skip initial mount)
  const prevStepRef = useRef(0);
  useEffect(() => {
    if (prevStepRef.current !== 0 && prevStepRef.current !== currentStep) {
      // Step changed — fetch fresh context and trigger greeting
      fetchCurrentStep(false);
    }
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const triggerAIGreeting = async (step: number, contextData: any) => {
    setChatLoading(true);
    try {
      const businessInfo = {
        workspace: {
          name: contextData.name || "",
          address: contextData.address || "",
          timezone: contextData.timezone || "UTC",
          contactEmail: contextData.contactEmail || "",
          contactPhone: contextData.contactPhone || ""
        },
        emailConfig: {
          emailProvider: contextData.emailProvider || "smtp",
          emailFromName: contextData.emailFromName || "",
          emailFromAddress: contextData.emailFromAddress || "",
          emailConfigured: contextData.emailConfigured || false
        },
        contactForm: contextData.contactForms?.[0] || {},
        services: (contextData.services || []).map((s: any) => ({
          name: s.name, duration: String(s.duration), location: s.location || "",
          startTime: s.startTime || "09:00", endTime: s.endTime || "17:00"
        })),
        intakeForms: (contextData.intakeForms || []).map((f: any) => ({
          name: f.name, description: f.description || "", fields: f.fields || "[]"
        })),
        inventoryItems: (contextData.inventoryItems || []).map((i: any) => ({
          name: i.name, quantity: String(i.quantity), threshold: String(i.threshold), unit: i.unit || "units"
        })),
        staffMembers: (contextData.users || []).filter((u: any) => u.role === "STAFF").map((s: any) => ({
          name: s.name, email: s.email
        })),
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "__GREETING__", // Sentinel: triggers fire-up greeting in AI
          currentStep: step,
          businessInfo,
          conversationHistory: [], // Fresh start for greeting
        }),
      });
      const data = await res.json();
      const aiMessage = data.message || "Ready to start? I'm here to help.";
      setChatMessages([{ role: "assistant", content: aiMessage }]);

      // Apply any extracted data from proactive AI (e.g., auto-suggestions)
      // DISABLED: Prevent auto-fill on greeting to avoid hallucinations. User must confirm.
      /* if (data.extractedData) {
        applyExtractedData(data.extractedData);
      } */
    } catch (e) {
      setChatMessages([{ role: "assistant", content: "Hi! I'm here to help you set up this step. Tell me about your business or say 'set it up' and I'll suggest everything." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchCurrentStep = async (shouldUpdateStep = false) => {
    try {
      const res = await fetch("/api/onboarding/context");
      if (res.ok) {
        const { context: ws } = await res.json();
        if (ws) {
          // Sync form state from DB
          setWorkspace({
            name: ws.name || "",
            address: ws.address || "",
            timezone: ws.timezone || "UTC",
            contactEmail: ws.contactEmail || "",
            contactPhone: ws.contactPhone || ""
          });

          if (ws.emailProvider || ws.emailFromName || ws.emailFromAddress) {
            setEmailConfig({
              emailProvider: ws.emailProvider || "smtp",
              emailFromName: ws.emailFromName || "",
              emailFromAddress: ws.emailFromAddress || "",
              emailConfigured: ws.emailConfigured || false
            });
          }

          if (ws.services && ws.services.length > 0) {
            setServices(ws.services.map((s: any) => ({
              ...s,
              duration: String(s.duration)
            })));
          }

          if (ws.inventoryItems && ws.inventoryItems.length > 0) {
            setInventoryItems(ws.inventoryItems.map((i: any) => ({
              ...i,
              quantity: String(i.quantity),
              threshold: String(i.threshold)
            })));
          }

          if (ws.contactForms && ws.contactForms.length > 0) {
            setContactForm({
              id: ws.contactForms[0].id || "",
              name: ws.contactForms[0].name || "Contact Us",
              welcomeMessage: ws.contactForms[0].welcomeMessage || ""
            });
          }

          if (ws.intakeForms && ws.intakeForms.length > 0) {
            setIntakeForms(ws.intakeForms);
          }

          if (ws.users && ws.users.length > 1) {
            const staff = ws.users.filter((u: any) => u.role === "STAFF");
            setStaffMembers(staff.map((s: any) => ({
              name: s.name,
              email: s.email,
              password: "••••••••"
            })));
          }

          if (shouldUpdateStep) {
            // Initial page load — set step from DB and trigger greeting
            const dbStep = ws.onboardingStep || 1;
            setCurrentStep(dbStep);
            prevStepRef.current = dbStep; // Prevent the useEffect from firing a second greeting
            triggerAIGreeting(dbStep, ws);
          } else {
            // Step changed via navigation — trigger greeting for current step
            triggerAIGreeting(currentStep, ws);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch context:", e);
    }
  };

  const sendChatMessage = async (messageOverride?: string) => {
    const userMsg = messageOverride || chatInput.trim();
    if (!userMsg) return;
    if (!messageOverride) setChatInput("");
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          currentStep,
          businessInfo: {
            workspace,
            emailConfig,
            contactForm,
            services,
            intakeForms,
            inventoryItems,
            staffMembers
          },
          conversationHistory: updatedMessages.slice(-10), // Last 10 messages for focused context
        }),
      });
      const data = await res.json();
      const aiMessage = data.message || "I understand. Let me help you with that.";
      setChatMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);

      if (data.extractedData) {
        applyExtractedData(data.extractedData);
      }

      if (data.navigationAction && data.navigationAction.type === "jump") {
        setCurrentStep(data.navigationAction.targetStep);
      } else if (data.shouldAdvance) {
        setAutoAdvance(true);
      }

      return aiMessage;
    } catch {
      const errMsg = "Sorry, I had trouble processing that. Please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
      return errMsg;
    } finally {
      setChatLoading(false);
    }
  };

  // Voice transcript handler — sends to AI and returns response for TTS
  const handleVoiceTranscript = useCallback(async (text: string): Promise<string> => {
    const response = await sendChatMessage(text);
    return response || "I understand. Let me help you with that.";
  }, [currentStep, workspace, emailConfig, contactForm, services, intakeForms, inventoryItems, staffMembers, chatMessages]);

  const applyExtractedData = (data: Record<string, any>) => {
    if (currentStep === 1) {
      setWorkspace(prev => ({
        ...prev,
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.contactEmail && { contactEmail: data.contactEmail }),
        ...(data.contactPhone && { contactPhone: data.contactPhone }),
      }));
    } else if (currentStep === 2) {
      setEmailConfig(prev => ({
        ...prev,
        ...(data.emailProvider && { emailProvider: data.emailProvider }),
        ...(data.emailFromName && { emailFromName: data.emailFromName }),
        ...(data.emailFromAddress && { emailFromAddress: data.emailFromAddress }),
        ...(data.emailConfigured !== undefined && { emailConfigured: data.emailConfigured }),
      }));
    } else if (currentStep === 3) {
      setContactForm(prev => ({
        ...prev,
        ...(data.formName && { name: data.formName }),
        ...(data.welcomeMessage && { welcomeMessage: data.welcomeMessage }),
      }));
    } else if (currentStep === 4) {
      // Step 4: Services
      if (data.removeServices && Array.isArray(data.removeServices)) {
        const toRemove = data.removeServices.map((n: string) => n.toLowerCase());
        setServices(prev => prev.filter(s => !toRemove.includes(s.name.toLowerCase())));
      }

      if (data.addServices && Array.isArray(data.addServices)) {
        const newServices = data.addServices
          .filter((s: any) => s.name && !services.some(existing => existing.name === s.name))
          .map((s: any) => ({
            name: s.name,
            duration: String(s.duration || "30"),
            location: s.location || workspace.address || "",
            availableDays: "1,2,3,4,5",
            startTime: s.startTime || "09:00",
            endTime: s.endTime || "17:00"
          }));
        if (newServices.length > 0) {
          setServices(prev => [...prev, ...newServices]);
        }
      }

      if (data.updateServices && Array.isArray(data.updateServices)) {
        const updates = data.updateServices;
        setServices(prev => prev.map(s => {
          const match = updates.find((u: any) => u.name && u.name.toLowerCase() === s.name.toLowerCase());
          if (match) {
            return {
              ...s,
              ...(match.duration && { duration: String(match.duration) }),
              ...(match.location && { location: match.location }),
              ...(match.startTime && { startTime: match.startTime }),
              ...(match.endTime && { endTime: match.endTime })
            };
          }
          return s;
        }));
      } else if (data.addService) {
        const s = data.addService;
        if (s.name) {
          if (!services.some(existing => existing.name === s.name)) {
            setServices(prev => [...prev, {
              name: s.name,
              duration: String(s.duration || "30"),
              location: s.location || workspace.address || "",
              availableDays: "1,2,3,4,5",
              startTime: s.startTime || "09:00",
              endTime: s.endTime || "17:00"
            }]);
          }
        }
      } else if (data.updateLastService) {
        const u = data.updateLastService;
        setServices(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const updated = { ...last, ...u };
          return [...prev.slice(0, -1), updated];
        });
      }
    } else if (currentStep === 5) {
      if (data.removeIntakeForms && Array.isArray(data.removeIntakeForms)) {
        const toRemove = data.removeIntakeForms.map((n: string) => n.toLowerCase());
        setIntakeForms(prev => prev.filter(f => !toRemove.includes(f.name.toLowerCase())));
      }

      if (data.addIntakeForms && Array.isArray(data.addIntakeForms)) {
        const newForms = data.addIntakeForms
          .filter((f: any) => f.name && !intakeForms.some(existing => existing.name === f.name))
          .map((f: any) => ({
            name: f.name,
            description: f.description || "",
            fields: f.questions ? JSON.stringify(f.questions) : "[]"
          }));
        if (newForms.length > 0) {
          setIntakeForms(prev => [...prev, ...newForms]);
        }
      }

      if (data.updateIntakeForms && Array.isArray(data.updateIntakeForms)) {
        const updates = data.updateIntakeForms;
        setIntakeForms(prev => prev.map(f => {
          const match = updates.find((u: any) => u.name && u.name.toLowerCase() === f.name.toLowerCase());
          if (match) {
            return {
              ...f,
              ...(match.description && { description: match.description }),
              ...(match.fields && { fields: typeof match.fields === 'string' ? match.fields : JSON.stringify(match.fields) })
            };
          }
          return f;
        }));
      } else if (data.addIntakeForm) {
        const f = data.addIntakeForm;
        if (f.name) {
          if (!intakeForms.some(existing => existing.name === f.name)) {
            setIntakeForms(prev => [...prev, {
              name: f.name,
              description: f.description || "",
              fields: f.questions ? JSON.stringify(f.questions) : "[]"
            }]);
          }
        }
      } else if (data.updateLastIntakeForm) {
        const u = data.updateLastIntakeForm;
        setIntakeForms(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const updated = {
            ...last,
            ...u,
            fields: u.questions ? JSON.stringify(u.questions) : last.fields
          };
          return [...prev.slice(0, -1), updated];
        });
      }
    } else if (currentStep === 6) {
      if (data.removeInventoryItems && Array.isArray(data.removeInventoryItems)) {
        const toRemove = data.removeInventoryItems.map((n: string) => n.toLowerCase());
        setInventoryItems(prev => prev.filter(i => !toRemove.includes(i.name.toLowerCase())));
      }

      if (data.addInventoryItems && Array.isArray(data.addInventoryItems)) {
        const newItems = data.addInventoryItems
          .filter((item: any) => item.name && !inventoryItems.some(existing => existing.name === item.name))
          .map((item: any) => ({
            name: item.name,
            quantity: String(item.quantity || "0"),
            threshold: String(item.threshold || "5"),
            unit: item.unit || "units"
          }));
        if (newItems.length > 0) {
          setInventoryItems(prev => [...prev, ...newItems]);
        }
      }

      if (data.updateInventoryItems && Array.isArray(data.updateInventoryItems)) {
        const updates = data.updateInventoryItems;
        setInventoryItems(prev => prev.map(item => {
          const match = updates.find((u: any) => u.name && u.name.toLowerCase() === item.name.toLowerCase());
          if (match) {
            return {
              ...item,
              ...(match.quantity && { quantity: String(match.quantity) }),
              ...(match.threshold && { threshold: String(match.threshold) }),
              ...(match.unit && { unit: match.unit })
            };
          }
          return item;
        }));
      } else if (data.addInventoryItem) {
        const item = data.addInventoryItem;
        if (item.name) {
          if (!inventoryItems.some(existing => existing.name === item.name)) {
            setInventoryItems(prev => [...prev, {
              name: item.name,
              quantity: String(item.quantity || "0"),
              threshold: String(item.threshold || "5"),
              unit: item.unit || "units"
            }]);
          }
        }
      } else if (data.updateLastInventoryItem) {
        const u = data.updateLastInventoryItem;
        setInventoryItems(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const updated = { ...last, ...u };
          return [...prev.slice(0, -1), updated];
        });
      }
    } else if (currentStep === 7) {
      if (data.removeStaffMember) {
        const toRemove = data.removeStaffMember.toLowerCase();
        setStaffMembers(prev => prev.filter(s => s.email.toLowerCase() !== toRemove));
      }

      if (data.addStaffMember) {
        const s = data.addStaffMember;
        if (s.name && s.email) {
          if (!staffMembers.some(existing => existing.email === s.email)) {
            setStaffMembers(prev => [...prev, {
              name: s.name,
              email: s.email,
              password: s.password || "welcome123"
            }]);
          }
        }
      }

      if (data.updateStaffMember) {
        const u = data.updateStaffMember;
        if (u.email) {
          setStaffMembers(prev => prev.map(s => {
            if (s.email.toLowerCase() === u.email.toLowerCase()) {
              return {
                ...s,
                ...(u.name && { name: u.name }),
                ...(u.role && { role: u.role })
              };
            }
            return s;
          }));
        }
      } else if (data.updateLastStaffMember) {
        const u = data.updateLastStaffMember;
        setStaffMembers(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const updated = { ...last, ...u };
          return [...prev.slice(0, -1), updated];
        });
      }
    }
  };

  const saveStep = async (advanceStep = true) => {
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
          if (!contactForm.id) {
            await fetch("/api/forms/contact-forms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(contactForm),
            });
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 4 }),
          });
          break;
        case 4:
          for (const svc of services) {
            if (svc.id) {
              await fetch(`/api/services`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(svc),
              });
            } else {
              await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(svc),
              });
            }
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 5 }),
          });
          break;
        case 5:
          for (const form of intakeForms) {
            if (form.id) {
              await fetch("/api/forms/intake-forms", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
            } else {
              await fetch("/api/forms/intake-forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
            }
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 6 }),
          });
          break;
        case 6:
          for (const item of inventoryItems) {
            if (item.id) {
              await fetch(`/api/inventory`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
              });
            } else {
              await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
              });
            }
          }
          await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingStep: 7 }),
          });
          break;
        case 7:
          for (const staff of staffMembers) {
            if (!staff.id) {
              await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(staff),
              });
            }
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
      if (advanceStep) {
        setCurrentStep(prev => Math.min(prev + 1, 8));
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance logic: wait for state update to complete before saving
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (autoAdvance) {
      timeout = setTimeout(() => {
        saveStep();
        setAutoAdvance(false);
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [autoAdvance, workspace, emailConfig, contactForm, services, intakeForms, inventoryItems, staffMembers]);

  const addService = () => {
    if (newService.name) {
      setServices(prev => [...prev, { ...newService }]);
      setNewService({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
    }
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const editService = (index: number) => {
    setNewService(services[index]);
    removeService(index);
  };

  const addIntakeForm = () => {
    if (newIntakeForm.name) {
      setIntakeForms(prev => [...prev, { ...newIntakeForm }]);
      setNewIntakeForm({ name: "", description: "" });
    }
  };

  const removeIntakeForm = (index: number) => {
    setIntakeForms(prev => prev.filter((_, i) => i !== index));
  };

  const editIntakeForm = (index: number) => {
    setNewIntakeForm(intakeForms[index]);
    removeIntakeForm(index);
  };

  const addInventoryItem = () => {
    if (newItem.name) {
      setInventoryItems(prev => [...prev, { ...newItem }]);
      setNewItem({ name: "", quantity: "0", threshold: "5", unit: "units" });
    }
  };

  const removeInventoryItem = (index: number) => {
    setInventoryItems(prev => prev.filter((_, i) => i !== index));
  };

  const editInventoryItem = (index: number) => {
    setNewItem(inventoryItems[index]);
    removeInventoryItem(index);
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
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">Business Name *</Label>
              <Input placeholder="Acme Health Clinic" value={workspace.name} onChange={e => setWorkspace(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Address</Label>
                <Input placeholder="123 Main St" value={workspace.address} onChange={e => setWorkspace(prev => ({ ...prev, address: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Timezone</Label>
                <Select value={workspace.timezone} onValueChange={v => setWorkspace(prev => ({ ...prev, timezone: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
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
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Contact Email *</Label>
                <Input type="email" placeholder="contact@business.com" value={workspace.contactEmail} onChange={e => setWorkspace(prev => ({ ...prev, contactEmail: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Phone</Label>
                <Input placeholder="+1 (555) 123-4567" value={workspace.contactPhone} onChange={e => setWorkspace(prev => ({ ...prev, contactPhone: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Connect at least one channel.
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Sender Name</Label>
                <Input placeholder="Acme Clinic" value={emailConfig.emailFromName} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromName: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Sender Email</Label>
                <Input type="email" placeholder="hello@acmeclinic.com" value={emailConfig.emailFromAddress} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromAddress: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50/50">
              <Switch checked={emailConfig.emailConfigured} onCheckedChange={v => setEmailConfig(prev => ({ ...prev, emailConfigured: v }))} id="email-switch" />
              <Label htmlFor="email-switch" className="cursor-pointer">
                <p className="text-xs font-bold uppercase text-gray-500">Enable Email</p>
                <p className="text-[10px] text-gray-500">Auto-send confirmations</p>
              </Label>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              This form will be public.
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">Form Name</Label>
              <Input placeholder="Contact Us" value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">Welcome Message</Label>
              <Textarea placeholder="Thank you for reaching out..." value={contactForm.welcomeMessage} onChange={e => setContactForm(prev => ({ ...prev, welcomeMessage: e.target.value }))} className="h-16 text-sm" />
              <p className="text-[10px] text-gray-500">Sent automatically to new contacts</p>
            </div>
            <div className="p-2 border rounded-lg bg-gray-50">
              <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Default Fields</p>
              <div className="space-y-0.5 text-[10px] text-gray-600 grid grid-cols-2">
                <p>Full Name (required)</p>
                <p>Email (required)</p>
                <p>Phone (optional)</p>
                <p>Message (optional)</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Create services customers can book. Tell the AI your business type and it will suggest services automatically.
            </div>
            <div className="space-y-2 p-2 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Service Name *</Label>
                <Input placeholder="Initial Consultation" value={newService.name} onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Duration (min)</Label>
                  <Input type="number" value={newService.duration} onChange={e => setNewService(prev => ({ ...prev, duration: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Location</Label>
                  <Input placeholder="Office" value={newService.location} onChange={e => setNewService(prev => ({ ...prev, location: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Start Time</Label>
                  <Input type="time" value={newService.startTime} onChange={e => setNewService(prev => ({ ...prev, startTime: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">End Time</Label>
                  <Input type="time" value={newService.endTime} onChange={e => setNewService(prev => ({ ...prev, endTime: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button onClick={addService} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newService.name}>Add Service</Button>
            </div>
            {services.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Added Services ({services.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-white text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[10px] text-gray-500">{s.duration}m | {s.startTime}-{s.endTime} {s.location ? `| ${s.location}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => editService(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => removeService(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] h-5 px-1 ml-1">Added</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Auto-send forms after booking. AI can generate forms with relevant questions for your business.
            </div>
            <div className="space-y-2 p-2 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Form Name *</Label>
                <Input placeholder="Patient Intake Form" value={newIntakeForm.name} onChange={e => setNewIntakeForm(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Description</Label>
                <Textarea placeholder="Please fill out this form..." value={newIntakeForm.description} onChange={e => setNewIntakeForm(prev => ({ ...prev, description: e.target.value }))} className="h-16 text-sm" />
              </div>
              <Button onClick={addIntakeForm} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newIntakeForm.name}>Add Form</Button>
            </div>
            {intakeForms.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Added Forms ({intakeForms.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {intakeForms.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-white text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{f.name}</p>
                        {f.fields && JSON.parse(f.fields).length > 0 && (
                          <p className="text-[10px] text-gray-500">{JSON.parse(f.fields).length} Questions</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => editIntakeForm(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => removeIntakeForm(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] h-5 px-1 ml-1">Added</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Track stock levels. Get alerts when low. AI can suggest items for your business type.
            </div>
            <div className="space-y-2 p-2 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Item Name *</Label>
                <Input placeholder="Surgical Gloves" value={newItem.name} onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Quantity</Label>
                  <Input type="number" value={newItem.quantity} onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Threshold</Label>
                  <Input type="number" value={newItem.threshold} onChange={e => setNewItem(prev => ({ ...prev, threshold: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-gray-500">Unit</Label>
                  <Input placeholder="boxes" value={newItem.unit} onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button onClick={addInventoryItem} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newItem.name}>Add Item</Button>
            </div>
            {inventoryItems.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Added Items ({inventoryItems.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {inventoryItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-white text-xs animate-fade-in">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{item.quantity} {item.unit} (alert: {item.threshold})</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] h-5 px-1">Added</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Invite staff members. This step is optional — you can add team members later.
            </div>
            <div className="space-y-2 p-2 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Name *</Label>
                <Input placeholder="Jane Smith" value={newStaff.name} onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Email *</Label>
                <Input type="email" placeholder="jane@clinic.com" value={newStaff.email} onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Password *</Label>
                <Input type="password" placeholder="Temporary password" value={newStaff.password} onChange={e => setNewStaff(prev => ({ ...prev, password: e.target.value }))} className="h-8 text-sm" />
              </div>
              <Button onClick={addStaffMember} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newStaff.name || !newStaff.email || !newStaff.password}>Add Staff</Button>
            </div>
            {staffMembers.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Staff Members</Label>
                <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                  {staffMembers.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-white text-xs">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[10px] text-gray-500">{s.email}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] h-5 px-1">Added</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-500 text-center">You can skip/add later.</p>
          </div>
        );
      case 8:
        return (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg text-xs text-green-800 border border-green-200">
              Your workspace is ready to go live! Review the checklist below.
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", workspace.name ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Workspace configured: <strong>{workspace.name || "Not set"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", emailConfig.emailConfigured ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Communication: <strong>{emailConfig.emailConfigured ? "Enabled" : "Not configured"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">Contact form created</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", services.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Services: <strong>{services.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", intakeForms.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Intake forms: <strong>{intakeForms.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", inventoryItems.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Inventory items: <strong>{inventoryItems.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-white">
                <Check className={cn("w-4 h-4", staffMembers.length > 0 ? "text-green-600" : "text-gray-300")} />
                <span className="text-sm">Staff members: <strong>{staffMembers.length}</strong></span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
              Once activated: Contact forms go live, booking links work, and automation starts running.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900">CareOps Setup</h1>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Step {currentStep}/8</Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-1.5">
        <div className="max-w-6xl mx-auto">
          <Progress value={(currentStep / 8) * 100} className="h-1.5" />
          <div className="flex justify-between mt-2 overflow-x-auto pb-1">
            {steps.map((step) => (
              <div key={step.id} className={cn("flex flex-col items-center min-w-[60px]", step.id === currentStep ? "text-blue-600" : step.id < currentStep ? "text-green-600" : "text-gray-400")}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium mb-0.5",
                  step.id === currentStep ? "bg-blue-100 text-blue-700" : step.id < currentStep ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                )}>
                  {step.id < currentStep ? <Check className="w-3 h-3" /> : step.id}
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
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
                  <Button variant="outline" onClick={() => {
                    saveStep(false); // Save in background
                    setCurrentStep(prev => Math.max(1, prev - 1));
                  }} disabled={currentStep === 1 || loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={() => saveStep()} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? "Saving..." : currentStep === 8 ? "Activate Workspace" : "Save & Continue"}
                    {currentStep < 8 && <ArrowRight className="w-4 h-4 ml-2" />}
                    {currentStep === 8 && <Rocket className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Panel */}
          <div className="lg:col-span-2 order-first lg:order-last mb-4 lg:mb-0">
            <Card className="h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm">AI Setup Assistant</CardTitle>
                    <CardDescription className="text-xs">Powered by Gemini — Text or Voice</CardDescription>
                  </div>
                  {/* Voice mode toggle button in header */}
                  <button
                    onClick={() => setVoiceMode(!voiceMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 shadow-sm"
                  >
                    {voiceMode ? <MessageSquare className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {voiceMode ? "Chat" : "Voice"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {voiceMode ? (
                  <InlineVoiceMode
                    onTranscript={handleVoiceTranscript}
                    onClose={() => setVoiceMode(false)}
                    className="h-full"
                    initialGreeting="Hi! I'm ready to help you set up your business."
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm animate-fade-in",
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
                  </div>
                )}
              </CardContent>
              {!voiceMode && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything about setup..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setVoiceMode(true)}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0"
                      title="Voice mode"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={() => sendChatMessage()} disabled={chatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}