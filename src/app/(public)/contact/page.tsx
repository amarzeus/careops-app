"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, CheckCircle, Mail, MessageSquare, Globe } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 *
 */
export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setSuccess(true);
    setSubmitting(false);
  };

  if (success)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <CheckCircle className="mx-auto mb-6 h-20 w-20 text-blue-600" />
          <h2 className="text-foreground mb-3 text-3xl font-black tracking-tight">Message Sent!</h2>
          <p className="text-muted-foreground mb-8">
            We&apos;ve received your inquiry and will get back to you within 24 hours.
          </p>
          <Link href="/">
            <Button variant="outline" className="rounded-full px-8">
              Return Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );

  return (
    <div className="bg-background min-h-screen selection:bg-blue-500/10">
      {/* Header Bar */}
      <nav className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="full" size={28} />
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-bold">
              Log In
            </Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid grid-cols-1 items-start gap-20 lg:grid-cols-2">
          {/* Left Column: Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-foreground mb-8 text-5xl leading-[0.9] font-black tracking-tight lg:text-7xl">
              Let&apos;s talk <br />
              <span className="text-blue-600">CareOps.</span>
            </h1>
            <p className="text-muted-foreground mb-12 max-w-lg text-xl leading-relaxed font-medium">
              Have questions about our platform, enterprise features, or just want to say hello? Our
              team is here to help.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 shadow-sm">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold">Email Us</h4>
                  <p className="text-muted-foreground">support@careops.io</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 shadow-sm">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold">Live Support</h4>
                  <p className="text-muted-foreground">Available Mon-Fri, 9am - 6pm EST.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-sm">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold">Global Headquarters</h4>
                  <p className="text-muted-foreground">Wilmington, Delaware, USA</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-border/40 bg-background/50 overflow-hidden rounded-[32px] shadow-2xl shadow-blue-500/5 backdrop-blur-xl">
              <CardHeader className="p-8 pb-0 lg:p-10">
                <CardTitle className="text-3xl font-black">Send a Message</CardTitle>
                <CardDescription className="text-base font-medium">
                  We typically respond in less than 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 lg:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="bg-muted/20 border-border/40 h-12 rounded-xl"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="bg-muted/20 border-border/40 h-12 rounded-xl"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="subject"
                      className="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                    >
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Enterprise Inquiry"
                      className="bg-muted/20 border-border/40 h-12 rounded-xl"
                      value={formData.subject}
                      onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-muted-foreground text-xs font-bold tracking-widest uppercase"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      className="bg-muted/20 border-border/40 min-h-[150px] resize-none rounded-xl"
                      value={formData.message}
                      onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-full bg-blue-600 text-lg font-bold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
                    disabled={submitting}
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="border-border/40 bg-muted/20 mt-20 border-t py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Logo variant="icon" size={24} className="mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground text-sm">
            © 2026 CareOps Enterprise. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
