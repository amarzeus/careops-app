"use client";

import { AlertTriangle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormSubmissionDTO } from "@/types/dto";

interface SubmissionListProps {
  submissions: FormSubmissionDTO[];
  onSelect: (sub: FormSubmissionDTO) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onResend: (id: string) => void;
}

/**
 *
 * @param root0
 * @param root0.submissions
 * @param root0.onSelect
 * @param root0.onUpdateStatus
 * @param root0.onResend
 */
export function SubmissionList({
  submissions,
  onSelect,
  onUpdateStatus,
  onResend,
}: SubmissionListProps) {
  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>; // yellow/warning usually
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
    <div className="mt-4 space-y-3">
      {submissions.map((sub) => (
        <Card
          key={sub.id}
          className="cursor-pointer transition-shadow hover:shadow-sm"
          onClick={() => onSelect(sub)}
        >
          <CardContent className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{sub.contact?.name || "Unknown"}</p>
              <p className="text-muted-foreground truncate text-xs">
                {sub.intakeForm?.name || "Contact Form"} |{" "}
                {new Date(sub.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-1 sm:gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {(sub.status === "PENDING" || sub.status === "SENT") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/90 h-8"
                  onClick={() => onResend(sub.id)}
                  title="Re-send form"
                >
                  <Send className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">Resend</span>
                </Button>
              )}
              {sub.status !== "COMPLETED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-green-600 hover:text-green-700"
                  onClick={() => onUpdateStatus(sub.id, "COMPLETED")}
                  title="Mark as completed"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
              {sub.status !== "OVERDUE" && sub.status !== "COMPLETED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-500 hover:text-red-700"
                  onClick={() => onUpdateStatus(sub.id, "OVERDUE")}
                  title="Mark as overdue"
                >
                  <AlertTriangle className="h-3 w-3" />
                </Button>
              )}
              {statusBadge(sub.status)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
