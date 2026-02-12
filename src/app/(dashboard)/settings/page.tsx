
"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Link2, Copy, CheckCircle, ExternalLink, AlertTriangle, User, Shield, Lock, Trash2, Mail, MessageSquare, Bell, BellOff, Download, LogOut, Globe } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

/** Type for workspace settings */
interface WorkspaceSettings {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  emailConfigured: boolean;
  smsConfigured: boolean;
}

/** Type for user profile */
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

const workspaceStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ONBOARDING: { label: "Onboarding", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  INACTIVE: { label: "Inactive", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300" },
};

export default function SettingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
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

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  // Test connection states
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [exporting, setExporting] = useState(false);

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/settings/test-email", { method: "POST" });
      if (res.ok) {
        toast({ title: "Success", description: "Email connection test passed", variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: "Email Test Failed", description: data.error || "Could not connect to email service", variant: "destructive" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setTestingEmail(false); }
  };

  const testSmsConnection = async () => {
    setTestingSms(true);
    try {
      const res = await fetch("/api/settings/test-sms", { method: "POST" });
      if (res.ok) {
        toast({ title: "Success", description: "SMS connection test passed", variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: "SMS Test Failed", description: data.error || "Could not connect to SMS service", variant: "destructive" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setTestingSms(false); }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careops-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Data exported successfully", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setExporting(false); }
  };

  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all([fetchWorkspace(), fetchUser()]).finally(() => setLoading(false));
  }, []);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) setWorkspace((await res.json()).workspace);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load workspace";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) setUser((await res.json()).user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const saveWorkspace = async () => {
    setSavingWorkspace(true);
    try {
      const res = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workspace) });
      if (!res.ok) throw new Error("Failed to save workspace");
      toast({ title: "Success", description: "Workspace settings saved", variant: "success" });
      setSavedWorkspace(true); setTimeout(() => setSavedWorkspace(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setSavingWorkspace(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: user?.name, phone: user?.phone }) });
      if (!res.ok) throw new Error("Failed to save profile");
      toast({ title: "Success", description: "Profile saved", variant: "success" });
      setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setSavingProfile(false); }
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
  const contactFormUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/contact/${workspace?.id}`;

  const statusConfig = workspaceStatusConfig[workspace?.status || "ONBOARDING"] || workspaceStatusConfig.ONBOARDING;

  return (
    <div>
      <Header title="Settings" subtitle="Manage your workspace and account" />
      <div className="p-6 max-w-4xl">
        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Workspace</TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Integrations</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
          </TabsList>

          {/* WORKSPACE TAB */}
          <TabsContent value="workspace" className="space-y-6">
            {/* Workspace status badge */}
            <div className={`flex items-center gap-3 p-4 border rounded-lg ${statusConfig.bgColor}`}>
              <Globe className={`w-5 h-5 ${statusConfig.color}`} />
              <div>
                <p className={`text-sm font-medium ${statusConfig.color}`}>Workspace Status: {statusConfig.label}</p>
                <p className="text-xs text-gray-500">
                  {workspace?.status === "ONBOARDING" && "Complete your setup to activate your workspace"}
                  {workspace?.status === "ACTIVE" && "Your workspace is live and accepting customers"}
                  {workspace?.status === "INACTIVE" && "Your workspace is currently paused"}
                  {!workspace?.status && "Complete your setup to activate your workspace"}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Workspace Details</CardTitle><CardDescription>Manage your business information</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Business Name</Label><Input value={workspace?.name || ""} onChange={e => setWorkspace(p => p ? { ...p, name: e.target.value } : p)} /></div>
                    <div className="space-y-2"><Label>Timezone</Label><Input value={workspace?.timezone || ""} onChange={e => setWorkspace(p => p ? { ...p, timezone: e.target.value } : p)} /></div>
                  </div>
                <div className="space-y-2"><Label>Address</Label><Input value={workspace?.address || ""} onChange={e => setWorkspace(p => p ? { ...p, address: e.target.value } : p)} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Contact Email</Label><Input value={workspace?.contactEmail || ""} onChange={e => setWorkspace(p => p ? { ...p, contactEmail: e.target.value } : p)} /></div>
                    <div className="space-y-2"><Label>Contact Phone</Label><Input value={workspace?.contactPhone || ""} onChange={e => setWorkspace(p => p ? { ...p, contactPhone: e.target.value } : p)} /></div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t flex justify-between items-center px-6 py-4">
                <div className="text-xs text-gray-500">Public links will use this info</div>
                <Button onClick={saveWorkspace} disabled={savingWorkspace}>
                  {savedWorkspace ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : savingWorkspace ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
              </CardFooter>
            </Card>

            {/* Public Links */}
            <Card>
              <CardHeader><CardTitle>Public Links</CardTitle><CardDescription>Share these links with your customers</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Booking Page</p>
                    <code className="text-xs text-gray-500 truncate block">{bookingUrl}</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(bookingUrl, "booking")}>
                    {copied === "booking" ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Contact Form</p>
                    <code className="text-xs text-gray-500 truncate block">{contactFormUrl}</code>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(contactFormUrl, "contact")}>
                    {copied === "contact" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose how you want to be notified</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive updates about bookings, contacts, and forms via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">SMS Notifications</p>
                      <p className="text-xs text-gray-500">Receive urgent alerts via SMS</p>
                    </div>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card>
              <CardHeader><CardTitle>Data Export</CardTitle><CardDescription>Download a copy of your workspace data</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">Export All Data</p>
                      <p className="text-xs text-gray-500">Download contacts, bookings, forms, and inventory as CSV</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={exportData} disabled={exporting}>
                    <Download className="w-4 h-4 mr-2" />{exporting ? "Exporting..." : "Export"}
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
                <div className="space-y-2"><Label>Full Name</Label><Input value={user?.name || ""} onChange={e => setUser(p => p ? { ...p, name: e.target.value } : p)} /></div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-gray-50" />
                  <p className="text-[10px] text-gray-500">Email cannot be changed securely at this time.</p>
                </div>
                <div className="space-y-2"><Label>Phone Number</Label><Input value={user?.phone || ""} onChange={e => setUser(p => p ? { ...p, phone: e.target.value } : p)} /></div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t flex justify-end px-6 py-4">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savedProfile ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : savingProfile ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
                </Button>
              </CardFooter>
            </Card>

            {/* Session info */}
            <Card>
              <CardHeader><CardTitle>Current Session</CardTitle><CardDescription>Your active login session information</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">Active Session</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Role: {user?.role || "OWNER"}</p>
                      <p className="text-xs text-gray-400">Logged in now</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure your email service for sending notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email Service</p>
                      <p className="text-xs text-gray-500">{workspace?.emailConfigured ? "Connected" : "Not configured"}</p>
                    </div>
                  </div>
                  <Badge variant={workspace?.emailConfigured ? "default" : "secondary"} className={workspace?.emailConfigured ? "bg-green-600" : ""}>
                    {workspace?.emailConfigured ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={testEmailConnection} disabled={testingEmail}>
                  {testingEmail ? "Testing..." : "Test Email Connection"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>SMS Configuration (MSG91)</CardTitle>
                <CardDescription>Configure MSG91 for SMS OTP and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">MSG91 SMS</p>
                      <p className="text-xs text-gray-500">{workspace?.smsConfigured ? "Connected" : "Not configured"}</p>
                    </div>
                  </div>
                  <Badge variant={workspace?.smsConfigured ? "default" : "secondary"} className={workspace?.smsConfigured ? "bg-green-600" : ""}>
                    {workspace?.smsConfigured ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={testSmsConnection} disabled={testingSms}>
                  {testingSms ? "Testing..." : "Test SMS Connection"}
                </Button>
              </CardContent>
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

            {/* Danger Zone - enhanced */}
            <Card className="border-red-300 shadow-sm">
              <CardHeader className="bg-red-50 border-b border-red-200 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-red-500">These actions are irreversible. Please proceed with extreme caution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all associated data including contacts, bookings, forms, and automation rules. This cannot be undone.</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="shrink-0 ml-4"><Trash2 className="w-4 h-4 mr-2" />Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-red-700">
                          <p className="font-medium mb-1">The following data will be permanently deleted:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>All contacts and conversation history</li>
                            <li>All bookings and calendar data</li>
                            <li>All forms and submissions</li>
                            <li>All automation rules</li>
                            <li>All staff accounts under this workspace</li>
                          </ul>
                        </div>
                      </div>
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
