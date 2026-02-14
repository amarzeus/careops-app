"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormField {
  name: string; label: string; type: string; required: boolean;
}

function FormContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submission");
  const [form, setForm] = useState<any>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchForm(); }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/public/form/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        const parsed = JSON.parse(data.form.fields || '[]');
        if (parsed.length === 0) {
          // Default intake fields
          const defaults: FormField[] = [
            { name: "fullName", label: "Full Name", type: "text", required: true },
            { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
            { name: "medicalHistory", label: "Medical History", type: "textarea", required: false },
            { name: "allergies", label: "Allergies", type: "textarea", required: false },
            { name: "medications", label: "Current Medications", type: "textarea", required: false },
            { name: "additionalNotes", label: "Additional Notes", type: "textarea", required: false },
          ];
          setFields(defaults);
          const initial: Record<string, string> = {};
          defaults.forEach(f => { initial[f.name] = ""; });
          setFormData(initial);
        } else {
          setFields(parsed);
          const initial: Record<string, string> = {};
          parsed.forEach((f: FormField) => { initial[f.name] = ""; });
          setFormData(initial);
        }
      }
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/public/form/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData, submissionId }),
      });
      if (res.ok) { setSuccess(true); }
      else { const d = await res.json(); setError(d.error || "Submission failed"); }
    } catch { setError("Something went wrong"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!form) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Form not found</p></div>;

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Form Submitted!</h2>
          <p className="text-gray-600">Thank you for completing the form. Your information has been received.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>{form.name}</CardTitle>
              {form.description && <CardDescription>{form.description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            {fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                {field.type === "textarea" ? (
                  <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} value={formData[field.name] || ""} onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))} required={field.required} />
                ) : (
                  <Input type={field.type || "text"} placeholder={`Enter ${field.label.toLowerCase()}`} value={formData[field.name] || ""} onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))} required={field.required} />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12" disabled={submitting}>
              {submitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" />Submit Form</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PublicIntakeFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">Loading form...</div>}>
      <FormContent slug={slug} />
    </Suspense>
  );
}
