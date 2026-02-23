"use client";

import { Mail, MessageSquare, Calendar, ExternalLink, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceSettingsDTO } from "@/types/dto";
import { WebhooksSection } from "@/components/settings/webhooks-section";

interface IntegrationsTabProps {
  workspace: WorkspaceSettingsDTO | null;
  onTestEmail: () => void;
  onTestSms: () => void;
  onConnectCalendar: () => void;
  onDisconnectCalendar: () => void;
  testingEmail: boolean;
  testingSms: boolean;
  connectingCalendar: boolean;
  disconnectingCalendar: boolean;
}

/**
 *
 * @param root0
 * @param root0.workspace
 * @param root0.onTestEmail
 * @param root0.onTestSms
 * @param root0.onConnectCalendar
 * @param root0.onDisconnectCalendar
 * @param root0.testingEmail
 * @param root0.testingSms
 * @param root0.connectingCalendar
 * @param root0.disconnectingCalendar
 */
export function IntegrationsTab({
  workspace,
  onTestEmail,
  onTestSms,
  onConnectCalendar,
  onDisconnectCalendar,
  testingEmail,
  testingSms,
  connectingCalendar,
  disconnectingCalendar,
}: IntegrationsTabProps) {
  const calendarConnected = workspace?.googleCalendarConnected ?? false;

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure your email service for sending notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Mail className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Email Service</p>
                <p className="text-muted-foreground text-xs">
                  {workspace?.emailConfigured ? "Connected" : "Not configured"}
                </p>
              </div>
            </div>
            <Badge
              variant={workspace?.emailConfigured ? "default" : "secondary"}
              className={workspace?.emailConfigured ? "bg-green-600" : ""}
            >
              {workspace?.emailConfigured ? "Active" : "Inactive"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onTestEmail}
            disabled={testingEmail}
          >
            {testingEmail ? "Testing..." : "Test Email Connection"}
          </Button>
        </CardContent>
      </Card>

      {/* SMS Configuration (Twilio) */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Configuration (Twilio)</CardTitle>
          <CardDescription>Configure Twilio for SMS OTP and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Twilio SMS</p>
                <p className="text-muted-foreground text-xs">
                  {workspace?.smsConfigured ? "Connected" : "Not configured"}
                </p>
              </div>
            </div>
            <Badge
              variant={workspace?.smsConfigured ? "default" : "secondary"}
              className={workspace?.smsConfigured ? "bg-green-600" : ""}
            >
              {workspace?.smsConfigured ? "Active" : "Inactive"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onTestSms}
            disabled={testingSms}
          >
            {testingSms ? "Testing..." : "Test SMS Connection"}
          </Button>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Google Calendar</CardTitle>
            <Badge variant="secondary" className="text-primary/90 bg-blue-100 text-[10px]">
              NEW
            </Badge>
          </div>
          <CardDescription>
            Automatically sync bookings to Google Calendar for real-time visibility and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Google Calendar</p>
                <p className="text-primary text-xs">
                  {calendarConnected
                    ? `Connected as ${workspace?.googleCalendarEmail || "Google Account"}`
                    : "Not connected — click below to link your Google Calendar"}
                </p>
              </div>
            </div>
            <Badge
              variant={calendarConnected ? "default" : "secondary"}
              className={calendarConnected ? "bg-primary" : "bg-muted/30 text-muted-foreground"}
            >
              {calendarConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {/* Calendar capabilities */}
          <div className="text-muted-foreground grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="bg-muted/30 flex items-center gap-1.5 rounded p-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-muted/50"}`}
              />
              Auto-sync new bookings
            </div>
            <div className="bg-muted/30 flex items-center gap-1.5 rounded p-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-muted/50"}`}
              />
              Update on reschedule
            </div>
            <div className="bg-muted/30 flex items-center gap-1.5 rounded p-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-muted/50"}`}
              />
              Cancel on booking cancel
            </div>
            <div className="bg-muted/30 flex items-center gap-1.5 rounded p-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-muted/50"}`}
              />
              Calendar reminders
            </div>
          </div>

          {calendarConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDisconnectCalendar}
              disabled={disconnectingCalendar}
            >
              <Unplug className="mr-2 h-4 w-4" />
              {disconnectingCalendar ? "Disconnecting..." : "Disconnect Google Calendar"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="hover:text-primary/90 w-full border-blue-200 hover:bg-blue-50"
              onClick={onConnectCalendar}
              disabled={connectingCalendar}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {connectingCalendar ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Configuration */}
      <WebhooksSection />
    </div>
  );
}
