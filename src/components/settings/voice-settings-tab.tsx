"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles, Brain, MessageSquare, Mic, AlertTriangle, Package, Settings,
  Loader2, Check, Zap, Phone, Plus, Trash2, Edit2, Play, Pause, Copy,
  ExternalLink, PhoneCall, Volume2, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VOICE_TOOLS } from "@/lib/vapi";

interface AIPreferences {
  id: string;
  workspaceId: string;
  smartReplyEnabled: boolean;
  insightsEnabled: boolean;
  voiceEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  inventoryForecastEnabled: boolean;
  autoClassifyEnabled: boolean;
  defaultReplyTone: string;
  alertOnAnomaly: boolean;
  dailyInsightTime: string | null;
  geminiModel: string;
}

interface VoiceAgent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  greeting: string | null;
  prompt: string | null;
  canBook: boolean;
  canCheckStatus: boolean;
  canTransfer: boolean;
  canHandleInquiry: boolean;
  tools: string | null;
  phoneNumbers: PhoneNumber[];
  createdAt: string;
}

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  label: string | null;
  isActive: boolean;
  voiceAgentId: string | null;
  voiceAgent: VoiceAgent | null;
  forwardToStaff: boolean;
  forwardNumber: string | null;
}

interface DoNotCallEntry {
  id: string;
  phoneNumber: string;
  source: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EscalationCall {
  id: string;
  callSid: string | null;
  status: string;
  escalated: boolean;
  escalationReason: string | null;
  summary: string | null;
  transcript: string | null;
  createdAt: string;
  contact: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

interface EscalationCallDetail extends EscalationCall {
  outcome: string | null;
  duration: number | null;
  metadata: string | null;
  consent: {
    id: string;
    consentResponse: boolean;
    consentText: string;
    capturedAt: string;
  } | null;
}

/**
 *
 */
export function VoiceSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [vapiStatus, setVapiStatus] = useState<{ configured: boolean; apiKeyPresent: boolean }>({
    configured: false,
    apiKeyPresent: false,
  });
  const [dncEntries, setDncEntries] = useState<DoNotCallEntry[]>([]);
  const [escalationCalls, setEscalationCalls] = useState<EscalationCall[]>([]);
  const [savingDnc, setSavingDnc] = useState(false);
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [selectedEscalationDetail, setSelectedEscalationDetail] = useState<EscalationCallDetail | null>(null);
  const [loadingEscalationDetail, setLoadingEscalationDetail] = useState(false);
  const [newDncPhone, setNewDncPhone] = useState("");
  const [newDncSource, setNewDncSource] = useState("customer_request");
  const [newDncReason, setNewDncReason] = useState("");

  // Agent form state
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    greeting: "Hello! Thanks for calling. How can I help you today?",
    prompt: "",
    canBook: true,
    canCheckStatus: true,
    canTransfer: true,
    canHandleInquiry: true,
  });

  useEffect(() => {
    fetchVoiceData();
  }, []);

  const fetchVoiceData = async () => {
    try {
      const [settingsRes, dncRes, escalationsRes] = await Promise.all([
        fetch("/api/ai/voice/settings"),
        fetch("/api/voice/dnc"),
        fetch("/api/voice/calls?escalated=true&limit=20"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setVoiceAgents(data.voiceAgents || []);
        setPhoneNumbers(data.phoneNumbers || []);
        if (data.vapiStatus) {
          setVapiStatus(data.vapiStatus);
        }
      }

      if (dncRes.ok) {
        const dncData = await dncRes.json();
        setDncEntries(dncData.entries || []);
      }

      if (escalationsRes.ok) {
        const escalationsData = await escalationsRes.json();
        setEscalationCalls(escalationsData.calls || []);
      }
    } catch (error) {
      console.error("Failed to fetch voice data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/voice/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingAgent ? "updateAgent" : "createAgent",
          data: {
            ...agentForm,
            id: editingAgent?.id,
            tools: VOICE_TOOLS.filter((_, i) => {
              if (i === 0) return agentForm.canCheckStatus;
              if (i === 1) return agentForm.canBook;
              if (i === 2) return agentForm.canCheckStatus;
              if (i === 3) return agentForm.canTransfer;
              return true;
            }).map(t => t.name),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save agent");

      toast({ title: "Success", description: `Voice agent ${editingAgent ? "updated" : "created"}` });
      setShowAgentForm(false);
      setEditingAgent(null);
      setAgentForm({
        name: "",
        description: "",
        greeting: "Hello! Thanks for calling. How can I help you today?",
        prompt: "",
        canBook: true,
        canCheckStatus: true,
        canTransfer: true,
        canHandleInquiry: true,
      });
      fetchVoiceData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save agent", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voice agent?")) return;
    try {
      await fetch("/api/ai/voice/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAgent", data: { id } }),
      });
      toast({ title: "Deleted", description: "Voice agent deleted" });
      fetchVoiceData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete agent", variant: "destructive" });
    }
  };

  const handleToggleAgent = async (agent: VoiceAgent) => {
    try {
      await fetch("/api/ai/voice/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAgent",
          data: { ...agent, isActive: !agent.isActive },
        }),
      });
      fetchVoiceData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update agent", variant: "destructive" });
    }
  };

  const editAgent = (agent: VoiceAgent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description || "",
      greeting: agent.greeting || "",
      prompt: agent.prompt || "",
      canBook: agent.canBook,
      canCheckStatus: agent.canCheckStatus,
      canTransfer: agent.canTransfer,
      canHandleInquiry: agent.canHandleInquiry,
    });
    setShowAgentForm(true);
  };

  const handleAddDnc = async () => {
    if (!newDncPhone.trim()) {
      toast({ title: "Phone required", description: "Enter a phone number to block", variant: "destructive" });
      return;
    }

    setSavingDnc(true);
    try {
      const res = await fetch("/api/voice/dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: newDncPhone,
          source: newDncSource,
          reason: newDncReason || null,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add DNC entry");
      }

      toast({ title: "Saved", description: "Number added to Do Not Call registry" });
      setNewDncPhone("");
      setNewDncReason("");
      await fetchVoiceData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add DNC entry",
        variant: "destructive",
      });
    } finally {
      setSavingDnc(false);
    }
  };

  const handleToggleDnc = async (entry: DoNotCallEntry) => {
    setSavingDnc(true);
    try {
      const res = await fetch("/api/voice/dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: entry.phoneNumber,
          source: entry.source,
          reason: entry.reason,
          isActive: !entry.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update DNC entry");
      }

      toast({
        title: entry.isActive ? "Unblocked" : "Blocked",
        description: entry.isActive
          ? "Number removed from active DNC block"
          : "Number re-added to active DNC block",
      });
      await fetchVoiceData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update DNC entry",
        variant: "destructive",
      });
    } finally {
      setSavingDnc(false);
    }
  };

  const handleResolveEscalation = async (callId: string) => {
    setResolvingCallId(callId);
    try {
      const res = await fetch(`/api/voice/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve-escalation",
          note: "Escalation reviewed by workspace owner",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve escalation");
      }

      toast({ title: "Escalation resolved", description: "Call marked as reviewed" });
      await fetchVoiceData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve escalation",
        variant: "destructive",
      });
    } finally {
      setResolvingCallId(null);
    }
  };

  const openEscalationDetails = async (callId: string) => {
    setSelectedEscalationId(callId);
    setLoadingEscalationDetail(true);
    try {
      const res = await fetch(`/api/voice/calls/${callId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load call details");
      }

      const data = (await res.json()) as EscalationCallDetail;
      setSelectedEscalationDetail(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load call details",
        variant: "destructive",
      });
      setSelectedEscalationId(null);
      setSelectedEscalationDetail(null);
    } finally {
      setLoadingEscalationDetail(false);
    }
  };

  const closeEscalationDetails = () => {
    setSelectedEscalationId(null);
    setSelectedEscalationDetail(null);
    setLoadingEscalationDetail(false);
  };

  const parseCallMetadata = (raw: string | null): Record<string, unknown> => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mic className="w-5 h-5 text-emerald-600" />
          Voice AI Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure your AI voice assistant for handling phone calls
        </p>
      </div>

      {!vapiStatus.apiKeyPresent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">VAPI API Key Not Configured</p>
              <p className="text-sm text-amber-700 mt-1">
                To enable voice AI, add VAPI_API_KEY to your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              vapiStatus.configured ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
            )}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">VAPI Status</p>
              <p className="text-xs text-gray-500">
                {vapiStatus.configured ? "Connected" : "Not configured"}
              </p>
            </div>
            {vapiStatus.configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-300 ml-auto" />
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Voice Agents</p>
              <p className="text-xs text-gray-500">{voiceAgents.length} configured</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-white">
              {voiceAgents.filter(a => a.isActive).length} active
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Phone Numbers</p>
              <p className="text-xs text-gray-500">{phoneNumbers.length} numbers</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-white">
              {phoneNumbers.filter(p => p.isActive).length} active
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Voice Agents</h3>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            setEditingAgent(null);
            setShowAgentForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Agent
        </Button>
      </div>

      {showAgentForm && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingAgent ? "Edit Voice Agent" : "Create Voice Agent"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Agent Name</Label>
                <Input
                  value={agentForm.name}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Receptionist"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Input
                  value={agentForm.description}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Main booking assistant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Greeting Message</Label>
              <Textarea
                value={agentForm.greeting}
                onChange={(e) => setAgentForm(prev => ({ ...prev, greeting: e.target.value }))}
                placeholder="Hello! Thanks for calling..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">System Prompt (Optional)</Label>
              <Textarea
                value={agentForm.prompt}
                onChange={(e) => setAgentForm(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="You are a professional receptionist for..."
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Customize how the AI behaves during calls. Leave empty for default behavior.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Capabilities</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agentForm.canBook}
                    onCheckedChange={(checked) => setAgentForm(prev => ({ ...prev, canBook: checked }))}
                  />
                  <Label className="text-sm cursor-pointer">Can Create Bookings</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agentForm.canCheckStatus}
                    onCheckedChange={(checked) => setAgentForm(prev => ({ ...prev, canCheckStatus: checked }))}
                  />
                  <Label className="text-sm cursor-pointer">Can Check Status</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agentForm.canTransfer}
                    onCheckedChange={(checked) => setAgentForm(prev => ({ ...prev, canTransfer: checked }))}
                  />
                  <Label className="text-sm cursor-pointer">Can Transfer Calls</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agentForm.canHandleInquiry}
                    onCheckedChange={(checked) => setAgentForm(prev => ({ ...prev, canHandleInquiry: checked }))}
                  />
                  <Label className="text-sm cursor-pointer">Handle Inquiries</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveAgent} disabled={saving || !agentForm.name} className="bg-emerald-600 hover:bg-emerald-700">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAgent ? "Update Agent" : "Create Agent"}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAgentForm(false);
                setEditingAgent(null);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {voiceAgents.length === 0 && !showAgentForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Mic className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No voice agents configured</p>
            <p className="text-gray-400 text-xs mt-1">
              Create a voice agent to handle incoming calls
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {voiceAgents.map((agent) => (
          <Card key={agent.id} className={cn(!agent.isActive && "opacity-60")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleAgent(agent)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      agent.isActive
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    )}
                  >
                    {agent.isActive ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {agent.phoneNumbers?.length || 0} numbers
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editAgent(agent)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteAgent(agent.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {agent.greeting && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Greeting:</p>
                  <p className="text-sm text-gray-700 mt-1">&quot;{agent.greeting}&quot;</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Voice Escalation Inbox
          </CardTitle>
          <CardDescription>
            Calls flagged for frustration/escalation. Resolve once reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {escalationCalls.length === 0 ? (
            <p className="text-sm text-gray-500">No escalated calls right now.</p>
          ) : (
            escalationCalls.map((call) => (
              <div
                key={call.id}
                className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/40 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {call.contact?.name || "Unknown Caller"}
                    {call.contact?.phone ? ` (${call.contact.phone})` : ""}
                  </p>
                  <p className="text-xs text-gray-600">
                    {call.escalationReason || "Escalation flagged"} · {new Date(call.createdAt).toLocaleString()}
                  </p>
                  {call.summary && <p className="text-xs text-gray-700">Summary: {call.summary}</p>}
                  {!call.summary && call.transcript && (
                    <p className="text-xs text-gray-700">
                      Transcript: {call.transcript.slice(0, 180)}{call.transcript.length > 180 ? "..." : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEscalationDetails(call.id)}
                    disabled={loadingEscalationDetail && selectedEscalationId === call.id}
                  >
                    {loadingEscalationDetail && selectedEscalationId === call.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    Details
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={resolvingCallId === call.id}
                    onClick={() => handleResolveEscalation(call.id)}
                  >
                    {resolvingCallId === call.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Mark Reviewed
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEscalationId} onOpenChange={(open) => !open && closeEscalationDetails()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Escalated Call Details</DialogTitle>
            <DialogDescription>
              {selectedEscalationDetail
                ? `${selectedEscalationDetail.contact?.name || "Unknown caller"} · ${new Date(selectedEscalationDetail.createdAt).toLocaleString()}`
                : "Review transcript, consent, and retry metadata"}
            </DialogDescription>
          </DialogHeader>

          {loadingEscalationDetail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          ) : selectedEscalationDetail ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Status:</span> {selectedEscalationDetail.status}</p>
                  <p><span className="text-gray-500">Outcome:</span> {selectedEscalationDetail.outcome || "-"}</p>
                  <p>
                    <span className="text-gray-500">Duration:</span>{" "}
                    {selectedEscalationDetail.duration != null
                      ? `${Math.floor(selectedEscalationDetail.duration / 60)}:${String(selectedEscalationDetail.duration % 60).padStart(2, "0")}`
                      : "-"}
                  </p>
                  <p><span className="text-gray-500">Escalation reason:</span> {selectedEscalationDetail.escalationReason || "Flagged"}</p>
                  {selectedEscalationDetail.summary ? (
                    <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-700">{selectedEscalationDetail.summary}</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selectedEscalationDetail.consent ? (
                    <>
                      <p>
                        <span className="text-gray-500">Consent:</span>{" "}
                        {selectedEscalationDetail.consent.consentResponse ? "Granted" : "Denied"}
                      </p>
                      <p><span className="text-gray-500">Prompt:</span> {selectedEscalationDetail.consent.consentText}</p>
                      <p className="text-xs text-gray-500">
                        Captured at {new Date(selectedEscalationDetail.consent.capturedAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No consent record attached.</p>
                  )}

                  {(() => {
                    const metadata = parseCallMetadata(selectedEscalationDetail.metadata);
                    const retryCount = metadata.retryCount as number | undefined;
                    const nextRetryAt = metadata.nextRetryAt as string | undefined;
                    const smsFallbackRequired = metadata.smsFallbackRequired as boolean | undefined;

                    return (
                      <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                        <p>Retry count: {typeof retryCount === "number" ? retryCount : 0}</p>
                        <p>Next retry: {nextRetryAt ? new Date(nextRetryAt).toLocaleString() : "-"}</p>
                        <p>SMS fallback required: {smsFallbackRequired ? "Yes" : "No"}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-auto rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedEscalationDetail.transcript || "No transcript available."}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No escalation details available.</p>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Do Not Call Registry</CardTitle>
          <CardDescription>
            Outbound calls to active DNC numbers are blocked automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              className="sm:col-span-2"
              placeholder="+1 555 123 4567"
              value={newDncPhone}
              onChange={(e) => setNewDncPhone(e.target.value)}
            />
            <Select value={newDncSource} onValueChange={setNewDncSource}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddDnc}
              disabled={savingDnc || !newDncPhone.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {savingDnc ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          <Textarea
            value={newDncReason}
            onChange={(e) => setNewDncReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
          />

          {dncEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No DNC entries yet.</p>
          ) : (
            <div className="space-y-2">
              {dncEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{entry.phoneNumber}</p>
                    <p className="text-xs text-gray-500">
                      {entry.source} · {entry.reason || "No reason"} · {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-white",
                        entry.isActive ? "text-red-700 border-red-200" : "text-gray-500 border-gray-200"
                      )}
                    >
                      {entry.isActive ? "Blocked" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingDnc}
                      onClick={() => handleToggleDnc(entry)}
                    >
                      {entry.isActive ? "Unblock" : "Re-block"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
