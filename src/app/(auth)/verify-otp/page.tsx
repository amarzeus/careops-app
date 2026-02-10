"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Smartphone, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [phone, setPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleVerify = useCallback(async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setVerified(true);

      setTimeout(() => {
        const workspaceStatus = data.workspace?.status;
        if (workspaceStatus === "ONBOARDING" || !data.workspace) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [email, otp, router]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleResendEmail = async () => {
    if (!canResend) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");

      setCountdown(60);
      setCanResend(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend code";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleSendSMS = async () => {
    if (!phone) {
      setError("Please enter your phone number");
      return;
    }
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send SMS");

      setSmsSent(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send SMS";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-500">Redirecting you to your workspace...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
          {method === "email" ? (
            <Mail className="w-6 h-6 text-blue-600" />
          ) : (
            <Smartphone className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <CardTitle className="text-2xl">Verify your {method === "email" ? "email" : "phone"}</CardTitle>
        <CardDescription>
          {method === "email" ? (
            <>We sent a 6-digit code to <strong>{email || "your email"}</strong></>
          ) : smsSent ? (
            <>We sent a 6-digit code to <strong>{phone}</strong></>
          ) : (
            <>Enter your phone number to receive a code via SMS</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {!emailParam && method === "email" && (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {method === "sms" && !smsSent ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">Use E.164 format (e.g., +1234567890)</p>
            </div>
            <Button
              onClick={handleSendSMS}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={resending || !phone}
            >
              {resending ? "Sending..." : "Send SMS Code"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setMethod("email")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to email verification
            </Button>
          </div>
        ) : (
          <>
            {/* 6-digit OTP input */}
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-semibold tracking-widest"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
            <Button
              onClick={() => handleVerify()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            {/* Resend section */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                {canResend ? (
                  "Didn&apos;t receive a code?"
                ) : (
                  <>Resend available in <span className="font-medium text-gray-700">{countdown}s</span></>
                )}
              </p>
              {canResend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Sending..." : "Resend Code"}
                </Button>
              )}
            </div>

            {/* Switch to SMS option */}
            {method === "email" && (
              <div className="text-center border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMethod("sms")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Verify via SMS instead
                </Button>
              </div>
            )}

            {/* Switch back to email if using SMS */}
            {method === "sms" && smsSent && (
              <div className="text-center border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setMethod("email"); setSmsSent(false); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Verify via email instead
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
