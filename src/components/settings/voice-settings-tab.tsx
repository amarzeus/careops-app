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
      const res = await fetch("/api/ai/voice/settings");
      if (res.ok) {
        const data = await res.json();
        setVoiceAgents(data.voiceAgents || []);
        setPhoneNumbers(data.phoneNumbers || []);
        if (data.vapiStatus) {
          setVapiStatus(data.vapiStatus);
        }
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
    </div>
  );
}
