"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Shield, Mail, UserCheck, ChevronDown, ChevronUp, Trash2, KeyRound, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";

interface StaffMember {
  id: string; name: string; email: string; role: string;
  canAccessInbox: boolean; canAccessBookings: boolean; canAccessForms: boolean; canAccessInventory: boolean; createdAt: string;
}

const permissionsList = [
  { key: "canAccessInbox", label: "Inbox", description: "View and respond to messages" },
  { key: "canAccessBookings", label: "Bookings", description: "Manage appointments and bookings" },
  { key: "canAccessForms", label: "Forms", description: "Access and manage patient forms" },
  { key: "canAccessInventory", label: "Inventory", description: "Track and manage inventory items" },
];

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

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", canAccessInbox: true, canAccessBookings: true, canAccessForms: true, canAccessInventory: true });
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removeDialogId, setRemoveDialogId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) setStaff((await res.json()).staff);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const inviteStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return;
    setCreating(true);
    try {
      const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStaff) });
      if (!res.ok) throw new Error("Failed to invite staff");
      toast({ title: "Success", description: "Staff member invited", variant: "success" });
      setDialogOpen(false); setNewStaff({ name: "", email: "", password: "", canAccessInbox: true, canAccessBookings: true, canAccessForms: true, canAccessInventory: true }); fetchStaff();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const updatePermissions = async (id: string, permissions: Record<string, boolean>) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      });
      if (!res.ok) throw new Error("Failed to update permissions");
      toast({ title: "Success", description: "Permissions updated", variant: "success" });
      fetchStaff();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const removeStaff = async (id: string) => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove staff");
      toast({ title: "Success", description: "Staff member removed", variant: "success" });
      fetchStaff();
      setRemoveDialogId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setRemoving(false); }
  };

  const sendPasswordReset = async (id: string) => {
    setResettingId(id);
    try {
      const res = await fetch(`/api/staff/${id}/reset-password`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send reset");
      toast({ title: "Success", description: "Password reset email sent", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setTimeout(() => setResettingId(null), 2000);
    }
  };

  return (
    <div>
      <Header title="Staff" subtitle="Manage your team members and permissions">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Staff Member</DialogTitle><DialogDescription>Add a team member with specific permissions.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} placeholder="jane@clinic.com" /></div>
              <div className="space-y-2"><Label>Password *</Label><Input type="password" value={newStaff.password} onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))} placeholder="Temporary password" /></div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Permissions</p>
                {permissionsList.map(perm => (
                  <div key={perm.key} className="flex items-center justify-between">
                    <Label>{perm.label}</Label>
                    <Switch checked={(newStaff as unknown as Record<string, boolean>)[perm.key]} onCheckedChange={v => setNewStaff(p => ({ ...p, [perm.key]: v }))} />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Send className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">An email will be sent to the staff member with their login credentials and a link to access the workspace.</p>
              </div>
              <Button onClick={inviteStaff} className="w-full bg-blue-600 hover:bg-blue-700" disabled={creating}>{creating ? "Inviting..." : "Invite Staff"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>
      <div className="p-6">
        {/* Summary stat */}
        {!loading && staff.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{staff.length} staff member{staff.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-20"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">No staff members</h3><p className="text-sm text-gray-400 mt-1">Invite team members to help manage your business</p></div>
        ) : (
          <div className="space-y-3">
            {staff.map(member => {
              const isExpanded = expandedId === member.id;
              const isOwner = member.role === "OWNER";
              return (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">{member.name.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge
                            variant={isOwner ? "default" : "secondary"}
                            className={isOwner ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 text-gray-700"}
                          >
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{member.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400">Last activity: {getRelativeTime(member.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.canAccessInbox && <Badge variant="outline" className="text-xs">Inbox</Badge>}
                        {member.canAccessBookings && <Badge variant="outline" className="text-xs">Bookings</Badge>}
                        {member.canAccessForms && <Badge variant="outline" className="text-xs">Forms</Badge>}
                        {member.canAccessInventory && <Badge variant="outline" className="text-xs">Inventory</Badge>}
                      </div>
                      {!isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : member.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>

                    {/* Expanded permission toggles */}
                    {isExpanded && !isOwner && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-3">Edit Permissions</p>
                          <div className="grid grid-cols-2 gap-3">
                            {permissionsList.map(perm => (
                              <div key={perm.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-sm">{perm.label}</Label>
                                  <p className="text-[10px] text-gray-400">{perm.description}</p>
                                </div>
                                <Switch
                                  checked={(member as unknown as Record<string, boolean>)[perm.key]}
                                  onCheckedChange={v => updatePermissions(member.id, { [perm.key]: v })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => sendPasswordReset(member.id)}
                            disabled={resettingId === member.id}
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                            {resettingId === member.id ? "Reset Sent" : "Send Password Reset"}
                          </Button>

                          <Dialog open={removeDialogId === member.id} onOpenChange={open => setRemoveDialogId(open ? member.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 ml-auto">
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Remove Staff
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove Staff Member</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove <span className="font-semibold">{member.name}</span> ({member.email})? They will lose access to this workspace immediately.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setRemoveDialogId(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => removeStaff(member.id)} disabled={removing}>
                                  {removing ? "Removing..." : "Remove"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
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
