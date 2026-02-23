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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Webhook {
  id: string;
  url: string;
  event: string;
  isActive: boolean;
  createdAt: string;
}

/**
 *
 */
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
    } catch (_error) {
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
    } catch (_error) {
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
          <Badge variant="secondary" className="bg-purple-100 text-[10px] text-purple-700">
            ADVANCED
          </Badge>
        </div>
        <CardDescription>
          Send real-time data to external services (Zapier, Slack, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50 p-4">
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="w-full space-y-1.5">
              <label className="text-xs font-medium text-purple-900">Endpoint URL</label>
              <Input
                placeholder="https://hooks.zapier.com/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-[200px]">
              <label className="text-xs font-medium text-purple-900">Event</label>
              <Select value={newEvent} onValueChange={setNewEvent}>
                <SelectTrigger className="bg-background">
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
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground py-4 text-center text-sm">Loading webhooks...</div>
        ) : (
          <div className="space-y-2">
            {webhooks.length === 0 && (
              <div className="text-muted-foreground rounded-lg border-2 border-dashed py-6 text-center text-sm">
                No webhooks configured. Add one above.
              </div>
            )}
            {webhooks.map((hook) => (
              <div
                key={hook.id}
                className="bg-background group flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-purple-200"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-100">
                    <WebhookIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate pr-4 text-sm font-medium">{hook.url}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {triggerOptions.find((o) => o.value === hook.event)?.label || hook.event}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(hook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground shrink-0 hover:text-red-600"
                  onClick={() => handleDeleteWebhook(hook.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
