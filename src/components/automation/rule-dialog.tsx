"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AutomationRuleDTO } from "@/types/dto";

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AutomationRuleDTO | null;
  onSave: (data: Partial<AutomationRuleDTO>) => Promise<void>;
}

const triggerConfig: Record<string, { label: string }> = {
  NEW_CONTACT: { label: "New Contact" },
  BOOKING_CREATED: { label: "Booking Created" },
  BEFORE_BOOKING: { label: "Before Booking" },
  FORM_PENDING: { label: "Form Pending" },
  INVENTORY_LOW: { label: "Inventory Low" },
  STAFF_REPLY: { label: "Staff Reply" },
};

const triggerDescriptions: Record<string, string> = {
  NEW_CONTACT: "Fires when a new contact submits the contact form",
  BOOKING_CREATED: "Fires when a new booking is created",
  BEFORE_BOOKING: "Fires 24 hours before a scheduled booking",
  FORM_PENDING: "Fires when a form remains incomplete",
  INVENTORY_LOW: "Fires when an item drops below its threshold",
  STAFF_REPLY: "Fires when a staff member manually replies, pausing automation",
};

/**
 *
 * @param root0
 * @param root0.open
 * @param root0.onOpenChange
 * @param root0.rule
 * @param root0.onSave
 */
export function RuleDialog({ open, onOpenChange, rule, onSave }: RuleDialogProps) {
  const [form, setForm] = useState({
    name: "",
    trigger: "",
    messageTemplate: "",
    delayMinutes: "0",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name,
        trigger: rule.trigger,
        messageTemplate: rule.messageTemplate || "",
        delayMinutes: String(rule.delayMinutes),
      });
    } else {
      setForm({
        name: "",
        trigger: "",
        messageTemplate: "",
        delayMinutes: "0",
      });
    }
  }, [rule, open]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        delayMinutes: parseInt(form.delayMinutes),
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Automation Rule" : "Create Automation Rule"}</DialogTitle>
          <DialogDescription>Set up event-based automated actions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Welcome New Contact"
            />
          </div>
          <div className="space-y-2">
            <Label>Trigger Event *</Label>
            {rule ? (
              <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 rounded border p-2 text-sm font-medium">
                {triggerConfig[rule.trigger]?.label || rule.trigger}
              </div>
            ) : (
              <Select
                value={form.trigger}
                onValueChange={(v) => setForm((p) => ({ ...p, trigger: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.trigger && (
              <p className="text-muted-foreground bg-muted/30 rounded p-2 text-xs">
                {triggerDescriptions[form.trigger]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Textarea
              value={form.messageTemplate}
              onChange={(e) => setForm((p) => ({ ...p, messageTemplate: e.target.value }))}
              placeholder="Thank you for..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Delay (minutes)</Label>
            <Input
              type="number"
              value={form.delayMinutes}
              onChange={(e) => setForm((p) => ({ ...p, delayMinutes: e.target.value }))}
            />
          </div>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 w-full"
            disabled={saving}
          >
            {saving ? "Saving..." : rule ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
