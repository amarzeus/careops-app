"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VoiceAgent {
  id: string;
  name: string;
  vapiAssistantId: string | null;
  isActive: boolean;
}

interface OutboundCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    email?: string | null;
  } | null;
  workspaceId?: string;
}

/**
 *
 */
export function OutboundCallDialog({ open, onOpenChange, contact }: OutboundCallDialogProps) {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      fetchAgents();
      setCallResult(null);
      setPurpose("");
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch("/api/voice/agents?active=true");
      if (res.ok) {
        const data = await res.json();
        const agentList = Array.isArray(data) ? data : data.agents || [];
        setAgents(agentList.filter((a: VoiceAgent) => a.isActive && a.vapiAssistantId));
        if (agentList.length > 0) {
          setSelectedAgent(agentList[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleCall = async () => {
    if (!contact?.phone) {
      toast({
        title: "No Phone Number",
        description: "This contact doesn't have a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAgent && agents.length > 0) {
      toast({
        title: "Select Agent",
        description: "Please select a voice agent to make the call",
        variant: "destructive",
      });
      return;
    }

    setCalling(true);
    setCallResult(null);

    try {
      const res = await fetch("/api/voice/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: contact.phone,
          contactId: contact.id,
          agentId: selectedAgent || undefined,
          purpose: purpose || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate call");
      }

      setCallResult({
        success: true,
        message: `Call initiated to ${contact.phone}. The AI agent will call the contact shortly.`,
      });

      toast({
        title: "Call Initiated",
        description: "The voice agent is calling the contact",
      });
    } catch (error) {
      setCallResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to make call",
      });
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Could not initiate call",
        variant: "destructive",
      });
    } finally {
      setCalling(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Contact
          </DialogTitle>
          <DialogDescription>Make an AI-powered voice call to {contact.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-muted-foreground text-sm">
                  {contact.phone || "No phone number"}
                </p>
              </div>
              {contact.phone && <span className="font-mono text-sm">{contact.phone}</span>}
            </div>
          </div>

          {!contact.phone && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    No Phone Number
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This contact doesn&apos;t have a phone number saved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {contact.phone && agents.length === 0 && !loadingAgents && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    No Voice Agents
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Create a voice agent first to make outbound calls.
                  </p>
                </div>
              </div>
            </div>
          )}

          {callResult && (
            <div
              className={`rounded-lg border p-4 ${
                callResult.success
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              }`}
            >
              <div className="flex items-start gap-2">
                {callResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      callResult.success
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {callResult.success ? "Call Started" : "Call Failed"}
                  </p>
                  <p
                    className={`text-sm ${
                      callResult.success
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {callResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {contact.phone && agents.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent">Voice Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (Optional)</Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="E.g., Appointment reminder, Follow-up call..."
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              {callResult?.success ? "Close" : "Cancel"}
            </Button>
            {contact.phone && agents.length > 0 && !callResult?.success && (
              <Button onClick={handleCall} disabled={calling || !selectedAgent}>
                {calling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Make Call
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
