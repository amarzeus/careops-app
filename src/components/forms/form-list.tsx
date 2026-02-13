"use client";

import { CheckCircle, Copy, ExternalLink, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react";
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
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-1">No {type} forms yet</p>
        <p className="text-xs text-gray-400 mb-4">
          Create a {type} form to start collecting data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {forms.map((form) => (
        <Card key={form.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{form.name}</p>
              {type === "contact" ? (
                <p className="text-xs text-gray-500 mt-1">Slug: {form.slug}</p>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  {(form as IntakeFormDTO).service && (
                    <Badge variant="secondary">
                      {(form as IntakeFormDTO).service?.name}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {(form as IntakeFormDTO)._count?.submissions || 0} submissions
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={form.isActive ? "default" : "secondary"}>
                {form.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(form.id, form.isActive)}
                title={form.isActive ? "Deactivate form" : "Activate form"}
              >
                {form.isActive ? (
                  <ToggleRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(form.slug, type === "contact" ? "contact" : "form")}
              >
                {copied === form.slug ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied === form.slug ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `/${type === "contact" ? "contact" : "form"}/${form.slug}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={deleting === form.id}
                onClick={() => {
                  if (confirm("Are you sure you want to delete this form?"))
                    onDelete(form.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
