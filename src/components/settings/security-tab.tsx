"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  onChangePassword: () => void;
  changingPassword: boolean;
  passwordMessage: { type: string; text: string };
  onDeleteAccount: () => void;
  isDeleting: boolean;
  deleteConfirmation: string;
  setDeleteConfirmation: (v: string) => void;
}

/**
 *
 * @param root0
 * @param root0.currentPassword
 * @param root0.setCurrentPassword
 * @param root0.newPassword
 * @param root0.setNewPassword
 * @param root0.onChangePassword
 * @param root0.changingPassword
 * @param root0.passwordMessage
 * @param root0.onDeleteAccount
 * @param root0.isDeleting
 * @param root0.deleteConfirmation
 * @param root0.setDeleteConfirmation
 */
export function SecurityTab({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  onChangePassword,
  changingPassword,
  passwordMessage,
  onDeleteAccount,
  isDeleting,
  deleteConfirmation,
  setDeleteConfirmation,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {passwordMessage.text && (
            <div
              className={`text-sm ${
                passwordMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t flex justify-end px-6 py-4">
          <Button
            onClick={onChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword}
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone - enhanced */}
      <Card className="border-red-300 shadow-sm">
        <CardHeader className="bg-red-50 border-b border-red-200 rounded-t-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-500">
            These actions are irreversible. Please proceed with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-2 border-red-200 bg-red-50 rounded-lg gap-4">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data including
                contacts, bookings, forms, and automation rules. This cannot be
                undone.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="shrink-0 w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700">
                    <p className="font-medium mb-1">
                      The following data will be permanently deleted:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>All contacts and conversation history</li>
                      <li>All bookings and calendar data</li>
                      <li>All forms and submissions</li>
                      <li>All automation rules</li>
                      <li>All staff accounts under this workspace</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4 py-4">
                  <Label>
                    Type <span className="font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={onDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Deletion"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
