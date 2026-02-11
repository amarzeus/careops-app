
"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Link2, Copy, CheckCircle, ExternalLink, AlertTriangle, User, Shield, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Workspace State
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savedWorkspace, setSavedWorkspace] = useState(false);

  // Profile State
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // Delete Account State
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all([fetchWorkspace(), fetchUser()]).finally(() => setLoading(false));
  }, []);

  const fetchWorkspace = async () => {
    try { const res = await fetch("/api/workspace"); if (res.ok) setWorkspace((await res.json()).workspace); } catch { }
  };

  const fetchUser = async () => {
    try { const res = await fetch("/api/user"); if (res.ok) setUser((await res.json()).user); } catch { }
  };

  const saveWorkspace = async () => {
    setSavingWorkspace(true);
    try {
      await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workspace) });
      setSavedWorkspace(true); setTimeout(() => setSavedWorkspace(false), 2000);
    } catch { } finally { setSavingWorkspace(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: user.name, phone: user.phone }) });
      setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2000);
    } catch { } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    setChangingPassword(true);
    setPasswordMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "An error occurred" });
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}</div></div>;

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${workspace?.id}`;

  return (
    <div>
      <Header title="Settings" subtitle="Manage your workspace and account" />
      <div className="p-6 max-w-4xl">
        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Workspace</TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
          </TabsList>

          {/* WORKSPACE TAB */}
          <TabsContent value="workspace" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Workspace Details</CardTitle><CardDescription>Manage your business information</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Business Name</Label><Input value={workspace?.name || ""} onChange={e => setWorkspace((p: any) => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Timezone</Label><Input value={workspace?.timezone || ""} onChange={e => setWorkspace((p: any) => ({ ...p, timezone: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input value={workspace?.address || ""} onChange={e => setWorkspace((p: any) => ({ ...p, address: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Contact Email</Label><Input value={workspace?.contactEmail || ""} onChange={e => setWorkspace((p: any) => ({ ...p, contactEmail: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Contact Phone</Label><Input value={workspace?.contactPhone || ""} onChange={e => setWorkspace((p: any) => ({ ...p, contactPhone: e.target.value }))} /></div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t flex justify-between items-center px-6 py-4">
                <div className="text-xs text-gray-500">Public links will use this info</div>
                <Button onClick={saveWorkspace} disabled={savingWorkspace}>
                  {savedWorkspace ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : savingWorkspace ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader><CardTitle>Public Links</CardTitle><CardDescription>Share these links with your customers</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <code className="text-xs flex-1 truncate">{bookingUrl}</code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(bookingUrl, "booking")}>
                    {copied === "booking" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update your personal details</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={user?.name || ""} onChange={e => setUser((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-gray-50" />
                  <p className="text-[10px] text-gray-500">Email cannot be changed securely at this time.</p>
                </div>
                <div className="space-y-2"><Label>Phone Number</Label><Input value={user?.phone || ""} onChange={e => setUser((p: any) => ({ ...p, phone: e.target.value }))} /></div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t flex justify-end px-6 py-4">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savedProfile ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : savingProfile ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                {passwordMessage.text && (
                  <div className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {passwordMessage.text}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 border-t flex justify-end px-6 py-4">
                <Button onClick={changePassword} disabled={changingPassword || !currentPassword || !newPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle><CardDescription>Irreversible actions</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all data.</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Label>Type <span className="font-bold">DELETE</span> to confirm</Label>
                        <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" />
                      </div>
                      <DialogFooter>
                        <Button variant="destructive" onClick={deleteAccount} disabled={deleteConfirmation !== "DELETE" || isDeleting}>
                          {isDeleting ? "Deleting..." : "Confirm Deletion"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
