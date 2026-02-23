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
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3 mt-4">
      {submissions.map((sub) => (
        <Card
          key={sub.id}
          className="cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => onSelect(sub)}
        >
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {sub.contact?.name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {sub.intakeForm?.name || "Contact Form"} |{" "}
                {new Date(sub.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div
              className="flex items-center gap-1 sm:gap-2 flex-wrap"
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
                  <Send className="w-3 h-3 mr-1" /> <span className="hidden sm:inline">Resend</span>
                </Button>
              )}
              {sub.status !== "COMPLETED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 h-8"
                  onClick={() => onUpdateStatus(sub.id, "COMPLETED")}
                  title="Mark as completed"
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              )}
              {sub.status !== "OVERDUE" && sub.status !== "COMPLETED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 h-8"
                  onClick={() => onUpdateStatus(sub.id, "OVERDUE")}
                  title="Mark as overdue"
                >
                  <AlertTriangle className="w-3 h-3" />
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
