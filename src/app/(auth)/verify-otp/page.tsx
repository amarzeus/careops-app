"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Smartphone, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyMethod = "email" | "sms";

/**
 *
 */
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
  const [method, setMethod] = useState<VerifyMethod>("email");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);

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

  const handleVerify = useCallback(
    async (code?: string) => {
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
          body: JSON.stringify({ email, otp: otpCode, phone: phone || undefined }),
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
    },
    [email, otp, phone, router]
  );

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
        body: JSON.stringify({ email, channel: method, phone: phone || undefined }),
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

      setCodeSent(true);
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send SMS";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const switchMethod = (newMethod: VerifyMethod) => {
    setMethod(newMethod);
    setCodeSent(false);
    setError("");
    setOtp(["", "", "", "", "", ""]);
  };

  // Icons & colors per method
  const methodConfig = {
    email: {
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      bgIcon: "bg-blue-100",
      btnClass: "bg-blue-600 hover:bg-blue-700",
      label: "email",
    },
    sms: {
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      bgIcon: "bg-blue-100",
      btnClass: "bg-blue-600 hover:bg-blue-700",
      label: "phone",
    },
  };

  const config = methodConfig[method];

  if (verified) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Verified!</h2>
          <p className="text-gray-500">Redirecting you to your workspace...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div
          className={`mx-auto h-12 w-12 ${config.bgIcon} mb-4 flex items-center justify-center rounded-xl`}
        >
          {config.icon}
        </div>
        <CardTitle className="text-2xl">Verify your {config.label}</CardTitle>
        <CardDescription>
          {method === "email" ? (
            <>
              We sent a 6-digit code to <strong>{email || "your email"}</strong>
            </>
          ) : codeSent ? (
            <>
              We sent a 6-digit code to <strong>{phone}</strong> via SMS
            </>
          ) : (
            <>Enter your phone number to receive a code via SMS</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
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

        {method === "sms" && !codeSent ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">Use E.164 format (e.g., +919876543210)</p>
            </div>
            <Button
              onClick={handleSendSMS}
              className={`w-full ${config.btnClass}`}
              disabled={resending || !phone}
            >
              {resending ? "Sending..." : `Send SMS Code`}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => switchMethod("email")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to email verification
            </Button>
          </div>
        ) : (
          <>
            {/* 6-digit OTP input */}
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <Input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-12 text-center text-xl font-semibold tracking-widest"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
            <Button
              onClick={() => handleVerify()}
              className={`w-full ${config.btnClass}`}
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            {/* Resend section */}
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-500">
                {canResend ? (
                  "Didn&apos;t receive a code?"
                ) : (
                  <>
                    Resend available in{" "}
                    <span className="font-medium text-gray-700">{countdown}s</span>
                  </>
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
                  <RefreshCw className={`mr-2 h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Sending..." : "Resend Code"}
                </Button>
              )}
            </div>

            {/* Channel switcher */}
            <div className="space-y-2 border-t pt-4">
              <p className="mb-2 text-center text-xs text-gray-400">Or verify using:</p>
              <div className="flex justify-center gap-2">
                {method !== "email" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchMethod("email")}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                )}
                {method !== "sms" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchMethod("sms")}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    SMS
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 *
 */
export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
