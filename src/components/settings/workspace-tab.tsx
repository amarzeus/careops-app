"use client";

import { CheckCircle, Globe, Link2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSettingsDTO } from "@/types/dto";

interface WorkspaceTabProps {
  workspace: WorkspaceSettingsDTO | null;
  onUpdate: (data: Partial<WorkspaceSettingsDTO>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  copyToClipboard: (text: string, key: string) => void;
  copied: string;
  bookingUrl: string;
  contactFormUrl: string;
}

const workspaceStatusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ONBOARDING: {
    label: "Onboarding",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  ACTIVE: {
    label: "Active",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  INACTIVE: {
    label: "Inactive",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300",
  },
};

export function WorkspaceTab({
  workspace,
  onUpdate,
  onSave,
  saving,
  saved,
  copyToClipboard,
  copied,
  bookingUrl,
  contactFormUrl,
}: WorkspaceTabProps) {
  const statusConfig =
    workspaceStatusConfig[workspace?.status || "ONBOARDING"] ||
    workspaceStatusConfig.ONBOARDING;

  return (
    <div className="space-y-6">
      {/* Workspace status badge */}
      <div
        className={`flex items-center gap-3 p-4 border rounded-lg ${statusConfig.bgColor}`}
      >
        <Globe className={`w-5 h-5 ${statusConfig.color}`} />
        <div>
          <p className={`text-sm font-medium ${statusConfig.color}`}>
            Workspace Status: {statusConfig.label}
          </p>
          <p className="text-xs text-gray-500">
            {workspace?.status === "ONBOARDING" &&
              "Complete your setup to activate your workspace"}
            {workspace?.status === "ACTIVE" &&
              "Your workspace is live and accepting customers"}
            {workspace?.status === "INACTIVE" &&
              "Your workspace is currently paused"}
            {!workspace?.status &&
              "Complete your setup to activate your workspace"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>Manage your business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={workspace?.name || ""}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={workspace?.timezone || ""}
                onChange={(e) => onUpdate({ timezone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={workspace?.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                value={workspace?.contactEmail || ""}
                onChange={(e) => onUpdate({ contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                value={workspace?.contactPhone || ""}
                onChange={(e) => onUpdate({ contactPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex justify-between items-center px-6 py-4">
          <div className="text-xs text-gray-500">
            Public links will use this info
          </div>
          <Button onClick={onSave} disabled={saving}>
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Public Links */}
      <Card>
        <CardHeader>
          <CardTitle>Public Links</CardTitle>
          <CardDescription>
            Share these links with your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600">Booking Page</p>
              <code className="text-xs text-gray-500 truncate block">
                {bookingUrl}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(bookingUrl, "booking")}
            >
              {copied === "booking" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600">Contact Form</p>
              <code className="text-xs text-gray-500 truncate block">
                {contactFormUrl}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(contactFormUrl, "contact")}
            >
              {copied === "contact" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
