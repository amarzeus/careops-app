/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

/**
 *
 */
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

  const getFieldKey = (f: any, index: number) => {
    if (f.name) return f.name;
    const label = (f.label || "").toLowerCase();
    if (label.includes("name")) return "name";
    if (label.includes("email")) return "email";
    if (label.includes("phone")) return "phone";
    if (label.includes("message") || label.includes("reason")) return "message";
    return `field_${index}`;
  };

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/form/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        const parsed = JSON.parse(data.form.fields || "[]");
        if (parsed.length === 0) {
          // Default intake fields
          const defaults: FormField[] = [
            { name: "fullName", label: "Full Name", type: "text", required: true },
            { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
            { name: "medicalHistory", label: "Medical History", type: "textarea", required: false },
            { name: "allergies", label: "Allergies", type: "textarea", required: false },
            {
              name: "medications",
              label: "Current Medications",
              type: "textarea",
              required: false,
            },
            {
              name: "additionalNotes",
              label: "Additional Notes",
              type: "textarea",
              required: false,
            },
          ];
          setFields(defaults);
          const initial: Record<string, string> = {};
          defaults.forEach((f) => {
            initial[f.name] = "";
          });
          setFormData(initial);
        } else {
          setFields(parsed);
          const initial: Record<string, string> = {};
          parsed.forEach((f: FormField, i: number) => {
            initial[getFieldKey(f, i)] = "";
          });
          setFormData(initial);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchForm();
  }, [fetchForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/public/form/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData, submissionId }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const d = await res.json();
        setError(d.error || "Submission failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  if (!form)
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Form not found</p>
      </div>
    );

  if (success)
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold">Form Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for completing the form. Your information has been received.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="bg-muted/30 min-h-screen px-4 py-12">
      <Card className="mx-auto w-full max-w-7xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="text-primary h-5 w-5" />
            </div>
            <div>
              <CardTitle>{form.name}</CardTitle>
              {form.description && <CardDescription>{form.description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {fields.map((field, i) => {
              const fieldKey = getFieldKey(field, i);
              return (
                <div key={i} className="space-y-2">
                  <Label>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[fieldKey] || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, [fieldKey]: e.target.value }))}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      type={field.type || "text"}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[fieldKey] || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, [fieldKey]: e.target.value }))}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 h-12 w-full"
              disabled={submitting}
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Form
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 *
 * @param root0
 * @param root0.params
 */
export default function PublicIntakeFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
          Loading form...
        </div>
      }
    >
      <FormContent slug={slug} />
    </Suspense>
  );
}
