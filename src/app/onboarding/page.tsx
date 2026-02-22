"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, FileText, Calendar, ClipboardList,
  Package, Users, Rocket, Check,
  ArrowRight, ArrowLeft, Edit2, Trash2
} from "lucide-react";
// Actually just remove Activity from the list
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIChatCard } from "@/components/onboarding/ai-chat-card";
import { cn } from "@/lib/utils";

interface IncomingService {
  name?: string;
  duration?: string | number;
  location?: string;
  startTime?: string;
  endTime?: string;
  availableDays?: string;
}

interface IncomingForm {
  name?: string;
  description?: string;
  fields?: string | any[];
  questions?: any[];
}

interface IncomingItem {
  id?: string;
  name?: string;
  quantity?: string | number;
  threshold?: string | number;
  unit?: string;
}

interface IncomingUser {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
}

interface ContextData {
  name?: string;
  address?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  emailProvider?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  services?: IncomingService[];
  intakeForms?: IncomingForm[];
  inventoryItems?: IncomingItem[];
  users?: IncomingUser[];
  contactForms?: any[];
  emailConfigured?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const steps = [
  { id: 1, title: "Workspace", description: "Set up your business identity", icon: Building2 },
  { id: 2, title: "Communication", description: "Configure email and SMS", icon: Mail },
  { id: 3, title: "Contact Form", description: "Define your public intake form", icon: FileText },
  { id: 4, title: "Services", description: "Set up your booking services", icon: Calendar },
  { id: 5, title: "Intake Forms", description: "Post-booking customer forms", icon: ClipboardList },
  { id: 6, title: "Inventory", description: "Track your stock levels", icon: Package },
  { id: 7, title: "Staff", description: "Invite your team members", icon: Users },
  { id: 8, title: "Activation", description: "Review and go live", icon: Rocket },
];

/**
 *
 */
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
  const fetchCurrentStepRef = useRef<(shouldUpdateStep?: boolean) => Promise<void>>(async () => { });
  const saveStepRef = useRef<(advanceStep?: boolean, isAuto?: boolean) => Promise<void>>(async () => { });
  const applyExtractedDataRef = useRef<(data: Record<string, unknown>) => void>(() => { });
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Form state for all steps
  const [workspace, setWorkspace] = useState({ name: "", address: "", timezone: "UTC", contactEmail: "", contactPhone: "" });
  const [emailConfig, setEmailConfig] = useState({ emailProvider: "smtp", emailFromName: "", emailFromAddress: "", emailConfigured: false });
  const [contactForm, setContactForm] = useState({ id: "", name: "Contact Us", welcomeMessage: "Thank you for reaching out! We'll get back to you shortly." });
  const [services, setServices] = useState<Array<{ id?: string; name: string; duration: string; location: string; availableDays: string; startTime: string; endTime: string }>>([]);
  const [newService, setNewService] = useState({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
  const [intakeForms, setIntakeForms] = useState<Array<{ id?: string; name: string; description: string; fields?: string; serviceId?: string; documents?: string }>>([]);
  const [newIntakeForm, setNewIntakeForm] = useState<{ name: string; description: string; serviceId: string; documents: Array<{ name: string; url: string }> }>({ name: "", description: "", serviceId: "", documents: [] });
  const [editingIndex, setEditingIndex] = useState<{ type: "service" | "form" | "inventory" | "staff" | null, index: number }>({ type: null, index: -1 });
  const [inventoryItems, setInventoryItems] = useState<Array<{ id?: string; name: string; quantity: string; threshold: string; unit: string }>>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "0", threshold: "5", unit: "units" });
  const [staffMembers, setStaffMembers] = useState<Array<{ id?: string; name: string; email: string; password: string }>>([]);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    void fetchCurrentStepRef.current(true);
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
      void fetchCurrentStepRef.current(false);
    }
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const triggerAIGreeting = async (step: number, contextData: ContextData) => {
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
        services: (contextData.services || []).map((s: IncomingService) => ({
          name: s.name || "", duration: String(s.duration || "30"), location: s.location || "",
          startTime: s.startTime || "09:00", endTime: s.endTime || "17:00"
        })),
        intakeForms: (contextData.intakeForms || []).map((f: IncomingForm) => ({
          name: f.name || "", description: f.description || "", fields: typeof f.fields === 'string' ? f.fields : JSON.stringify(f.fields || [])
        })),
        inventoryItems: (contextData.inventoryItems || []).map((i: IncomingItem) => ({
          name: i.name || "", quantity: String(i.quantity || "0"), threshold: String(i.threshold || "5"), unit: i.unit || "units"
        })),
        staffMembers: (contextData.users || []).filter((u: IncomingUser) => u.role === "STAFF").map((s: IncomingUser) => ({
          name: s.name || "", email: s.email || ""
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
    } catch (_e) {
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
            setServices(ws.services.map((s: IncomingService) => ({
              ...s,
              name: s.name || "",
              location: s.location || "",
              availableDays: s.availableDays || "1,2,3,4,5",
              startTime: s.startTime || "09:00",
              endTime: s.endTime || "17:00",
              duration: String(s.duration || "30")
            })));
          }

          if (ws.inventoryItems && ws.inventoryItems.length > 0) {
            setInventoryItems(ws.inventoryItems.map((i: IncomingItem) => ({
              ...i,
              name: i.name || "",
              unit: i.unit || "units",
              quantity: String(i.quantity || "0"),
              threshold: String(i.threshold || "5")
            })));
          }

          if (ws.contactForms && ws.contactForms.length > 0) {
            setContactForm({
              id: ws.contactForms[0].id || "",
              name: ws.contactForms[0].name || "Contact Us",
              welcomeMessage: ws.contactForms[0].welcomeMessage || ""
            });
          }

          if (ws.intakeForms && ws.intakeForms.length > 0 && intakeForms.length === 0) {
            setIntakeForms(ws.intakeForms);
          }

          if (ws.users && ws.users.length > 1 && staffMembers.length === 0) {
            const staff = ws.users.filter((u: IncomingUser) => u.role === "STAFF");
            setStaffMembers(staff.map((s: IncomingUser) => ({
              id: s.id,
              name: s.name || "",
              email: s.email || "",
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

  fetchCurrentStepRef.current = fetchCurrentStep;

  const sendChatMessage = useCallback(async (messageOverride?: string) => {
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.message || "The AI Assistant is currently busy. Please continue manually or try again in a moment.";
        setChatMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
        return errMsg;
      }

      const data = await res.json();
      const aiMessage = data.message || "I understand. Let me help you with that.";
      setChatMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);

      if (data.extractedData) {
        applyExtractedDataRef.current(data.extractedData);
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
  }, [chatInput, chatMessages, currentStep, workspace, emailConfig, contactForm, services, intakeForms, inventoryItems, staffMembers]);

  // Voice transcript handler — sends to AI and returns response for TTS
  const handleVoiceTranscript = useCallback(async (text: string): Promise<string> => {
    const response = await sendChatMessage(text);
    return response || "I understand. Let me help you with that.";
  }, [sendChatMessage]);

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

  applyExtractedDataRef.current = applyExtractedData;

  const saveStep = async (advanceStep: boolean = true, isAuto: boolean = false) => {
    if (loading) return;
    if (isAuto && currentStep === 8) return; // Never auto-activate
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
          const servicesToSave = [...services];
          if (newService.name) {
            servicesToSave.push({ ...newService });
            setNewService({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
          }
          for (const svc of servicesToSave) {
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
          await fetchCurrentStep(false);
          break;
        case 5:
          const formsToSave = [...intakeForms];
          if (newIntakeForm.name) {
            formsToSave.push({ ...newIntakeForm, documents: JSON.stringify(newIntakeForm.documents) });
            setNewIntakeForm({ name: "", description: "", serviceId: "", documents: [] });
          }
          for (const form of formsToSave) {
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
          await fetchCurrentStep(false);
          break;
        case 6:
          const itemsToSave = [...inventoryItems];
          if (newItem.name) {
            itemsToSave.push({ ...newItem });
            setNewItem({ name: "", quantity: "0", threshold: "5", unit: "units" });
          }
          for (const item of itemsToSave) {
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
          await fetchCurrentStep(false);
          break;
        case 7:
          const staffToSave = [...staffMembers];
          if (newStaff.name && newStaff.email && newStaff.password) {
            staffToSave.push({ ...newStaff });
            setNewStaff({ name: "", email: "", password: "" });
          }
          for (const staff of staffToSave) {
            if (staff.id) {
              await fetch("/api/staff", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(staff),
              });
            } else {
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
          await fetchCurrentStep(false);
          break;
        case 8:
          const validationRes = await fetch("/api/workspace/validate-activation");
          const validation = await validationRes.json();
          if (!validation.valid) {
            alert(`Cannot activate: ${validation.errors.join(", ")}`);
            setLoading(false);
            return;
          }
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

  saveStepRef.current = saveStep;

  // Auto-advance logic: wait for state update to complete before saving
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (autoAdvance && currentStep < 8) {
      timeout = setTimeout(() => {
        void saveStepRef.current(true, true);
        setAutoAdvance(false);
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [autoAdvance, currentStep, workspace, emailConfig, contactForm, services, intakeForms, inventoryItems, staffMembers]);

  const addService = () => {
    if (newService.name) {
      if (editingIndex.type === "service" && editingIndex.index >= 0) {
        setServices(prev => prev.map((s, i) => i === editingIndex.index ? { ...newService } : s));
        setEditingIndex({ type: null, index: -1 });
      } else {
        setServices(prev => [...prev, { ...newService }]);
      }
      setNewService({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
    }
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
    if (editingIndex.type === "service" && editingIndex.index === index) {
      setEditingIndex({ type: null, index: -1 });
      setNewService({ name: "", duration: "30", location: "", availableDays: "1,2,3,4,5", startTime: "09:00", endTime: "17:00" });
    }
  };

  const editService = (index: number) => {
    setNewService(services[index]);
    setEditingIndex({ type: "service", index });
  };

  const addIntakeForm = () => {
    if (newIntakeForm.name) {
      if (editingIndex.type === "form" && editingIndex.index >= 0) {
        setIntakeForms(prev => prev.map((f, i) => i === editingIndex.index ? { ...newIntakeForm, documents: JSON.stringify(newIntakeForm.documents) } : f));
        setEditingIndex({ type: null, index: -1 });
      } else {
        setIntakeForms(prev => [...prev, { ...newIntakeForm, documents: JSON.stringify(newIntakeForm.documents) }]);
      }
      setNewIntakeForm({ name: "", description: "", serviceId: "", documents: [] });
    }
  };

  const removeIntakeForm = (index: number) => {
    setIntakeForms(prev => prev.filter((_, i) => i !== index));
    if (editingIndex.type === "form" && editingIndex.index === index) {
      setEditingIndex({ type: null, index: -1 });
      setNewIntakeForm({ name: "", description: "", serviceId: "", documents: [] });
    }
  };

  const editIntakeForm = (index: number) => {
    const form = intakeForms[index];
    let docs = [];
    try {
      docs = JSON.parse(form.documents || "[]");
    } catch { }
    setNewIntakeForm({ ...form, serviceId: form.serviceId || "", documents: docs });
    setEditingIndex({ type: "form", index });
  };

  const addInventoryItem = () => {
    if (newItem.name) {
      if (editingIndex.type === "inventory" && editingIndex.index >= 0) {
        setInventoryItems(prev => prev.map((item, i) => i === editingIndex.index ? { ...newItem } : item));
        setEditingIndex({ type: null, index: -1 });
      } else {
        setInventoryItems(prev => [...prev, { ...newItem }]);
      }
      setNewItem({ name: "", quantity: "0", threshold: "5", unit: "units" });
    }
  };

  const removeInventoryItem = (index: number) => {
    setInventoryItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex.type === "inventory" && editingIndex.index === index) {
      setEditingIndex({ type: null, index: -1 });
      setNewItem({ name: "", quantity: "0", threshold: "5", unit: "units" });
    }
  };

  const editInventoryItem = (index: number) => {
    setNewItem(inventoryItems[index]);
    setEditingIndex({ type: "inventory", index });
  };

  const addStaffMember = () => {
    if (newStaff.name && newStaff.email && newStaff.password) {
      if (editingIndex.type === "staff" && editingIndex.index >= 0) {
        setStaffMembers(prev => prev.map((s, i) => i === editingIndex.index ? { ...newStaff } : s));
        setEditingIndex({ type: null, index: -1 });
      } else {
        setStaffMembers(prev => [...prev, { ...newStaff }]);
      }
      setNewStaff({ name: "", email: "", password: "" });
    }
  };

  const removeStaffMember = (index: number) => {
    setStaffMembers(prev => prev.filter((_, i) => i !== index));
    if (editingIndex.type === "staff" && editingIndex.index === index) {
      setEditingIndex({ type: null, index: -1 });
      setNewStaff({ name: "", email: "", password: "" });
    }
  };

  const editStaffMember = (index: number) => {
    setNewStaff(staffMembers[index]);
    setEditingIndex({ type: "staff", index });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setNewIntakeForm(prev => ({
          ...prev,
          documents: [...prev.documents, { name: data.name, url: data.url }]
        }));
      }
    } catch (error) {
      console.error("Upload error", error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Business Name *</Label>
              <Input placeholder="Acme Health Clinic" value={workspace.name} onChange={e => setWorkspace(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Address</Label>
                <Input placeholder="123 Main St" value={workspace.address} onChange={e => setWorkspace(prev => ({ ...prev, address: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Timezone</Label>
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
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Contact Email *</Label>
                <Input type="email" placeholder="contact@business.com" value={workspace.contactEmail} onChange={e => setWorkspace(prev => ({ ...prev, contactEmail: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Phone</Label>
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
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Sender Name</Label>
                <Input placeholder="Acme Clinic" value={emailConfig.emailFromName} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromName: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Sender Email</Label>
                <Input type="email" placeholder="hello@acmeclinic.com" value={emailConfig.emailFromAddress} onChange={e => setEmailConfig(prev => ({ ...prev, emailFromAddress: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30/50">
              <Switch checked={emailConfig.emailConfigured} onCheckedChange={v => setEmailConfig(prev => ({ ...prev, emailConfigured: v }))} id="email-switch" />
              <Label htmlFor="email-switch" className="cursor-pointer">
                <p className="text-xs font-bold uppercase text-muted-foreground">Enable Email</p>
                <p className="text-[10px] text-muted-foreground">Auto-send confirmations</p>
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
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Form Name</Label>
              <Input placeholder="Contact Us" value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Welcome Message</Label>
              <Textarea placeholder="Thank you for reaching out..." value={contactForm.welcomeMessage} onChange={e => setContactForm(prev => ({ ...prev, welcomeMessage: e.target.value }))} className="h-16 text-sm" />
              <p className="text-[10px] text-muted-foreground">Sent automatically to new contacts</p>
            </div>
            <div className="p-2 border rounded-lg bg-muted/30">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Default Fields</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground grid grid-cols-2">
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
            <div className="space-y-2 p-2 border rounded-lg bg-muted/30/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Service Name *</Label>
                <Input placeholder="Initial Consultation" value={newService.name} onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (min)</Label>
                  <Input type="number" value={newService.duration} onChange={e => setNewService(prev => ({ ...prev, duration: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Location</Label>
                  <Input placeholder="Office" value={newService.location} onChange={e => setNewService(prev => ({ ...prev, location: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Start Time</Label>
                  <Input type="time" value={newService.startTime} onChange={e => setNewService(prev => ({ ...prev, startTime: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">End Time</Label>
                  <Input type="time" value={newService.endTime} onChange={e => setNewService(prev => ({ ...prev, endTime: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button onClick={addService} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newService.name}>
                {editingIndex.type === "service" ? "Update Service" : "Add Service"}
              </Button>
            </div>
            {services.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Added Services ({services.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-background text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.duration}m | {s.startTime}-{s.endTime} {s.location ? `| ${s.location}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600" onClick={() => editService(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeService(i)}>
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
            <div className="space-y-2 p-2 border rounded-lg bg-muted/30/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Form Name *</Label>
                <Input placeholder="Patient Intake Form" value={newIntakeForm.name} onChange={e => setNewIntakeForm(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Description</Label>
                <Textarea placeholder="Please fill out this form..." value={newIntakeForm.description} onChange={e => setNewIntakeForm(prev => ({ ...prev, description: e.target.value }))} className="h-16 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Link to Service (Optional)</Label>
                <Select value={newIntakeForm.serviceId || "none"} onValueChange={v => setNewIntakeForm(prev => ({ ...prev, serviceId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select a service..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General Form)</SelectItem>
                    {services.map((s, _i) => (
                      s.id ? <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem> : null
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Form will be sent automatically when this service is booked.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Documents (Agreement, etc.)</Label>
                <Input type="file" onChange={handleFileUpload} className="h-8 text-sm" />
                {newIntakeForm.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-blue-600">
                    <FileText className="w-3 h-3" /> {doc.name}
                  </div>
                ))}
              </div>
              <Button onClick={addIntakeForm} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newIntakeForm.name}>
                {editingIndex.type === "form" ? "Update Form" : "Add Form"}
              </Button>
            </div>
            {intakeForms.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Added Forms ({intakeForms.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {intakeForms.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-background text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{f.name}</p>
                        {f.fields && JSON.parse(f.fields).length > 0 && (
                          <p className="text-[10px] text-muted-foreground">{JSON.parse(f.fields).length} Questions</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600" onClick={() => editIntakeForm(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeIntakeForm(i)}>
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
            <div className="space-y-2 p-2 border rounded-lg bg-muted/30/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Item Name *</Label>
                <Input placeholder="Surgical Gloves" value={newItem.name} onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Quantity</Label>
                  <Input type="number" value={newItem.quantity} onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Threshold</Label>
                  <Input type="number" value={newItem.threshold} onChange={e => setNewItem(prev => ({ ...prev, threshold: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Unit</Label>
                  <Input placeholder="boxes" value={newItem.unit} onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button onClick={addInventoryItem} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newItem.name}>
                {editingIndex.type === "inventory" ? "Update Item" : "Add Item"}
              </Button>
            </div>
            {inventoryItems.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Added Items ({inventoryItems.length})</Label>
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                  {inventoryItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-background text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.quantity} {item.unit} (alert: {item.threshold})</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600" onClick={() => editInventoryItem(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeInventoryItem(i)}>
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
      case 7:
        return (
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              Invite staff members. This step is optional — you can add team members later.
            </div>
            <div className="space-y-2 p-2 border rounded-lg bg-muted/30/50">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Name *</Label>
                <Input placeholder="Jane Smith" value={newStaff.name} onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email *</Label>
                <Input type="email" placeholder="jane@clinic.com" value={newStaff.email} onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Password *</Label>
                <Input type="password" placeholder="Temporary password" value={newStaff.password} onChange={e => setNewStaff(prev => ({ ...prev, password: e.target.value }))} className="h-8 text-sm" />
              </div>
              <Button onClick={addStaffMember} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" disabled={!newStaff.name || !newStaff.email || !newStaff.password}>
                {editingIndex.type === "staff" ? "Update Staff" : "Add Staff"}
              </Button>
            </div>
            {staffMembers.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Staff Members</Label>
                <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                  {staffMembers.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-background text-xs animate-fade-in group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600" onClick={() => editStaffMember(i)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeStaffMember(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] h-5 px-1 ml-1">Added</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center">You can skip/add later.</p>
          </div>
        );
      case 8:
        return (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg text-xs text-green-800 border border-green-200">
              Your workspace is ready to go live! Review the checklist below.
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", workspace.name ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm">Workspace configured: <strong>{workspace.name || "Not set"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", emailConfig.emailConfigured ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm">Communication: <strong>{emailConfig.emailConfigured ? "Enabled" : "Not configured"}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">Contact form created</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", services.length > 0 ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm">Services: <strong>{services.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", intakeForms.length > 0 ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm">Intake forms: <strong>{intakeForms.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", inventoryItems.length > 0 ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm">Inventory items: <strong>{inventoryItems.length}</strong></span>
              </div>
              <div className="flex items-center gap-3 p-2.5 border rounded-md bg-background">
                <Check className={cn("w-4 h-4", staffMembers.length > 0 ? "text-green-600" : "text-muted-foreground")} />
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border/40 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center">
            <Logo variant="icon" size={28} />
          </div>
          <h1 className="text-base font-bold text-foreground">CareOps Setup</h1>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Step {currentStep}/8</Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-background border-b border-border/40 px-4 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto">
          <Progress value={(currentStep / 8) * 100} className="h-1.5" />
          <div className="flex justify-between mt-2 overflow-x-auto pb-1">
            {steps.map((step) => (
              <div key={step.id} className={cn("flex flex-col items-center min-w-[60px]", step.id === currentStep ? "text-blue-600" : step.id < currentStep ? "text-green-600" : "text-muted-foreground")}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium mb-0.5",
                  step.id === currentStep ? "bg-blue-100 text-blue-700" : step.id < currentStep ? "bg-green-100 text-green-700" : "bg-muted/30 text-muted-foreground"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
            <AIChatCard
              chatMessages={chatMessages}
              chatLoading={chatLoading}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={() => sendChatMessage()}
              voiceMode={voiceMode}
              setVoiceMode={setVoiceMode}
              onVoiceTranscript={handleVoiceTranscript}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
