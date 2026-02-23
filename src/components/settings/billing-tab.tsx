"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Zap, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BillingStatus {
  subscription: {
    id: string;
    status: string;
    planKey: string;
    planName: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  limits: {
    voiceMinutes: number;
    smsMessages: number;
    bookings: number;
    contacts: number;
    phoneNumbers: number;
    staff: number;
  };
  usage: {
    voiceMinutes: number;
    smsMessages: number;
    bookings: number;
    contacts: number;
  };
}

const PLANS = [
  {
    key: "free",
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for trying out CareOps",
    features: ["Dashboard", "Basic Messaging", "Contact Forms", "1 Staff Member"],
    limits: { voiceMinutes: 0, smsMessages: 50, bookings: 50, contacts: 100, phoneNumbers: 0, staff: 1 },
    highlight: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: 1999,
    period: "month",
    description: "For growing businesses",
    features: ["Everything in Starter", "1 Phone Number", "Voice AI (200 min)", "Email Support", "3 Staff Members"],
    limits: { voiceMinutes: 200, smsMessages: 500, bookings: 500, contacts: 1000, phoneNumbers: 1, staff: 3 },
    highlight: true,
  },
  {
    key: "pro",
    name: "Professional",
    price: 4999,
    period: "month",
    description: "For established businesses",
    features: ["Everything in Growth", "3 Phone Numbers", "Voice AI (1000 min)", "Priority Support", "Analytics", "10 Staff Members"],
    limits: { voiceMinutes: 1000, smsMessages: 2000, bookings: 2000, contacts: 5000, phoneNumbers: 3, staff: 10 },
    highlight: false,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 14999,
    period: "month",
    description: "For large organizations",
    features: ["Everything in Pro", "Unlimited Numbers", "Unlimited Voice AI", "SLA", "Dedicated Support", "Custom Integrations"],
    limits: { voiceMinutes: -1, smsMessages: -1, bookings: -1, contacts: -1, phoneNumbers: -1, staff: -1 },
    highlight: false,
  },
];

/**
 *
 */
export function BillingTab() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    loadBillingStatus();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (typeof window !== "undefined" && !(window as unknown as { Razorpay?: unknown }).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  };

  const loadBillingStatus = async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setBillingStatus(data);
      }
    } catch (error) {
      console.error("Failed to load billing status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "free") {
      await handleDowngradeToFree();
      return;
    }

    setUpgrading(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.amount === 0) {
        toast({ title: "Plan Updated", description: "You've been switched to the free plan" });
        loadBillingStatus();
        return;
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "CareOps",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan Subscription`,
        prefill: data.prefill,
        theme: { color: "#2563eb" },
        handler: () => {
          toast({ title: "Payment Successful", description: "Your subscription has been activated" });
          loadBillingStatus();
        },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment Cancelled", description: "Your payment was cancelled", variant: "destructive" });
          },
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate checkout",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngradeToFree = async () => {
    setUpgrading("free");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: "free" }),
      });

      if (res.ok) {
        toast({ title: "Plan Updated", description: "You've been switched to the free plan" });
        loadBillingStatus();
      }
    } catch (_error) {
      toast({ title: "Error", description: "Failed to update plan", variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1 || limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };



  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const currentPlanKey = billingStatus?.subscription?.planKey || "free";
  const currentPlan = PLANS.find((p) => p.key === currentPlanKey);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription and usage details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{currentPlan?.name || "Starter"}</h3>
                <Badge variant={billingStatus?.subscription?.status === "active" ? "default" : "secondary"}>
                  {billingStatus?.subscription?.status || "active"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {currentPlan?.price === 0 ? "Free forever" : `${formatPrice(currentPlan?.price || 0)}/${currentPlan?.period}`}
              </p>
            </div>
            {currentPlanKey !== "enterprise" && (
              <Button onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voice Minutes</span>
                <span>
                  {billingStatus?.usage?.voiceMinutes || 0} / {billingStatus?.limits?.voiceMinutes === -1 ? "∞" : billingStatus?.limits?.voiceMinutes || 0}
                </span>
              </div>
              <Progress value={getUsagePercentage(billingStatus?.usage?.voiceMinutes || 0, billingStatus?.limits?.voiceMinutes || 0)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>SMS Messages</span>
                <span>
                  {billingStatus?.usage?.smsMessages || 0} / {billingStatus?.limits?.smsMessages === -1 ? "∞" : billingStatus?.limits?.smsMessages || 0}
                </span>
              </div>
              <Progress value={getUsagePercentage(billingStatus?.usage?.smsMessages || 0, billingStatus?.limits?.smsMessages || 0)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bookings</span>
                <span>
                  {billingStatus?.usage?.bookings || 0} / {billingStatus?.limits?.bookings === -1 ? "∞" : billingStatus?.limits?.bookings || 0}
                </span>
              </div>
              <Progress value={getUsagePercentage(billingStatus?.usage?.bookings || 0, billingStatus?.limits?.bookings || 0)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Contacts</span>
                <span>
                  {billingStatus?.usage?.contacts || 0} / {billingStatus?.limits?.contacts === -1 ? "∞" : billingStatus?.limits?.contacts || 0}
                </span>
              </div>
              <Progress value={getUsagePercentage(billingStatus?.usage?.contacts || 0, billingStatus?.limits?.contacts || 0)} className="h-2" />
            </div>
          </div>

          {billingStatus?.subscription?.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Subscription Cancelled</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your subscription will end at the current billing period.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div id="plans-section">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.key === currentPlanKey;
            const isDowngrade = PLANS.findIndex((p) => p.key === plan.key) < PLANS.findIndex((p) => p.key === currentPlanKey);

            return (
              <Card
                key={plan.key}
                className={`relative ${plan.highlight ? "border-primary ring-2 ring-primary/20" : ""} ${isCurrentPlan ? "bg-muted/50" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                    {plan.price > 0 && <span className="text-muted-foreground">/{plan.period}</span>}
                  </div>

                  <ul className="space-y-2 text-sm text-left mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={upgrading !== null || !razorpayLoaded}
                    >
                      {upgrading === plan.key ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isDowngrade ? (
                        "Downgrade"
                      ) : (
                        "Upgrade"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
