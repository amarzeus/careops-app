"use strict";
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GradientOrb } from "@/components/ui/gradient-orb";
import { TiltCard } from "@/components/ui/tilt-card";
import { FloatingElement } from "@/components/ui/floating-element";

/**
 *
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Display error from URL query params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (errorParam) {
      let errorMessage = "Authentication failed";
      if (errorParam === "google_auth_failed") {
        errorMessage = "Google sign-in failed. Please try again.";
      }
      if (messageParam) {
        errorMessage += `: ${decodeURIComponent(messageParam)}`;
      }
      setError(errorMessage);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.status === 403 && data.requiresVerification) {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.workspace?.status === "ONBOARDING") {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background relative flex min-h-screen w-full overflow-hidden">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <GradientOrb
          className="-top-[200px] -left-[200px] h-[800px] w-[800px] bg-blue-400/20"
          delay={0}
        />
        <GradientOrb className="right-0 bottom-0 h-[600px] w-[600px] bg-purple-400/20" delay={2} />
      </div>

      {/* Left Column - Form */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="mb-6 inline-block transition-transform hover:scale-105">
              <Logo variant="full" size={40} />
            </Link>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your operations and bookings.
            </p>
          </div>

          <Card className="border-border/40 shadow-border/50 bg-background/80 shadow-xl backdrop-blur-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <Activity className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-background hover:bg-muted/30 text-muted-foreground border-border/40 h-11 w-full shadow-sm transition-all hover:-translate-y-0.5"
                    onClick={() => (window.location.href = "/api/auth/google")}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative flex items-center py-1">
                    <div className="border-border/40 flex-grow border-t"></div>
                    <span className="text-muted-foreground mx-4 flex-shrink-0 text-xs font-semibold uppercase">
                      Or sign in with email
                    </span>
                    <div className="border-border/40 flex-grow border-t"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@work.com"
                        className="bg-muted/30 border-border/40 focus:bg-background h-11 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-muted-foreground">
                          Password
                        </Label>
                        <Link
                          href="/forgot-password"
                          className="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-muted/30 border-border/40 focus:bg-background h-11 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 h-11 w-full font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-spin" /> Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-cta hover:text-cta/80 font-semibold transition-colors hover:underline"
            >
              Start your free trial
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Visuals (Hidden on Mobile) */}
      <div className="bg-muted/30 relative hidden w-1/2 items-center justify-center overflow-hidden lg:flex">
        <div className="from-primary via-primary/80 to-primary/60 absolute inset-0 bg-gradient-to-br opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />

        <div className="relative z-10 max-w-7xl p-12 text-white">
          <FloatingElement delay={0}>
            <TiltCard className="mb-8">
              <div className="bg-background/10 rounded-2xl border border-white/20 p-6 shadow-2xl backdrop-blur-md">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400/20 text-green-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">System Operational</div>
                    <div className="text-sm text-blue-100">All services running smoothly</div>
                  </div>
                </div>
                <div className="bg-background/10 h-2 overflow-hidden rounded-full">
                  <div className="h-full w-[92%] bg-green-400"></div>
                </div>
              </div>
            </TiltCard>
          </FloatingElement>

          <h2 className="mb-6 text-4xl leading-tight font-bold">
            Run your service business on autopilot.
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-blue-100">
            Join thousands of business owners who save 20+ hours a week with our unified operations
            platform.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-blue-200">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`border-primary bg-muted/50 text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 bg-gradient-to-br from-gray-100 to-gray-300 text-xs font-bold`}
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Trusted by market leaders</span>
          </div>
        </div>

        {/* Decorative elements */}
        <FloatingElement className="absolute top-20 right-20" delay={1}>
          <div className="h-24 w-24 rounded-full border-4 border-white/10" />
        </FloatingElement>
        <FloatingElement className="absolute bottom-20 left-20" delay={2}>
          <div className="bg-background/5 h-16 w-16 rotate-12 rounded-xl backdrop-blur-sm" />
        </FloatingElement>
      </div>
    </div>
  );
}

/**
 *
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4">
          <Activity className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
