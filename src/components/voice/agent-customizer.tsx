"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AgentTemplate {
  key: string;
  name: string;
  description: string;
  tools: string[];
}

interface Service {
  name: string;
  duration: number;
  price?: number;
}

interface AgentCustomizerProps {
  workspaceId: string;
  onAgentCreated: (agentId: string) => void;
  onCancel?: () => void;
}

/**
 *
 */
export function AgentCustomizer({ workspaceId, onAgentCreated, onCancel }: AgentCustomizerProps) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [services, setServices] = useState<Service[]>([{ name: "", duration: 30 }]);
  const [businessHours, setBusinessHours] = useState({
    open: "09:00",
    close: "18:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchWorkspaceInfo();
  }, [workspaceId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voice/agents/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0) {
        setSelectedTemplate(data.templates[0].key);
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load agent templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceInfo = async () => {
    try {
      const res = await fetch("/api/workspace");
      const data = await res.json();
      if (data.workspace?.name) {
        setBusinessName(data.workspace.name);
      }

      const servicesRes = await fetch("/api/services");
      const servicesData = await servicesRes.json();
      if (servicesData.services?.length > 0) {
        setServices(
          servicesData.services.map((s: { name: string; duration: number }) => ({
            name: s.name,
            duration: s.duration,
            price: undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch workspace info:", error);
    }
  };

  const addService = () => {
    setServices([...services, { name: "", duration: 30 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Please select a template", variant: "destructive" });
      return;
    }

    if (!businessName.trim()) {
      toast({ title: "Error", description: "Business name is required", variant: "destructive" });
      return;
    }

    const validServices = services.filter((s) => s.name.trim());
    if (validServices.length === 0) {
      toast({ title: "Error", description: "At least one service is required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/voice/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedTemplate,
          businessName,
          services: validServices,
          businessHours,
          additionalInstructions: additionalInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create agent");
      }

      toast({
        title: "Agent Created",
        description: "Your voice agent has been created successfully.",
      });

      onAgentCreated(data.agentId);
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Could not create agent",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedTemplateInfo = templates.find((t) => t.key === selectedTemplate);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Create Voice Agent
        </CardTitle>
        <CardDescription>
          Configure your AI voice agent to handle calls, book appointments, and answer questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Agent Type</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent type" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateInfo && (
            <p className="text-sm text-muted-foreground">{selectedTemplateInfo.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your Business Name"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Services</Label>
            <Button type="button" variant="outline" size="sm" onClick={addService}>
              <Plus className="w-4 h-4 mr-1" />
              Add Service
            </Button>
          </div>
          {services.map((service, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                placeholder="Service name"
                value={service.name}
                onChange={(e) => updateService(index, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Duration (min)"
                value={service.duration}
                onChange={(e) => updateService(index, "duration", parseInt(e.target.value) || 30)}
                className="w-28"
              />
              <Input
                type="number"
                placeholder="Price (₹)"
                value={service.price || ""}
                onChange={(e) => updateService(index, "price", parseInt(e.target.value) || 0)}
                className="w-28"
              />
              {services.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openTime">Opening Time</Label>
            <Input
              id="openTime"
              type="time"
              value={businessHours.open}
              onChange={(e) => setBusinessHours({ ...businessHours, open: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closeTime">Closing Time</Label>
            <Input
              id="closeTime"
              type="time"
              value={businessHours.close}
              onChange={(e) => setBusinessHours({ ...businessHours, close: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Operating Days</Label>
          <div className="flex flex-wrap gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <Badge
                key={day}
                variant={businessHours.days.includes(day) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const newDays = businessHours.days.includes(day)
                    ? businessHours.days.filter((d) => d !== day)
                    : [...businessHours.days, day];
                  setBusinessHours({ ...businessHours, days: newDays });
                }}
              >
                {day.slice(0, 3)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Any specific instructions for your voice agent..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleCreate} disabled={creating || loading}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Agent"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
