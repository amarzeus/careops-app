"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  Bot,
  CheckCircle,
  Circle,
  ArrowRight,
  Loader2,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { EnhancedNumberSelector } from "@/components/voice/enhanced-number-selector";
import { AgentCustomizer } from "@/components/voice/agent-customizer";
import { toast } from "@/hooks/use-toast";

interface SubscriptionStatus {
  subscription: {
    planKey: string;
    planName: string;
    status: string;
  };
  limits: {
    voiceMinutes: number;
    phoneNumbers: number;
  };
  usage: {
    voiceMinutes: number;
  };
}

const STEPS = [
  { id: "plan", title: "Check Plan", description: "Verify your subscription" },
  { id: "agent", title: "Create Agent", description: "Configure your AI assistant" },
  { id: "number", title: "Get Number", description: "Select a phone number" },
  { id: "complete", title: "Complete", description: "Start receiving calls" },
];

/**
 *
 */
export default function VoiceSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [provisionedNumber, setProvisionedNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);

        if (data.limits.phoneNumbers === 0) {
          setCurrentStep(0);
        } else {
          setCurrentStep(1);
        }
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load subscription status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedWithPlan = () => {
    if (!subscriptionStatus) return false;
    const { planKey } = subscriptionStatus.subscription;
    return planKey !== "free";
  };

  const handleAgentCreated = (agentId: string) => {
    setCreatedAgentId(agentId);
    setCurrentStep(2);
  };

  const handleNumberSelected = (phoneNumber: string) => {
    setProvisionedNumber(phoneNumber);
    setCurrentStep(3);
  };

  const handleFinish = () => {
    router.push("/voice");
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "plan":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan Check
              </CardTitle>
              <CardDescription>Voice features require a paid subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionStatus && (
                <>
                  <div className="bg-muted flex items-center justify-between rounded-lg p-4">
                    <div>
                      <p className="font-medium">{subscriptionStatus.subscription.planName}</p>
                      <p className="text-muted-foreground text-sm">Current Plan</p>
                    </div>
                    <Badge variant={canProceedWithPlan() ? "default" : "secondary"}>
                      {subscriptionStatus.subscription.planKey.toUpperCase()}
                    </Badge>
                  </div>

                  {canProceedWithPlan() ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your plan includes{" "}
                        {subscriptionStatus.limits.phoneNumbers === -1
                          ? "unlimited"
                          : subscriptionStatus.limits.phoneNumbers}{" "}
                        phone number(s).
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your current plan doesn&apos;t include phone numbers. Please upgrade to
                        Growth or higher to use voice features.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => router.push("/settings?tab=billing")}>
                      View Plans
                    </Button>
                    {canProceedWithPlan() && (
                      <Button onClick={() => setCurrentStep(1)}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case "agent":
        return (
          <div className="space-y-4">
            <AgentCustomizer
              workspaceId=""
              onAgentCreated={handleAgentCreated}
              onCancel={() => setCurrentStep(0)}
            />
          </div>
        );

      case "number":
        return (
          <div className="space-y-4">
            <EnhancedNumberSelector
              agentId={createdAgentId || undefined}
              onNumberSelected={handleNumberSelected}
              onCancel={() => setCurrentStep(1)}
            />
          </div>
        );

      case "complete":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Setup Complete!
              </CardTitle>
              <CardDescription>Your voice agent is ready to receive calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">Voice Agent</span>
                  </div>
                  <p className="text-muted-foreground text-sm">AI-powered call handling</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-medium">Phone Number</span>
                  </div>
                  <p className="font-mono">{provisionedNumber}</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your voice agent will answer calls 24/7. You can customize its behavior in Voice
                  Settings.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => router.push("/voice/agents")}>
                  Manage Agents
                </Button>
                <Button onClick={handleFinish}>
                  Go to Voice Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Setup</h1>
        <p className="text-muted-foreground">Set up your AI voice agent and phone number</p>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className="mt-1 text-xs font-medium">{step.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mx-2 h-1 w-16 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Progress value={(currentStep / (STEPS.length - 1)) * 100} />

      {renderStepContent()}
    </div>
  );
}
