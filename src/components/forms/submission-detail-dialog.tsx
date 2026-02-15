"use client";

import { AlertTriangle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSubmissionDTO } from "@/types/dto";

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: FormSubmissionDTO | null;
  onUpdateStatus: (id: string, status: string) => void;
  onResend: (id: string) => void;
}

/**
 *
 * @param root0
 * @param root0.open
 * @param root0.onOpenChange
 * @param root0.submission
 * @param root0.onUpdateStatus
 * @param root0.onResend
 */
export function SubmissionDetailDialog({
  open,
  onOpenChange,
  submission,
  onUpdateStatus,
  onResend,
}: SubmissionDetailDialogProps) {
  if (!submission) return null;

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "SENT":
        return <Badge variant="secondary">Sent</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>
            View submission information and manage its status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {statusBadge(submission.status)}
            <p className="text-xs text-gray-400">
              Submitted {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Contact</p>
              <p className="font-medium text-sm">
                {submission.contact?.name || "Unknown"}
              </p>
              {submission.contact?.email && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {submission.contact.email}
                </p>
              )}
              {submission.contact?.phone && (
                <p className="text-xs text-gray-500">
                  {submission.contact.phone}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Form</p>
              <p className="font-medium text-sm">
                {submission.intakeForm?.name || "Contact Form"}
              </p>
            </div>
          </div>

          {submission.data && Object.keys(submission.data).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Submission Data</p>
              <div className="bg-gray-50 rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(submission.data).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                    </p>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            {(submission.status === "PENDING" ||
              submission.status === "SENT") && (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600"
                onClick={() => onResend(submission.id)}
              >
                <Send className="w-3 h-3 mr-1" /> Re-send Form
              </Button>
            )}
            {submission.status !== "COMPLETED" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onUpdateStatus(submission.id, "COMPLETED");
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Mark Completed
              </Button>
            )}
            {submission.status !== "OVERDUE" &&
              submission.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => {
                    onUpdateStatus(submission.id, "OVERDUE");
                    onOpenChange(false);
                  }}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" /> Mark Overdue
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
