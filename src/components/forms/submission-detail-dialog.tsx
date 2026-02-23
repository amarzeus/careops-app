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
        return (
          <Badge variant="default" className="bg-green-600">
            Completed
          </Badge>
        );
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>View submission information and manage its status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {statusBadge(submission.status)}
            <p className="text-muted-foreground text-xs">
              Submitted {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Contact</p>
              <p className="text-sm font-medium">{submission.contact?.name || "Unknown"}</p>
              {submission.contact?.email && (
                <p className="text-muted-foreground mt-0.5 text-xs">{submission.contact.email}</p>
              )}
              {submission.contact?.phone && (
                <p className="text-muted-foreground text-xs">{submission.contact.phone}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Form</p>
              <p className="text-sm font-medium">{submission.intakeForm?.name || "Contact Form"}</p>
            </div>
          </div>

          {submission.data && Object.keys(submission.data).length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Submission Data</p>
              <div className="bg-muted/30 max-h-60 space-y-2 overflow-y-auto rounded-md p-3">
                {Object.entries(submission.data).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-muted-foreground text-xs font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                    </p>
                    <p className="text-sm">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t pt-2">
            {(submission.status === "PENDING" || submission.status === "SENT") && (
              <Button
                size="sm"
                variant="outline"
                className="text-primary"
                onClick={() => onResend(submission.id)}
              >
                <Send className="mr-1 h-3 w-3" /> Re-send Form
              </Button>
            )}
            {submission.status !== "COMPLETED" && (
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => {
                  onUpdateStatus(submission.id, "COMPLETED");
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="mr-1 h-3 w-3" /> Mark Completed
              </Button>
            )}
            {submission.status !== "OVERDUE" && submission.status !== "COMPLETED" && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => {
                  onUpdateStatus(submission.id, "OVERDUE");
                  onOpenChange(false);
                }}
              >
                <AlertTriangle className="mr-1 h-3 w-3" /> Mark Overdue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
