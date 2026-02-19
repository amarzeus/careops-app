"use client";

import { Mail, MessageSquare, Calendar, ExternalLink, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <CardDescription>
            Configure your email service for sending notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Email Service</p>
                <p className="text-xs text-gray-500">
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
          <CardDescription>
            Configure Twilio for SMS OTP and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Twilio SMS</p>
                <p className="text-xs text-gray-500">
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
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
              NEW
            </Badge>
          </div>
          <CardDescription>
            Automatically sync bookings to Google Calendar for real-time visibility and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Google Calendar</p>
                <p className="text-xs text-blue-600">
                  {calendarConnected
                    ? `Connected as ${workspace?.googleCalendarEmail || "Google Account"}`
                    : "Not connected — click below to link your Google Calendar"}
                </p>
              </div>
            </div>
            <Badge
              variant={calendarConnected ? "default" : "secondary"}
              className={calendarConnected ? "bg-blue-600" : "bg-gray-100 text-gray-600"}
            >
              {calendarConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {/* Calendar capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-gray-300"}`} />
              Auto-sync new bookings
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-gray-300"}`} />
              Update on reschedule
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-gray-300"}`} />
              Cancel on booking cancel
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${calendarConnected ? "bg-blue-500" : "bg-gray-300"}`} />
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
              <Unplug className="w-4 h-4 mr-2" />
              {disconnectingCalendar ? "Disconnecting..." : "Disconnect Google Calendar"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={onConnectCalendar}
              disabled={connectingCalendar}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
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
