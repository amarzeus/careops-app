"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Link2, Settings, Shield, User, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspaceTab } from "@/components/settings/workspace-tab";
import { ProfileTab } from "@/components/settings/profile-tab";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { AIPreferencesTab } from "@/components/settings/ai-preferences-tab";
import { VoiceSettingsTab } from "@/components/settings/voice-settings-tab";
import { WorkspaceSettingsDTO, UserProfileDTO } from "@/types/dto";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<WorkspaceSettingsDTO | null>(null);
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

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

  // Test connection states
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  // Google Calendar states
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);

  const [copied, setCopied] = useState("");
  const defaultTab = searchParams.get("tab") || "workspace";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    Promise.all([fetchWorkspace(), fetchUser()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Handle Google Calendar OAuth callback results
  useEffect(() => {
    const calendarStatus = searchParams.get("calendar");
    if (calendarStatus === "success") {
      toast({ title: "Connected", description: "Google Calendar connected successfully" });
      fetchWorkspace(); // Refresh to get updated state
      router.replace("/settings?tab=integrations");
    } else if (calendarStatus === "error") {
      toast({ title: "Connection Failed", description: "Could not connect Google Calendar. Please try again.", variant: "destructive" });
      router.replace("/settings?tab=integrations");
    } else if (calendarStatus === "denied") {
      toast({ title: "Access Denied", description: "Calendar access was denied. Please grant permission to connect.", variant: "destructive" });
      router.replace("/settings?tab=integrations");
    }
  }, [searchParams]);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) setWorkspace((await res.json()).workspace);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load workspace", variant: "destructive" });
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserError(null);
      } else {
        const data = await res.json();
        const errorMsg = data.error || "Failed to load profile";
        setUserError(errorMsg);
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      const errorMsg = "Failed to load profile";
      setUserError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const handleUpdateWorkspace = (data: Partial<WorkspaceSettingsDTO>) => {
    setWorkspace(prev => prev ? { ...prev, ...data } : null);
  };

  const handleSaveWorkspace = async () => {
    setSavingWorkspace(true);
    try {
      const res = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workspace) });
      if (!res.ok) throw new Error("Failed to save workspace");
      toast({ title: "Success", description: "Workspace settings saved", variant: "default" });
      setSavedWorkspace(true); setTimeout(() => setSavedWorkspace(false), 2000);
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally { setSavingWorkspace(false); }
  };

  const handleUpdateProfile = (data: Partial<UserProfileDTO>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: user?.name, phone: user?.phone }) });
      if (!res.ok) throw new Error("Failed to save profile");
      toast({ title: "Success", description: "Profile saved", variant: "default" });
      setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2000);
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    setPasswordMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
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

  const handleDeleteAccount = async () => {
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

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/settings/test-email", { method: "POST" });
      if (res.ok) {
        toast({ title: "Success", description: "Email connection test passed", variant: "default" });
      } else {
        const data = await res.json();
        toast({ title: "Email Test Failed", description: data.error || "Could not connect", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection test failed", variant: "destructive" });
    } finally { setTestingEmail(false); }
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    try {
      const res = await fetch("/api/settings/test-sms", { method: "POST" });
      if (res.ok) {
        toast({ title: "Success", description: "SMS connection test passed", variant: "default" });
      } else {
        const data = await res.json();
        toast({ title: "SMS Test Failed", description: data.error || "Could not connect", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection test failed", variant: "destructive" });
    } finally { setTestingSms(false); }
  };


  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const res = await fetch("/api/integrations/google-calendar", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Redirect user to Google OAuth consent screen
        window.location.href = data.url;
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Could not initiate calendar connection", variant: "destructive" });
        setConnectingCalendar(false);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect Google Calendar", variant: "destructive" });
      setConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setDisconnectingCalendar(true);
    try {
      const res = await fetch("/api/integrations/google-calendar", { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Disconnected", description: "Google Calendar has been disconnected" });
        setWorkspace(prev => prev ? { ...prev, googleCalendarConnected: false, googleCalendarEmail: null } : null);
      } else {
        toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to disconnect Google Calendar", variant: "destructive" });
    } finally { setDisconnectingCalendar(false); }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}</div></div>;

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${workspace?.id}`;
  const contactFormUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/contact/${workspace?.id}`;

  return (
    <div>
      <Header title="Settings" subtitle="Manage your workspace and account" />
      <div className="p-4 sm:p-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="flex-nowrap whitespace-nowrap w-full sm:w-auto">
              <TabsTrigger value="workspace" className="flex items-center gap-2"><Settings className="w-4 h-4" /> <span className="hidden sm:inline">Workspace</span></TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">AI</span></TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Voice</span></TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2"><Link2 className="w-4 h-4" /> <span className="hidden sm:inline">Integrations</span></TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" /> <span className="hidden sm:inline">Profile</span></TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="w-4 h-4" /> <span className="hidden sm:inline">Security</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="workspace">
            <WorkspaceTab
              workspace={workspace}
              onUpdate={handleUpdateWorkspace}
              onSave={handleSaveWorkspace}
              saving={savingWorkspace}
              saved={savedWorkspace}
              copyToClipboard={copyToClipboard}
              copied={copied}
              bookingUrl={bookingUrl}
              contactFormUrl={contactFormUrl}
            />
          </TabsContent>

          <TabsContent value="ai">
            <AIPreferencesTab />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceSettingsTab />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsTab
              workspace={workspace}
              onTestEmail={handleTestEmail}
              onTestSms={handleTestSms}
              onConnectCalendar={handleConnectCalendar}
              onDisconnectCalendar={handleDisconnectCalendar}
              testingEmail={testingEmail}
              testingSms={testingSms}
              connectingCalendar={connectingCalendar}
              disconnectingCalendar={disconnectingCalendar}
            />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab
              user={user}
              onUpdate={handleUpdateProfile}
              onSave={handleSaveProfile}
              saving={savingProfile}
              saved={savedProfile}
              loading={loading}
              error={userError}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              onChangePassword={handleChangePassword}
              changingPassword={changingPassword}
              passwordMessage={passwordMessage}
              onDeleteAccount={handleDeleteAccount}
              isDeleting={isDeleting}
              deleteConfirmation={deleteConfirmation}
              setDeleteConfirmation={setDeleteConfirmation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
