"use client";

import { CheckCircle, Save } from "lucide-react";
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
import { UserProfileDTO } from "@/types/dto";

interface ProfileTabProps {
  user: UserProfileDTO | null;
  onUpdate: (data: Partial<UserProfileDTO>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  loading?: boolean;
  error?: string | null;
}

/**
 *
 * @param root0
 * @param root0.user
 * @param root0.onUpdate
 * @param root0.onSave
 * @param root0.saving
 * @param root0.saved
 * @param root0.loading
 * @param root0.error
 */
export function ProfileTab({
  user,
  onUpdate,
  onSave,
  saving,
  saved,
  loading,
  error,
}: ProfileTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input disabled placeholder="Loading..." />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input disabled placeholder="Loading..." />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input disabled placeholder="Loading..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No profile data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={user?.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-muted/30"
            />
            <p className="text-[10px] text-muted-foreground">
              Email cannot be changed securely at this time.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={user?.phone || ""}
              onChange={(e) => onUpdate({ phone: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4">
          <Button onClick={onSave} disabled={saving} className="w-full sm:w-auto">
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
                Save Profile
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Session info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>Your active login session information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">Active Session</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Role: {user?.role || "OWNER"}
                </p>
                <p className="text-xs text-muted-foreground">Logged in now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
