"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, MessageSquare, Mic, AlertTriangle, Package, Settings, Loader2, Check, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

interface AIPreferencesTabProps {
  onSelectTab?: (tab: string) => void;
}

export function AIPreferencesTab({ onSelectTab }: AIPreferencesTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<AIPreferences | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/ai/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch AI preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof AIPreferences, value: boolean | string) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
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
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({ title: "Success", description: "AI preferences saved", variant: "default" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8 text-gray-500">
        Failed to load AI preferences
      </div>
    );
  }

  const features = [
    {
      key: "smartReplyEnabled",
      title: "Smart Replies",
      description: "AI-generated reply suggestions in inbox",
      icon: MessageSquare,
      color: "violet",
      enabled: preferences.smartReplyEnabled,
    },
    {
      key: "insightsEnabled",
      title: "Dashboard Insights",
      description: "AI-powered business insights on dashboard",
      icon: Sparkles,
      color: "amber",
      enabled: preferences.insightsEnabled,
    },
    {
      key: "autoClassifyEnabled",
      title: "Intent Classification",
      description: "Auto-classify message intent (urgent, complaint, inquiry...)",
      icon: Brain,
      color: "blue",
      enabled: preferences.autoClassifyEnabled,
    },
    {
      key: "voiceEnabled",
      title: "Voice AI",
      description: "Enable AI voice assistant for phone calls",
      icon: Mic,
      color: "emerald",
      enabled: preferences.voiceEnabled,
    },
    {
      key: "anomalyDetectionEnabled",
      title: "Anomaly Detection",
      description: "Detect unusual patterns in operations",
      icon: AlertTriangle,
      color: "red",
      enabled: preferences.anomalyDetectionEnabled,
    },
    {
      key: "inventoryForecastEnabled",
      title: "Inventory Forecasting",
      description: "Predict stock depletion and recommend reordering",
      icon: Package,
      color: "cyan",
      enabled: preferences.inventoryForecastEnabled,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          AI Features
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure which AI features are enabled for your workspace
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.key} className={cn(
            "transition-all",
            feature.enabled && `border-${feature.color}-200 bg-${feature.color}-50/30`
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    feature.enabled 
                      ? `bg-${feature.color}-100 text-${feature.color}-600` 
                      : "bg-gray-100 text-gray-400"
                  )}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={feature.enabled}
                  onCheckedChange={(checked) => updatePreference(feature.key as keyof AIPreferences, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Advanced Settings
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Default Reply Tone</Label>
            <Select 
              value={preferences.defaultReplyTone} 
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
            <Label className="text-sm">AI Model</Label>
            <Select 
              value={preferences.geminiModel} 
              onValueChange={(v) => updatePreference("geminiModel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Daily Insight Time</Label>
            <Select 
              value={preferences.dailyInsightTime || "09:00"} 
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

          <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <Switch
              checked={preferences.alertOnAnomaly}
              onCheckedChange={(checked) => updatePreference("alertOnAnomaly", checked)}
              id="alertOnAnomaly"
            />
            <Label htmlFor="alertOnAnomaly" className="cursor-pointer">
              <p className="text-sm font-medium">Alert on Anomaly</p>
              <p className="text-xs text-gray-500">Get notified when operations anomalies are detected</p>
            </Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <Check className="w-4 h-4 mr-2" />
          ) : null}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>
        
        {!preferences.insightsEnabled && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Zap className="w-3 h-3 mr-1" />
            Insights disabled
          </Badge>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Some features require API configuration. Make sure Gemini and VAPI keys are set in your environment variables.
        </p>
      </div>
    </div>
  );
}
