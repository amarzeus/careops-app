
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    key: "free",
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Perfect for trying out CareOps",
    features: [
      "Dashboard access",
      "Basic messaging (50 SMS/month)",
      "Contact forms",
      "1 staff member",
    ],
    highlight: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: 1999,
    period: "month",
    description: "For growing businesses",
    features: [
      "Everything in Starter",
      "1 phone number",
      "200 voice minutes/month",
      "500 SMS/month",
      "Email support",
      "3 staff members",
    ],
    highlight: true,
  },
  {
    key: "pro",
    name: "Professional",
    price: 4999,
    period: "month",
    description: "For established businesses",
    features: [
      "Everything in Growth",
      "3 phone numbers",
      "1000 voice minutes/month",
      "2000 SMS/month",
      "Priority support",
      "Analytics dashboard",
      "10 staff members",
    ],
    highlight: false,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 14999,
    period: "month",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited phone numbers",
      "Unlimited voice minutes",
      "Unlimited SMS",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
    ],
    highlight: false,
  },
];

/**
 *
 */
function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 *
 */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header title="Pricing" subtitle="Choose the plan that's right for your business" />

      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground mt-4">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`relative ${plan.highlight ? "border-primary ring-2 ring-primary/20" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 text-left mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.price === 0 ? "Get Started Free" : "Get Started"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include 14-day free trial. Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact our sales team
            </Link>
            {"."}
          </p>
        </div>
      </div>
    </div>
  );
}
