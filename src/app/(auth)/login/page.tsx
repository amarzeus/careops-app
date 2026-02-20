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
    <div className="min-h-screen w-full flex bg-background overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <GradientOrb className="w-[800px] h-[800px] bg-blue-400/20 -top-[200px] -left-[200px]" delay={0} />
        <GradientOrb className="w-[600px] h-[600px] bg-purple-400/20 bottom-0 right-0" delay={2} />
      </div>

      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
              <Logo variant="full" size={40} />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to manage your operations and bookings.
            </p>
          </div>

          <Card className="border-border/40 shadow-xl shadow-border/50 backdrop-blur-sm bg-background/80">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <Activity className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-background hover:bg-muted/30 text-muted-foreground border-border/40 shadow-sm transition-all hover:-translate-y-0.5"
                    onClick={() => window.location.href = "/api/auth/google"}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-border/40"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted-foreground uppercase">Or sign in with email</span>
                    <div className="flex-grow border-t border-border/40"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@work.com"
                        className="h-11 bg-muted/30 border-border/40 focus:bg-background transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                        <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-11 bg-muted/30 border-border/40 focus:bg-background transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-spin" /> Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Start your free trial
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-muted/30 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />

        <div className="relative z-10 max-w-7xl text-white p-12">
          <FloatingElement delay={0}>
            <TiltCard className="mb-8">
              <div className="bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center text-green-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">System Operational</div>
                    <div className="text-blue-100 text-sm">All services running smoothly</div>
                  </div>
                </div>
                <div className="h-2 bg-background/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 w-[92%]"></div>
                </div>
              </div>
            </TiltCard>
          </FloatingElement>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Run your service business on autopilot.
          </h2>
          <p className="text-lg text-blue-100 mb-8 leading-relaxed">
            Join thousands of business owners who save 20+ hours a week with our unified operations platform.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-blue-200">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-indigo-600 bg-muted/50 flex items-center justify-center text-xs text-muted-foreground font-bold bg-gradient-to-br from-gray-100 to-gray-300`}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Trusted by market leaders</span>
          </div>
        </div>

        {/* Decorative elements */}
        <FloatingElement className="absolute top-20 right-20" delay={1}>
          <div className="w-24 h-24 rounded-full border-4 border-white/10" />
        </FloatingElement>
        <FloatingElement className="absolute bottom-20 left-20" delay={2}>
          <div className="w-16 h-16 rounded-xl bg-background/5 rotate-12 backdrop-blur-sm" />
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Activity className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

