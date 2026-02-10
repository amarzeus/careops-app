"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Shield, Mail, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";

interface StaffMember {
  id: string; name: string; email: string; role: string;
  canAccessInbox: boolean; canAccessBookings: boolean; canAccessForms: boolean; canAccessInventory: boolean; createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", canAccessInbox: true, canAccessBookings: true, canAccessForms: true, canAccessInventory: true });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try { const res = await fetch("/api/staff"); if (res.ok) setStaff((await res.json()).staff); } catch {} finally { setLoading(false); }
  };

  const inviteStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return;
    setCreating(true);
    try {
      await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStaff) });
      setDialogOpen(false); setNewStaff({ name: "", email: "", password: "", canAccessInbox: true, canAccessBookings: true, canAccessForms: true, canAccessInventory: true }); fetchStaff();
    } catch {} finally { setCreating(false); }
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
                {[
                  { key: "canAccessInbox", label: "Inbox" },
                  { key: "canAccessBookings", label: "Bookings" },
                  { key: "canAccessForms", label: "Forms" },
                  { key: "canAccessInventory", label: "Inventory" },
                ].map(perm => (
                  <div key={perm.key} className="flex items-center justify-between">
                    <Label>{perm.label}</Label>
                    <Switch checked={(newStaff as any)[perm.key]} onCheckedChange={v => setNewStaff(p => ({ ...p, [perm.key]: v }))} />
                  </div>
                ))}
              </div>
              <Button onClick={inviteStaff} className="w-full bg-blue-600 hover:bg-blue-700" disabled={creating}>{creating ? "Inviting..." : "Invite Staff"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-20"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">No staff members</h3><p className="text-sm text-gray-400 mt-1">Invite team members to help manage your business</p></div>
        ) : (
          <div className="space-y-3">
            {staff.map(member => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">{member.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>{member.role}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.canAccessInbox && <Badge variant="outline" className="text-xs">Inbox</Badge>}
                    {member.canAccessBookings && <Badge variant="outline" className="text-xs">Bookings</Badge>}
                    {member.canAccessForms && <Badge variant="outline" className="text-xs">Forms</Badge>}
                    {member.canAccessInventory && <Badge variant="outline" className="text-xs">Inventory</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
