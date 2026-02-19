"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import { FormList } from "@/components/forms/form-list";
import { SubmissionList } from "@/components/forms/submission-list";
import { SubmissionDetailDialog } from "@/components/forms/submission-detail-dialog";
import { ContactFormDTO, IntakeFormDTO, FormSubmissionDTO, ServiceDTO } from "@/types/dto";

/**
 *
 */
export default function FormsPage() {
  const [contactForms, setContactForms] = useState<ContactFormDTO[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeFormDTO[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmissionDTO[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);

  // Dialog States
  const [cfDialog, setCfDialog] = useState(false);
  const [ifDialog, setIfDialog] = useState(false);
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false);

  // Form Data States
  const [newCF, setNewCF] = useState({ name: "", welcomeMessage: "" });
  const [newIF, setNewIF] = useState({ name: "", description: "", serviceId: "" });
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionDTO | null>(null);

  // UI States
  const [copied, setCopied] = useState("");
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
    } catch (_error) {
      toast({ title: "Error", description: "Failed to load forms", variant: "destructive" });
    }
  };

  const createContactForm = async () => {
    if (!newCF.name) return;
    try {
      const res = await fetch("/api/forms/contact-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCF) });
      if (!res.ok) throw new Error("Failed to create contact form");
      toast({ title: "Success", description: "Contact form created", variant: "default" });
      setCfDialog(false); setNewCF({ name: "", welcomeMessage: "" }); fetchAll();
    } catch (_error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  const createIntakeForm = async () => {
    if (!newIF.name) return;
    try {
      const res = await fetch("/api/forms/intake-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newIF) });
      if (!res.ok) throw new Error("Failed to create intake form");
      toast({ title: "Success", description: "Intake form created", variant: "default" });
      setIfDialog(false); setNewIF({ name: "", description: "", serviceId: "" }); fetchAll();
    } catch (_error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
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

  const toggleForm = async (id: string, isActive: boolean, type: "contact" | "intake") => {
    const endpoint = type === "contact" ? "contact-forms" : "intake-forms";
    await fetch(`/api/forms/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAll();
  };

  const deleteForm = async (id: string, type: "contact" | "intake") => {
    setDeleting(id);
    const endpoint = type === "contact" ? "contact-forms" : "intake-forms";
    try {
      const res = await fetch(`/api/forms/${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      toast({ title: "Success", description: `${type === "contact" ? "Contact" : "Intake"} form deleted`, variant: "default" });
      fetchAll();
    } catch (_error) {
      toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
    } finally { setDeleting(""); }
  };

  const resendForm = async (submissionId: string) => {
    await fetch(`/api/forms/submissions/${submissionId}/resend`, { method: "POST" });
    toast({ title: "Success", description: "Form resent to client", variant: "default" });
    fetchAll();
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
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="whitespace-nowrap">
              <TabsTrigger value="contact-forms">Contact Forms ({contactForms.length})</TabsTrigger>
              <TabsTrigger value="intake-forms">Intake Forms ({intakeForms.length})</TabsTrigger>
              <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
            </TabsList>
          </div>

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

            <FormList
              forms={contactForms}
              type="contact"
              onToggle={(id, isActive) => toggleForm(id, isActive, "contact")}
              onDelete={(id) => deleteForm(id, "contact")}
              copied={copied}
              onCopy={copyLink}
              deleting={deleting}
            />
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

            <FormList
              forms={intakeForms}
              type="intake"
              onToggle={(id, isActive) => toggleForm(id, isActive, "intake")}
              onDelete={(id) => deleteForm(id, "intake")}
              copied={copied}
              onCopy={copyLink}
              deleting={deleting}
            />
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <SubmissionList
              submissions={submissions}
              onSelect={(sub) => { setSelectedSubmission(sub); setSubmissionDetailOpen(true); }}
              onUpdateStatus={updateSubmissionStatus}
              onResend={resendForm}
            />
          </TabsContent>
        </Tabs>
      </div>

      <SubmissionDetailDialog
        open={submissionDetailOpen}
        onOpenChange={setSubmissionDetailOpen}
        submission={selectedSubmission}
        onUpdateStatus={updateSubmissionStatus}
        onResend={resendForm}
      />
    </div>
  );
}
