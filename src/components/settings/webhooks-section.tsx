"use client";

import { useEffect, useState } from "react";
import { Trash2, Webhook as WebhookIcon, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Webhook {
  id: string;
  url: string;
  event: string;
  isActive: boolean;
  createdAt: string;
}

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // New webhook state
  const [newUrl, setNewUrl] = useState("");
  const [newEvent, setNewEvent] = useState("BOOKING_CREATED");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error("Failed to load webhooks", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebhook = async () => {
    if (!newUrl) return;
    setAdding(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, event: newEvent }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setWebhooks((prev) => [data.webhook, ...prev]);
        setNewUrl("");
        toast({ title: "Success", description: "Webhook added" });
      } else {
        toast({ title: "Error", description: "Failed to add webhook", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        toast({ title: "Deleted", description: "Webhook removed" });
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const triggerOptions = [
    { value: "NEW_CONTACT", label: "New Contact" },
    { value: "BOOKING_CREATED", label: "Booking Created" },
    { value: "BEFORE_BOOKING", label: "Before Booking Reminder" },
    { value: "FORM_PENDING", label: "Form Pending Reminder" },
    { value: "INVENTORY_LOW", label: "Low Inventory" },
    { value: "STAFF_REPLY", label: "Staff Reply" },
  ];

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Webhooks</CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
            ADVANCED
          </Badge>
        </div>
        <CardDescription>
          Send real-time data to external services (Zapier, Slack, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full space-y-1.5">
              <label className="text-xs font-medium text-purple-900">Endpoint URL</label>
              <Input 
                placeholder="https://hooks.zapier.com/..." 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="w-full sm:w-[200px] space-y-1.5">
              <label className="text-xs font-medium text-purple-900">Event</label>
              <Select value={newEvent} onValueChange={setNewEvent}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddWebhook} 
              disabled={adding || !newUrl}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading webhooks...</div>
        ) : (
          <div className="space-y-2">
            {webhooks.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed rounded-lg text-gray-400 text-sm">
                No webhooks configured. Add one above.
              </div>
            )}
            {webhooks.map((hook) => (
              <div key={hook.id} className="flex items-center justify-between p-3 border rounded-lg bg-white group hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center shrink-0">
                    <WebhookIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate pr-4">{hook.url}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {triggerOptions.find(o => o.value === hook.event)?.label || hook.event}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {new Date(hook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-red-600 shrink-0"
                  onClick={() => handleDeleteWebhook(hook.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
