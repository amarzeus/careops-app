"use client";

import { Mail, MessageSquare, MessageCircle } from "lucide-react";
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

interface IntegrationsTabProps {
  workspace: WorkspaceSettingsDTO | null;
  onTestEmail: () => void;
  onTestSms: () => void;
  onTestWhatsApp: () => void;
  testingEmail: boolean;
  testingSms: boolean;
  testingWhatsApp: boolean;
}

export function IntegrationsTab({
  workspace,
  onTestEmail,
  onTestSms,
  onTestWhatsApp,
  testingEmail,
  testingSms,
  testingWhatsApp,
}: IntegrationsTabProps) {
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

      {/* SMS Configuration (MSG91) */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Configuration (MSG91)</CardTitle>
          <CardDescription>
            Configure MSG91 for SMS OTP and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">MSG91 SMS</p>
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

      {/* WhatsApp Configuration (MSG91) */}
      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>WhatsApp Integration (MSG91)</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
              NEW
            </Badge>
          </div>
          <CardDescription>
            Send OTP, booking confirmations, and reminders via WhatsApp for higher delivery rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">MSG91 WhatsApp</p>
                <p className="text-xs text-green-600">
                  {workspace?.whatsappConfigured ? "Connected & Active" : "Not configured — set MSG91_WHATSAPP_INTEGRATED_NUMBER"}
                </p>
              </div>
            </div>
            <Badge
              variant={workspace?.whatsappConfigured ? "default" : "secondary"}
              className={workspace?.whatsappConfigured ? "bg-green-600" : "bg-gray-100 text-gray-600"}
            >
              {workspace?.whatsappConfigured ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* WhatsApp capabilities list */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              OTP Verification
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Booking Confirmations
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Appointment Reminders
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Form Requests
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={onTestWhatsApp}
            disabled={testingWhatsApp}
          >
            {testingWhatsApp ? "Testing..." : "Test WhatsApp Connection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
