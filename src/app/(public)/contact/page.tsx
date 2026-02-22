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

export default function PlatformContactPage() {
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));
        setSuccess(true);
        setSubmitting(false);
    };

    if (success) return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center"
            >
                <CheckCircle className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-3 text-foreground tracking-tight">Message Sent!</h2>
                <p className="text-muted-foreground mb-8">We&apos;ve received your inquiry and will get back to you within 24 hours.</p>
                <Link href="/">
                    <Button variant="outline" className="rounded-full px-8">Return Home</Button>
                </Link>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background selection:bg-blue-500/10">
            {/* Header Bar */}
            <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo variant="full" size={28} />
                    </Link>
                    <Link href="/login">
                        <Button variant="ghost" className="text-sm font-bold">Log In</Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

                    {/* Left Column: Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-foreground mb-8 leading-[0.9]">
                            Let&apos;s talk <br />
                            <span className="text-blue-600">CareOps.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium mb-12 max-w-lg leading-relaxed">
                            Have questions about our platform, enterprise features, or just want to say hello? Our team is here to help.
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Email Us</h4>
                                    <p className="text-muted-foreground">amarzeus.dev@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Live Support</h4>
                                    <p className="text-muted-foreground">Available Mon-Fri, 9am - 6pm EST.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                                    <Globe className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Global Headquarters</h4>
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
                        <Card className="border-border/40 shadow-2xl shadow-blue-500/5 bg-background/50 backdrop-blur-xl rounded-[32px] overflow-hidden">
                            <CardHeader className="p-8 lg:p-10 pb-0">
                                <CardTitle className="text-3xl font-black">Send a Message</CardTitle>
                                <CardDescription className="text-base font-medium">We typically respond in less than 24 hours.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 lg:p-10">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Full Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                                value={formData.email}
                                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Enterprise Inquiry"
                                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                            value={formData.subject}
                                            onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Message</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Tell us how we can help..."
                                            className="min-h-[150px] bg-muted/20 border-border/40 rounded-xl resize-none"
                                            value={formData.message}
                                            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send Message</>}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </main>

            <footer className="border-t border-border/40 py-12 bg-muted/20 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <Logo variant="icon" size={24} className="mx-auto opacity-40 mb-4" />
                    <p className="text-sm text-muted-foreground">© 2026 CareOps Enterprise. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
