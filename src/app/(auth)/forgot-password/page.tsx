"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Step = "request" | "verify" | "reset" | "success";

/**
 *
 */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          email: method === "email" ? email : undefined,
          phone: method === "sms" ? phone : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Verification code sent!");
        setStep("verify");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          email: method === "email" ? email : undefined,
          phone: method === "sms" ? phone : undefined,
          otp,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-blue-100 shadow-lg">
        <CardHeader className="pb-2 text-center">
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Logo variant="full" size={42} />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "request" && "Reset Password"}
            {step === "verify" && "Verify Identity"}
            {step === "reset" && "Create New Password"}
            {step === "success" && "Password Reset!"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === "request" && "Choose how you want to receive your reset code"}
            {step === "verify" && `Enter the 6-digit code sent to your ${method}`}
            {step === "reset" && "Choose a strong password for your account"}
            {step === "success" && "Your password has been updated successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="animate-in fade-in slide-in-from-top-1 mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "request" && (
            <Tabs defaultValue="email" onValueChange={(v) => setMethod(v as "email" | "sms")}>
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> SMS
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleRequest} className="space-y-4">
                <TabsContent value="email" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 pl-10 focus-visible:ring-blue-500"
                        required={method === "email"}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 pl-10 focus-visible:ring-blue-500"
                        required={method === "sms"}
                      />
                    </div>
                  </div>
                </TabsContent>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 h-11 w-full shadow-sm transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </div>
                  ) : (
                    "Get Reset Code"
                  )}
                </Button>
              </form>
            </Tabs>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="block text-center text-sm font-semibold">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOtp(val);
                    if (val.length === 6) setStep("reset");
                  }}
                  className="h-14 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:border-blue-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground text-center text-xs">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={loading}
                    className="text-primary font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Resend"}
                  </button>
                </p>
                {message && (
                  <p className="animate-in fade-in text-[10px] font-medium text-green-600">
                    {message}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setStep("reset")}
                disabled={otp.length !== 6}
                className="bg-primary hover:bg-primary/90 h-11 w-full shadow-sm"
              >
                Verify Code
              </Button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 h-11 w-full shadow-sm"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-100 bg-green-50 shadow-sm">
                <ShieldCheck className="animate-in zoom-in h-10 w-10 text-green-600 duration-300" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Secure access restored! Your password has been successfully updated.
                </p>
              </div>
              <Link href="/login" className="block">
                <Button className="bg-primary hover:bg-primary/90 h-11 w-full shadow-md">
                  Sign In Now
                </Button>
              </Link>
            </div>
          )}

          {step !== "success" && (
            <div className="border-border/40 mt-8 border-t pt-6 text-center">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-primary inline-flex items-center text-sm font-medium transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
