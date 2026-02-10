"use client";

import React, { useEffect, useState } from "react";
import { FileText, Plus, Link2, ExternalLink, Eye, Clock, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export default function FormsPage() {
  const [contactForms, setContactForms] = useState<any[]>([]);
  const [intakeForms, setIntakeForms] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cfDialog, setCfDialog] = useState(false);
  const [ifDialog, setIfDialog] = useState(false);
  const [newCF, setNewCF] = useState({ name: "", welcomeMessage: "" });
  const [newIF, setNewIF] = useState({ name: "", description: "", serviceId: "" });
  const [copied, setCopied] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [cf, inf, sub, svc] = await Promise.all([
        fetch("/api/forms/contact-forms").then(r => r.json()),
        fetch("/api/forms/intake-forms").then(r => r.json()),
        fetch("/api/forms/submissions").then(r => r.json()),
        fetch("/api/services").then(r => r.json()),
      ]);
      setContactForms(cf.forms || []);
      setIntakeForms(inf.forms || []);
      setSubmissions(sub.submissions || []);
      setServices(svc.services || []);
    } catch {} finally { setLoading(false); }
  };

  const createContactForm = async () => {
    if (!newCF.name) return;
    await fetch("/api/forms/contact-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCF) });
    setCfDialog(false); setNewCF({ name: "", welcomeMessage: "" }); fetchAll();
  };

  const createIntakeForm = async () => {
    if (!newIF.name) return;
    await fetch("/api/forms/intake-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newIF) });
    setIfDialog(false); setNewIF({ name: "", description: "", serviceId: "" }); fetchAll();
  };

  const copyLink = (slug: string, type: string) => {
    const url = `${window.location.origin}/${type}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(""), 2000);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      PENDING: { label: "Pending", variant: "warning" },
      SENT: { label: "Sent", variant: "secondary" },
      COMPLETED: { label: "Completed", variant: "success" },
      OVERDUE: { label: "Overdue", variant: "destructive" },
    };
    const c = config[status] || config.PENDING;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div>
      <Header title="Forms" subtitle="Manage contact forms, intake forms, and submissions" />
      <div className="p-6">
        <Tabs defaultValue="contact-forms">
          <TabsList>
            <TabsTrigger value="contact-forms">Contact Forms ({contactForms.length})</TabsTrigger>
            <TabsTrigger value="intake-forms">Intake Forms ({intakeForms.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="contact-forms">
            <div className="flex justify-end mb-4 mt-4">
              <Dialog open={cfDialog} onOpenChange={setCfDialog}>
                <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Contact Form</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Contact Form</DialogTitle><DialogDescription>This form will be publicly accessible for lead capture.</DialogDescription></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Form Name</Label><Input placeholder="Contact Us" value={newCF.name} onChange={e => setNewCF(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Welcome Message</Label><Textarea placeholder="Thank you for reaching out..." value={newCF.welcomeMessage} onChange={e => setNewCF(p => ({ ...p, welcomeMessage: e.target.value }))} /></div>
                    <Button onClick={createContactForm} className="w-full bg-blue-600 hover:bg-blue-700">Create Form</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {contactForms.length === 0 ? (
                <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No contact forms yet</p></div>
              ) : contactForms.map(form => (
                <Card key={form.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={form.isActive ? "success" : "secondary"}>{form.isActive ? "Active" : "Inactive"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => copyLink(form.slug, "contact")}>
                        {copied === form.slug ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied === form.slug ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/contact/${form.slug}`, "_blank")}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="intake-forms">
            <div className="flex justify-end mb-4 mt-4">
              <Dialog open={ifDialog} onOpenChange={setIfDialog}>
                <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Intake Form</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Intake Form</DialogTitle><DialogDescription>This form is sent after a booking is made.</DialogDescription></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Form Name</Label><Input placeholder="Patient Intake" value={newIF.name} onChange={e => setNewIF(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Please complete before your visit..." value={newIF.description} onChange={e => setNewIF(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>Link to Service (optional)</Label>
                      <Select value={newIF.serviceId} onValueChange={v => setNewIF(p => ({ ...p, serviceId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createIntakeForm} className="w-full bg-blue-600 hover:bg-blue-700">Create Form</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {intakeForms.length === 0 ? (
                <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No intake forms yet</p></div>
              ) : intakeForms.map(form => (
                <Card key={form.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {form.service && <Badge variant="secondary">{form.service.name}</Badge>}
                        <span className="text-xs text-gray-500">{form._count?.submissions || 0} submissions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={form.isActive ? "success" : "secondary"}>{form.isActive ? "Active" : "Inactive"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => copyLink(form.slug, "form")}>
                        {copied === form.slug ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied === form.slug ? "Copied!" : "Copy Link"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <div className="space-y-3 mt-4">
              {submissions.length === 0 ? (
                <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No submissions yet</p></div>
              ) : submissions.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-sm">{sub.contact?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{sub.intakeForm?.name || "Contact Form"} | {new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    {statusBadge(sub.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
