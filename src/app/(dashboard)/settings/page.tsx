"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Link2, Copy, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => { fetchWorkspace(); }, []);

  const fetchWorkspace = async () => {
    try { const res = await fetch("/api/workspace"); if (res.ok) setWorkspace((await res.json()).workspace); } catch {} finally { setLoading(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workspace) });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}</div></div>;

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${workspace?.id}`;

  return (
    <div>
      <Header title="Settings" subtitle="Configure your workspace">
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
          {saved ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
        </Button>
      </Header>
      <div className="p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Workspace</CardTitle><CardDescription>Basic business information</CardDescription></CardHeader>
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
        </Card>

        <Card>
          <CardHeader><CardTitle>Communication</CardTitle><CardDescription>Email and SMS configuration</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div><p className="font-medium text-sm">Email Enabled</p><p className="text-xs text-gray-500">Send automated emails</p></div>
              <Switch checked={workspace?.emailConfigured || false} onCheckedChange={v => setWorkspace((p: any) => ({ ...p, emailConfigured: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>From Name</Label><Input value={workspace?.emailFromName || ""} onChange={e => setWorkspace((p: any) => ({ ...p, emailFromName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>From Address</Label><Input value={workspace?.emailFromAddress || ""} onChange={e => setWorkspace((p: any) => ({ ...p, emailFromAddress: e.target.value }))} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Public Links</CardTitle><CardDescription>Share these links with your customers</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
              <code className="text-xs flex-1 truncate">{bookingUrl}</code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(bookingUrl, "booking")}>
                {copied === "booking" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Workspace Status</p><p className="text-xs text-gray-500">Current: <Badge variant={workspace?.status === "ACTIVE" ? "success" : "secondary"}>{workspace?.status}</Badge></p></div>
              <Button variant="outline" className="text-red-600 border-red-200" onClick={async () => { await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: workspace?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) }); fetchWorkspace(); }}>
                {workspace?.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
