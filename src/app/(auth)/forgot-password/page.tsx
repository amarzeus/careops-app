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
          phone: method === "sms" ? phone : undefined
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
          newPassword
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-blue-100">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
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
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {step === "request" && (
            <Tabs defaultValue="email" onValueChange={(v) => setMethod(v as "email" | "sms")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> SMS
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleRequest} className="space-y-4">
                <TabsContent value="email" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 focus-visible:ring-blue-500"
                        required={method === "email"}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 focus-visible:ring-blue-500"
                        required={method === "sms"}
                      />
                    </div>
                  </div>
                </TabsContent>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 h-11 transition-all shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                <Label htmlFor="otp" className="text-sm font-semibold text-center block">Verification Code</Label>
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
                  className="text-center text-2xl tracking-[0.5em] font-bold h-14 border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-xs text-muted-foreground">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={loading}
                    className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Resend"}
                  </button>
                </p>
                {message && (
                  <p className="text-[10px] text-green-600 font-medium animate-in fade-in">
                    {message}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setStep("reset")}
                disabled={otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90 h-11 shadow-sm"
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                className="w-full bg-primary hover:bg-primary/90 h-11 shadow-sm"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 shadow-sm">
                <ShieldCheck className="w-10 h-10 text-green-600 animate-in zoom-in duration-300" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Secure access restored! Your password has been successfully updated.
                </p>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 h-11 shadow-md">
                  Sign In Now
                </Button>
              </Link>
            </div>
          )}

          {step !== "success" && (
            <div className="mt-8 pt-6 border-t border-border/40 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
