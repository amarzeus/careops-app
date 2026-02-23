"use client";

import {
  CheckCircle,
  Copy,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactFormDTO, IntakeFormDTO } from "@/types/dto";

interface FormListProps {
  forms: (ContactFormDTO | IntakeFormDTO)[];
  type: "contact" | "intake";
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  copied: string;
  onCopy: (slug: string, type: string) => void;
  deleting: string;
}

/**
 *
 * @param root0
 * @param root0.forms
 * @param root0.type
 * @param root0.onToggle
 * @param root0.onDelete
 * @param root0.copied
 * @param root0.onCopy
 * @param root0.deleting
 */
export function FormList({
  forms,
  type,
  onToggle,
  onDelete,
  copied,
  onCopy,
  deleting,
}: FormListProps) {
  if (forms.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
        <p className="text-muted-foreground mb-1">No {type} forms yet</p>
        <p className="text-muted-foreground mb-4 text-xs">
          Create a {type} form to start collecting data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {forms.map((form) => (
        <Card key={form.id}>
          <CardContent className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{form.name}</p>
              {type === "contact" ? (
                <p className="text-muted-foreground mt-1 text-xs">Slug: {form.slug}</p>
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {(form as IntakeFormDTO).service && (
                    <Badge variant="secondary">{(form as IntakeFormDTO).service?.name}</Badge>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {(form as IntakeFormDTO)._count?.submissions || 0} submissions
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
              <Badge
                variant={form.isActive ? "default" : "secondary"}
                className="whitespace-nowrap"
              >
                {form.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(form.id, form.isActive)}
                title={form.isActive ? "Deactivate form" : "Activate form"}
              >
                {form.isActive ? (
                  <ToggleRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ToggleLeft className="text-muted-foreground h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(form.slug, type === "contact" ? "contact" : "form")}
                className="whitespace-nowrap"
              >
                {copied === form.slug ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <Copy className="mr-1 h-3 w-3" />
                )}
                {copied === form.slug ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(`/${type === "contact" ? "contact" : "form"}/${form.slug}`, "_blank")
                }
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                disabled={deleting === form.id}
                onClick={() => {
                  if (confirm("Are you sure you want to delete this form?")) onDelete(form.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
