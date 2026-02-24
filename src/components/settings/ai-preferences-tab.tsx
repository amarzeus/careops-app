"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  Sparkles,
  Brain,
  MessageSquare,
  Mic,
  AlertTriangle,
  Package,
  Settings,
  Loader2,
  Check,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIPreferences {
  id: string;
  workspaceId: string;
  smartReplyEnabled: boolean;
  insightsEnabled: boolean;
  voiceEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  inventoryForecastEnabled: boolean;
  autoClassifyEnabled: boolean;
  defaultReplyTone: string;
  alertOnAnomaly: boolean;
  dailyInsightTime: string | null;
  geminiModel: string;
  voiceModel: string;
}

const DEFAULT_AI_PREFERENCES: AIPreferences = {
  id: "",
  workspaceId: "",
  smartReplyEnabled: true,
  insightsEnabled: true,
  voiceEnabled: false,
  anomalyDetectionEnabled: false,
  inventoryForecastEnabled: false,
  autoClassifyEnabled: true,
  defaultReplyTone: "professional",
  alertOnAnomaly: true,
  dailyInsightTime: "09:00",
  geminiModel: "gemini-2.5-flash-lite",
  voiceModel: "gemini-2.5-flash-native-audio",
};

/**
 *
 * @param root0
 * @param root0._onSelectTab
 */
export function AIPreferencesTab({ _onSelectTab }: { _onSelectTab?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<AIPreferences | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || DEFAULT_AI_PREFERENCES);
        setError(null);
      } else {
        console.log("Using default AI preferences");
        setPreferences(DEFAULT_AI_PREFERENCES);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch AI preferences:", err);
      setPreferences(DEFAULT_AI_PREFERENCES);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = (key: keyof AIPreferences, value: boolean | string) => {
    setPreferences((prev) =>
      prev ? { ...prev, [key]: value } : { ...DEFAULT_AI_PREFERENCES, [key]: value }
    );
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smartReplyEnabled: preferences.smartReplyEnabled,
          insightsEnabled: preferences.insightsEnabled,
          voiceEnabled: preferences.voiceEnabled,
          anomalyDetectionEnabled: preferences.anomalyDetectionEnabled,
          inventoryForecastEnabled: preferences.inventoryForecastEnabled,
          autoClassifyEnabled: preferences.autoClassifyEnabled,
          defaultReplyTone: preferences.defaultReplyTone,
          alertOnAnomaly: preferences.alertOnAnomaly,
          dailyInsightTime: preferences.dailyInsightTime,
          geminiModel: preferences.geminiModel,
          voiceModel: preferences.voiceModel,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({ title: "Success", description: "AI preferences saved", variant: "default" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_err) {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-2">Loading AI settings...</span>
      </div>
    );
  }

  const prefs = preferences || DEFAULT_AI_PREFERENCES;

  const features = [
    {
      key: "smartReplyEnabled",
      title: "Smart Replies",
      description: "AI-generated reply suggestions in inbox",
      icon: MessageSquare,
      color: "violet",
      enabled: prefs.smartReplyEnabled,
    },
    {
      key: "insightsEnabled",
      title: "Dashboard Insights",
      description: "AI-powered business insights on dashboard",
      icon: Sparkles,
      color: "amber",
      enabled: prefs.insightsEnabled,
    },
    {
      key: "autoClassifyEnabled",
      title: "Intent Classification",
      description: "Auto-classify message intent (urgent, complaint, inquiry...)",
      icon: Brain,
      color: "blue",
      enabled: prefs.autoClassifyEnabled,
    },
    {
      key: "voiceEnabled",
      title: "CareOps AI",
      description: "Enable AI voice assistant for phone calls",
      icon: Mic,
      color: "emerald",
      enabled: prefs.voiceEnabled,
    },
    {
      key: "anomalyDetectionEnabled",
      title: "Anomaly Detection",
      description: "Detect unusual patterns in operations",
      icon: AlertTriangle,
      color: "red",
      enabled: prefs.anomalyDetectionEnabled,
    },
    {
      key: "inventoryForecastEnabled",
      title: "Inventory Forecasting",
      description: "Predict stock depletion and recommend reordering",
      icon: Package,
      color: "cyan",
      enabled: prefs.inventoryForecastEnabled,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-violet-600" />
          AI Features
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure which AI features are enabled for your workspace
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card
            key={feature.key}
            className={cn(
              "transition-all",
              feature.enabled && `border-${feature.color}-200 bg-${feature.color}-50/30`
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      feature.enabled
                        ? `bg-${feature.color}-100 text-${feature.color}-600`
                        : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-muted-foreground text-xs">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={feature.enabled}
                  onCheckedChange={(checked) =>
                    updatePreference(feature.key as keyof AIPreferences, checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-4 flex items-center gap-2 font-medium">
          <Settings className="h-4 w-4" />
          Advanced Settings
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Default Reply Tone</Label>
            <Select
              value={prefs.defaultReplyTone}
              onValueChange={(v) => updatePreference("defaultReplyTone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">AI Assistant Chat Model</Label>
            <Select
              value={prefs.geminiModel}
              onValueChange={(v) => updatePreference("geminiModel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash-lite">
                  Gemini 2.5 Flash-Lite (Cheapest)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">AI Assistant Voice Model</Label>
            <Select
              value={prefs.voiceModel}
              onValueChange={(v) => updatePreference("voiceModel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash-native-audio">
                  Gemini 2.5 Flash Native Audio Dialog
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Daily Insight Time</Label>
            <Select
              value={prefs.dailyInsightTime || "09:00"}
              onValueChange={(v) => updatePreference("dailyInsightTime", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00">6:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={prefs.alertOnAnomaly}
              onCheckedChange={(checked) => updatePreference("alertOnAnomaly", checked)}
              id="alertOnAnomaly"
            />
            <Label htmlFor="alertOnAnomaly" className="cursor-pointer">
              <p className="text-sm font-medium">Alert on Anomaly</p>
              <p className="text-muted-foreground text-xs">
                Get notified when operations anomalies are detected
              </p>
            </Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : null}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>

        {!prefs.insightsEnabled && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            <Zap className="mr-1 h-3 w-3" />
            Insights disabled
          </Badge>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Some features require API configuration. Make sure Gemini and VAPI
          keys are set in your environment variables.
        </p>
      </div>
    </div>
  );
}
