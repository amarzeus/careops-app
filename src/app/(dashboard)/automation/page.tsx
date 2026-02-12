"use client";

import React, { useEffect, useState } from "react";
import { Zap, Plus, Trash2, Mail, MessageSquare, Calendar, FileText, Package, UserPlus, ArrowRight, PlayCircle, Clock, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

/** Automation rule type matching Prisma schema */
interface AutomationRuleItem {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  messageTemplate: string | null;
  delayMinutes: number;
  createdAt: string;
}

const triggerConfig: Record<string, { label: string; icon: LucideIcon; color: string; bgColor: string }> = {
  NEW_CONTACT: { label: "New Contact", icon: UserPlus, color: "text-green-600", bgColor: "bg-green-50" },
  BOOKING_CREATED: { label: "Booking Created", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
  BEFORE_BOOKING: { label: "Before Booking", icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-50" },
  FORM_PENDING: { label: "Form Pending", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
  INVENTORY_LOW: { label: "Inventory Low", icon: Package, color: "text-red-600", bgColor: "bg-red-50" },
  STAFF_REPLY: { label: "Staff Reply", icon: MessageSquare, color: "text-gray-600", bgColor: "bg-gray-100" },
};

const triggerDescriptions: Record<string, string> = {
  NEW_CONTACT: "Fires when a new contact submits the contact form",
  BOOKING_CREATED: "Fires when a new booking is created",
  BEFORE_BOOKING: "Fires 24 hours before a scheduled booking",
  FORM_PENDING: "Fires when a form remains incomplete",
  INVENTORY_LOW: "Fires when an item drops below its threshold",
  STAFF_REPLY: "Fires when a staff member manually replies, pausing automation",
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", trigger: "", messageTemplate: "", delayMinutes: "0" });
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editDialogRule, setEditDialogRule] = useState<AutomationRuleItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", messageTemplate: "", delayMinutes: "0" });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/automation");
      if (res.ok) setRules((await res.json()).rules);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load rules";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.trigger) return;
    try {
      const res = await fetch("/api/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newRule, delayMinutes: parseInt(newRule.delayMinutes) }) });
      if (!res.ok) throw new Error("Failed to create rule");
      toast({ title: "Success", description: "Automation rule created", variant: "success" });
      setDialogOpen(false); setNewRule({ name: "", trigger: "", messageTemplate: "", delayMinutes: "0" }); fetchRules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    await fetch(`/api/automation/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/automation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      toast({ title: "Success", description: "Automation rule deleted", variant: "success" });
      fetchRules();
      setDeleteDialogId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete rule";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const testRule = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/automation/${id}/test`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Test failed");
      }
      toast({ title: "Success", description: "Rule tested successfully", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setTimeout(() => setTestingId(null), 2000);
    }
  };

  const openEditRule = (rule: AutomationRuleItem) => {
    setEditForm({
      name: rule.name,
      messageTemplate: rule.messageTemplate || "",
      delayMinutes: String(rule.delayMinutes),
    });
    setEditDialogRule(rule);
  };

  const saveEditRule = async () => {
    if (!editDialogRule || !editForm.name) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/automation/${editDialogRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          messageTemplate: editForm.messageTemplate,
          delayMinutes: parseInt(editForm.delayMinutes),
        }),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      toast({ title: "Success", description: "Rule updated", variant: "success" });
      setEditDialogRule(null);
      fetchRules();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setEditSaving(false); }
  };

  const activeCount = rules.filter(r => r.isActive).length;
  const inactiveCount = rules.length - activeCount;

  // Group rules by trigger type
  const groupedRules = rules.reduce<Record<string, AutomationRuleItem[]>>((acc, rule) => {
    const trigger = rule.trigger || "OTHER";
    if (!acc[trigger]) acc[trigger] = [];
    acc[trigger].push(rule);
    return acc;
  }, {});

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
                {newRule.trigger && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {triggerDescriptions[newRule.trigger]}
                  </p>
                )}
              </div>
              <div className="space-y-2"><Label>Message Template</Label><Textarea value={newRule.messageTemplate} onChange={e => setNewRule(p => ({ ...p, messageTemplate: e.target.value }))} placeholder="Thank you for..." /></div>
              <div className="space-y-2"><Label>Delay (minutes)</Label><Input type="number" value={newRule.delayMinutes} onChange={e => setNewRule(p => ({ ...p, delayMinutes: e.target.value }))} /></div>
              <Button onClick={createRule} className="w-full bg-blue-600 hover:bg-blue-700">Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>
      <div className="p-6">
        {/* Summary row */}
        {!loading && rules.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{rules.length} rule{rules.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-green-700">{activeCount} active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm font-medium text-gray-500">{inactiveCount} inactive</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-20"><Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">No automation rules</h3><p className="text-sm text-gray-400 mt-1">Create rules to automate your workflows</p></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([trigger, triggerRules]) => {
              const config = triggerConfig[trigger] || triggerConfig.NEW_CONTACT;
              const GroupIcon = config.icon;
              return (
                <div key={trigger}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <GroupIcon className={`w-4 h-4 ${config.color}`} />
                    <h3 className="text-sm font-semibold text-gray-600">{config.label}</h3>
                    <Badge variant="secondary" className="text-[10px]">{triggerRules.length}</Badge>
                    <p className="text-xs text-gray-400 ml-2">{triggerDescriptions[trigger]}</p>
                  </div>

                  <div className="space-y-3">
                    {triggerRules.map((rule) => {
                      const ruleConfig = triggerConfig[rule.trigger] || triggerConfig.NEW_CONTACT;
                      const Icon = ruleConfig.icon;
                      return (
                        <Card key={rule.id}>
                          <CardContent className="py-4">
                            {/* Flow card: trigger -> action */}
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 ${ruleConfig.bgColor} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${ruleConfig.color}`} />
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{rule.name}</p>
                                  <Badge variant={rule.isActive ? "default" : "secondary"} className={rule.isActive ? "bg-green-600" : ""}>
                                    {rule.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                {rule.messageTemplate && <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{rule.messageTemplate}</p>}
                                <div className="flex items-center gap-3 mt-1">
                                  {rule.delayMinutes > 0 && <span className="text-[10px] text-gray-400">Delay: {rule.delayMinutes} min</span>}
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    Last triggered: {getRelativeTime(rule.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => openEditRule(rule)}
                                >
                                  <Pencil className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => testRule(rule.id)}
                                  disabled={testingId === rule.id}
                                >
                                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                                  {testingId === rule.id ? "Tested" : "Test"}
                                </Button>
                                <Switch checked={rule.isActive} onCheckedChange={v => toggleRule(rule.id, v)} />

                                <Dialog open={deleteDialogId === rule.id} onOpenChange={open => setDeleteDialogId(open ? rule.id : null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Automation Rule</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete <span className="font-semibold">&quot;{rule.name}&quot;</span>? This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                      <p className="text-xs text-amber-700">Any pending automated messages for this rule will be cancelled.</p>
                                    </div>
                                    <DialogFooter className="gap-2">
                                      <Button variant="outline" onClick={() => setDeleteDialogId(null)}>Cancel</Button>
                                      <Button variant="destructive" onClick={() => deleteRule(rule.id)} disabled={deleting}>
                                        {deleting ? "Deleting..." : "Delete Rule"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Rule Dialog */}
      <Dialog open={!!editDialogRule} onOpenChange={open => { if (!open) setEditDialogRule(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Automation Rule</DialogTitle>
            <DialogDescription>Update the name, message template, and delay for this rule.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            {editDialogRule && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <span className="font-medium">Trigger:</span>
                <span>{triggerConfig[editDialogRule.trigger]?.label || editDialogRule.trigger}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea value={editForm.messageTemplate} onChange={e => setEditForm(p => ({ ...p, messageTemplate: e.target.value }))} placeholder="Thank you for..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Delay (minutes)</Label>
              <Input type="number" value={editForm.delayMinutes} onChange={e => setEditForm(p => ({ ...p, delayMinutes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEditRule} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditDialogRule(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
