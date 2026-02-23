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

const workspaceStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
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
    color: "text-muted-foreground",
    bgColor: "bg-muted/30 border-border/40",
  },
};

/**
 *
 * @param root0
 * @param root0.workspace
 * @param root0.onUpdate
 * @param root0.onSave
 * @param root0.saving
 * @param root0.saved
 * @param root0.copyToClipboard
 * @param root0.copied
 * @param root0.bookingUrl
 * @param root0.contactFormUrl
 */
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
    workspaceStatusConfig[workspace?.status || "ONBOARDING"] || workspaceStatusConfig.ONBOARDING;

  return (
    <div className="space-y-6">
      {/* Workspace status badge */}
      <div className={`flex items-center gap-3 rounded-lg border p-4 ${statusConfig.bgColor}`}>
        <Globe className={`h-5 w-5 ${statusConfig.color}`} />
        <div>
          <p className={`text-sm font-medium ${statusConfig.color}`}>
            Workspace Status: {statusConfig.label}
          </p>
          <p className="text-muted-foreground text-xs">
            {workspace?.status === "ONBOARDING" && "Complete your setup to activate your workspace"}
            {workspace?.status === "ACTIVE" && "Your workspace is live and accepting customers"}
            {workspace?.status === "INACTIVE" && "Your workspace is currently paused"}
            {!workspace?.status && "Complete your setup to activate your workspace"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>Manage your business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <CardFooter className="bg-muted/30 flex items-center justify-between border-t px-6 py-4">
          <div className="text-muted-foreground text-xs">Public links will use this info</div>
          <Button onClick={onSave} disabled={saving}>
            {saved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
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
          <CardDescription>Share these links with your customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
            <Link2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium">Booking Page</p>
              <code className="text-muted-foreground block truncate text-xs">{bookingUrl}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(bookingUrl, "booking")}
            >
              {copied === "booking" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
            <Link2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium">Contact Form</p>
              <code className="text-muted-foreground block truncate text-xs">{contactFormUrl}</code>
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
