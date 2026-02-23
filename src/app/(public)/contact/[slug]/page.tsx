/* eslint-disable @typescript-eslint/no-explicit-any */
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
  name: string;
  label: string;
  type: string;
  required: boolean;
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
      const res = await fetch(`/api/public/contact-form/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        const parsed = JSON.parse(data.form.fields || "[]");
        setFields(parsed);
        const initial: Record<string, string> = {};
        parsed.forEach((f: FormField, i: number) => {
          initial[getFieldKey(f, i)] = "";
        });
        setFormData(initial);
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
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formSlug: slug, data: formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setSuccessMessage(data.message);
      } else {
        setError(data.error || "Submission failed");
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
            <h2 className="mb-2 text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">{successMessage}</p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-7xl">
        <CardHeader className="text-center">
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Logo variant="full" size={42} />
            </Link>
          </div>
          <CardTitle className="text-2xl">{form.workspace?.name || "Contact Us"}</CardTitle>
          <CardDescription>{form.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {fields.map((field, i) => {
              const fieldKey = getFieldKey(field, i);
              return (
                <div key={i} className="space-y-2">
                  <Label>
                    {field.label} {field.required && "*"}
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
              className="bg-primary hover:bg-primary/90 w-full"
              disabled={submitting}
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
