"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Send, CheckCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormField {
  name: string; label: string; type: string; required: boolean;
}

/**
 *
 * @param root0
 * @param root0.params
 */
export default function PublicContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<any>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/contact-form/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        const parsed = JSON.parse(data.form.fields || "[]");
        setFields(parsed);
        const initial: Record<string, string> = {};
        parsed.forEach((f: FormField) => { initial[f.name] = ""; });
        setFormData(initial);
      }
    } catch { } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => {
    void fetchForm();
  }, [fetchForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formSlug: slug, data: formData }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setSuccessMessage(data.message); }
      else { setError(data.error || "Submission failed"); }
    } catch { setError("Something went wrong"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-muted/30 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  if (!form) return <div className="min-h-screen bg-muted/30 flex items-center justify-center"><p className="text-muted-foreground">Form not found</p></div>;

  if (success) return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-muted-foreground">{successMessage}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-7xlg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Link href="/">
              <Logo variant="full" size={42} />
            </Link>
          </div>
          <CardTitle className="text-2xl">{form.workspace?.name || "Contact Us"}</CardTitle>
          <CardDescription>{form.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            {fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label} {field.required && "*"}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.name] || ""}
                    onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                    required={field.required}
                  />
                ) : (
                  <Input
                    type={field.type || "text"}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.name] || ""}
                    onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" />Submit</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
