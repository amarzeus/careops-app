"use client";

import React, { useEffect, useState } from "react";
import {
  FileText, Plus, Link2, ExternalLink, Eye, Clock,
  CheckCircle, AlertTriangle, Copy, Trash2, Send,
  ToggleLeft, ToggleRight, XCircle
} from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

/** Type definitions matching Prisma schema */
interface ContactFormItem {
  id: string;
  name: string;
  fields: string;
  isActive: boolean;
  slug: string;
  welcomeMessage: string | null;
  createdAt: string;
}

interface ServiceItem {
  id: string;
  name: string;
}

interface IntakeFormItem {
  id: string;
  name: string;
  description: string | null;
  fields: string;
  isActive: boolean;
  slug: string;
  serviceId: string | null;
  service: ServiceItem | null;
  createdAt: string;
  _count?: { submissions: number };
}

interface ContactRef {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface FormSubmissionItem {
  id: string;
  data: Record<string, unknown>;
  status: "PENDING" | "SENT" | "COMPLETED" | "OVERDUE";
  intakeForm: { name: string } | null;
  contact: ContactRef | null;
  createdAt: string;
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export default function FormsPage() {
  const [contactForms, setContactForms] = useState<ContactFormItem[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeFormItem[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmissionItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cfDialog, setCfDialog] = useState(false);
  const [ifDialog, setIfDialog] = useState(false);
  const [newCF, setNewCF] = useState({ name: "", welcomeMessage: "" });
  const [newIF, setNewIF] = useState({ name: "", description: "", serviceId: "" });
  const [copied, setCopied] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionItem | null>(null);
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState("");

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load forms";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const createContactForm = async () => {
    if (!newCF.name) return;
    try {
      const res = await fetch("/api/forms/contact-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCF) });
      if (!res.ok) throw new Error("Failed to create contact form");
      toast({ title: "Success", description: "Contact form created", variant: "success" });
      setCfDialog(false); setNewCF({ name: "", welcomeMessage: "" }); fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const createIntakeForm = async () => {
    if (!newIF.name) return;
    try {
      const res = await fetch("/api/forms/intake-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newIF) });
      if (!res.ok) throw new Error("Failed to create intake form");
      toast({ title: "Success", description: "Intake form created", variant: "success" });
      setIfDialog(false); setNewIF({ name: "", description: "", serviceId: "" }); fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const copyLink = (slug: string, type: string) => {
    const url = `${window.location.origin}/${type}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(""), 2000);
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    await fetch(`/api/forms/submissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const toggleContactForm = async (id: string, isActive: boolean) => {
    await fetch(`/api/forms/contact-forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAll();
  };

  const toggleIntakeForm = async (id: string, isActive: boolean) => {
    await fetch(`/api/forms/intake-forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAll();
  };

  const deleteContactForm = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/forms/contact-forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      toast({ title: "Success", description: "Contact form deleted", variant: "success" });
      fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete form";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setDeleting(""); }
  };

  const deleteIntakeForm = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/forms/intake-forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      toast({ title: "Success", description: "Intake form deleted", variant: "success" });
      fetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete form";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setDeleting(""); }
  };

  const resendForm = async (submissionId: string) => {
    await fetch(`/api/forms/submissions/${submissionId}/resend`, { method: "POST" });
    fetchAll();
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: BadgeVariant }> = {
      PENDING: { label: "Pending", variant: "warning" },
      SENT: { label: "Sent", variant: "secondary" },
      COMPLETED: { label: "Completed", variant: "success" },
      OVERDUE: { label: "Overdue", variant: "destructive" },
    };
    const c = config[status] || config.PENDING;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const pendingCount = submissions.filter(s => s.status === "PENDING" || s.status === "SENT").length;
  const completedCount = submissions.filter(s => s.status === "COMPLETED").length;
  const overdueCount = submissions.filter(s => s.status === "OVERDUE").length;

  return (
    <div>
      <Header title="Forms" subtitle="Manage contact forms, intake forms, and submissions" />
      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{contactForms.length}</p>
              <p className="text-xs text-gray-500">Contact Forms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{intakeForms.length}</p>
              <p className="text-xs text-gray-500">Intake Forms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending / Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                {overdueCount > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                    <p className="text-xs text-gray-500">Overdue</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contact-forms">
          <TabsList>
            <TabsTrigger value="contact-forms">Contact Forms ({contactForms.length})</TabsTrigger>
            <TabsTrigger value="intake-forms">Intake Forms ({intakeForms.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          {/* Contact Forms Tab */}
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
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No contact forms yet</p>
                  <p className="text-xs text-gray-400 mb-4">Create a contact form to start capturing leads from your website.</p>
                  <Button variant="outline" size="sm" onClick={() => setCfDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create Contact Form
                  </Button>
                </div>
              ) : contactForms.map(form => (
                <Card key={form.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={form.isActive ? "success" : "secondary"}>{form.isActive ? "Active" : "Inactive"}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleContactForm(form.id, form.isActive)}
                        title={form.isActive ? "Deactivate form" : "Activate form"}
                      >
                        {form.isActive
                          ? <ToggleRight className="w-4 h-4 text-green-600" />
                          : <ToggleLeft className="w-4 h-4 text-gray-400" />
                        }
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyLink(form.slug, "contact")}>
                        {copied === form.slug ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied === form.slug ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/contact/${form.slug}`, "_blank")}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={deleting === form.id}
                        onClick={() => { if (confirm("Are you sure you want to delete this contact form?")) deleteContactForm(form.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Intake Forms Tab */}
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
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No intake forms yet</p>
                  <p className="text-xs text-gray-400 mb-4">Create an intake form to collect information from clients before appointments.</p>
                  <Button variant="outline" size="sm" onClick={() => setIfDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create Intake Form
                  </Button>
                </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleIntakeForm(form.id, form.isActive)}
                        title={form.isActive ? "Deactivate form" : "Activate form"}
                      >
                        {form.isActive
                          ? <ToggleRight className="w-4 h-4 text-green-600" />
                          : <ToggleLeft className="w-4 h-4 text-gray-400" />
                        }
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyLink(form.slug, "form")}>
                        {copied === form.slug ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied === form.slug ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={deleting === form.id}
                        onClick={() => { if (confirm("Are you sure you want to delete this intake form?")) deleteIntakeForm(form.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-3 mt-4">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No submissions yet</p>
                  <p className="text-xs text-gray-400">Submissions will appear here when contacts fill out your forms.</p>
                </div>
              ) : submissions.map(sub => (
                <Card
                  key={sub.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => { setSelectedSubmission(sub); setSubmissionDetailOpen(true); }}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-sm">{sub.contact?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{sub.intakeForm?.name || "Contact Form"} | {new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {(sub.status === "PENDING" || sub.status === "SENT") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => resendForm(sub.id)}
                          title="Re-send form"
                        >
                          <Send className="w-3 h-3 mr-1" /> Resend
                        </Button>
                      )}
                      {sub.status !== "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => updateSubmissionStatus(sub.id, "COMPLETED")}
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      {sub.status !== "OVERDUE" && sub.status !== "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => updateSubmissionStatus(sub.id, "OVERDUE")}
                          title="Mark as overdue"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </Button>
                      )}
                      {statusBadge(sub.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Detail Dialog */}
      <Dialog open={submissionDetailOpen} onOpenChange={setSubmissionDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>View submission information and manage its status.</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                {statusBadge(selectedSubmission.status)}
                <p className="text-xs text-gray-400">
                  Submitted {new Date(selectedSubmission.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact</p>
                  <p className="font-medium text-sm">{selectedSubmission.contact?.name || "Unknown"}</p>
                  {selectedSubmission.contact?.email && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedSubmission.contact.email}</p>
                  )}
                  {selectedSubmission.contact?.phone && (
                    <p className="text-xs text-gray-500">{selectedSubmission.contact.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Form</p>
                  <p className="font-medium text-sm">{selectedSubmission.intakeForm?.name || "Contact Form"}</p>
                </div>
              </div>

              {selectedSubmission.data && Object.keys(selectedSubmission.data).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Submission Data</p>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</p>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {(selectedSubmission.status === "PENDING" || selectedSubmission.status === "SENT") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600"
                    onClick={() => { resendForm(selectedSubmission.id); }}
                  >
                    <Send className="w-3 h-3 mr-1" /> Re-send Form
                  </Button>
                )}
                {selectedSubmission.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { updateSubmissionStatus(selectedSubmission.id, "COMPLETED"); setSubmissionDetailOpen(false); }}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Mark Completed
                  </Button>
                )}
                {selectedSubmission.status !== "OVERDUE" && selectedSubmission.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => { updateSubmissionStatus(selectedSubmission.id, "OVERDUE"); setSubmissionDetailOpen(false); }}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" /> Mark Overdue
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
