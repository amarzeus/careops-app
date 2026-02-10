"use client";

import React, { useEffect, useState } from "react";
import { Zap, Plus, Trash2, Mail, MessageSquare, Calendar, FileText, Package, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";

const triggerConfig: Record<string, { label: string; icon: any; color: string }> = {
  NEW_CONTACT: { label: "New Contact", icon: UserPlus, color: "text-green-600" },
  BOOKING_CREATED: { label: "Booking Created", icon: Calendar, color: "text-blue-600" },
  BEFORE_BOOKING: { label: "Before Booking", icon: Calendar, color: "text-orange-600" },
  FORM_PENDING: { label: "Form Pending", icon: FileText, color: "text-purple-600" },
  INVENTORY_LOW: { label: "Inventory Low", icon: Package, color: "text-red-600" },
  STAFF_REPLY: { label: "Staff Reply", icon: MessageSquare, color: "text-gray-600" },
};

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", trigger: "", messageTemplate: "", delayMinutes: "0" });

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try { const res = await fetch("/api/automation"); if (res.ok) setRules((await res.json()).rules); } catch {} finally { setLoading(false); }
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.trigger) return;
    await fetch("/api/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newRule, delayMinutes: parseInt(newRule.delayMinutes) }) });
    setDialogOpen(false); setNewRule({ name: "", trigger: "", messageTemplate: "", delayMinutes: "0" }); fetchRules();
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    await fetch(`/api/automation/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/automation/${id}`, { method: "DELETE" }); fetchRules();
  };

  return (
    <div>
      <Header title="Automation" subtitle="Event-based rules that work for you">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Automation Rule</DialogTitle><DialogDescription>Set up event-based automated actions.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Rule Name *</Label><Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Welcome New Contact" /></div>
              <div className="space-y-2">
                <Label>Trigger Event *</Label>
                <Select value={newRule.trigger} onValueChange={v => setNewRule(p => ({ ...p, trigger: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Message Template</Label><Textarea value={newRule.messageTemplate} onChange={e => setNewRule(p => ({ ...p, messageTemplate: e.target.value }))} placeholder="Thank you for..." /></div>
              <div className="space-y-2"><Label>Delay (minutes)</Label><Input type="number" value={newRule.delayMinutes} onChange={e => setNewRule(p => ({ ...p, delayMinutes: e.target.value }))} /></div>
              <Button onClick={createRule} className="w-full bg-blue-600 hover:bg-blue-700">Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-20"><Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">No automation rules</h3><p className="text-sm text-gray-400 mt-1">Create rules to automate your workflows</p></div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => {
              const config = triggerConfig[rule.trigger] || triggerConfig.NEW_CONTACT;
              const Icon = config.icon;
              return (
                <Card key={rule.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Icon className={`w-5 h-5 ${config.color}`} /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.name}</p>
                        <Badge variant="outline">{config.label}</Badge>
                      </div>
                      {rule.messageTemplate && <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{rule.messageTemplate}</p>}
                      {rule.delayMinutes > 0 && <p className="text-xs text-gray-400">Delay: {rule.delayMinutes} min</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={rule.isActive} onCheckedChange={v => toggleRule(rule.id, v)} />
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteRule(rule.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
