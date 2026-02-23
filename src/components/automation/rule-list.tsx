"use client";

import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Package,
  Pencil,
  PlayCircle,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AutomationRuleDTO } from "@/types/dto";

interface RuleListProps {
  rules: AutomationRuleDTO[];
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (rule: AutomationRuleDTO) => void;
  onTest: (id: string) => void;
  deletingId: string | null;
  testingId: string | null;
}

const triggerConfig: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bgColor: string }
> = {
  NEW_CONTACT: {
    label: "New Contact",
    icon: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  BOOKING_CREATED: {
    label: "Booking Created",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-blue-50",
  },
  BEFORE_BOOKING: {
    label: "Before Booking",
    icon: Calendar,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  FORM_PENDING: {
    label: "Form Pending",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  INVENTORY_LOW: {
    label: "Inventory Low",
    icon: Package,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  STAFF_REPLY: {
    label: "Staff Reply",
    icon: MessageSquare,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
  },
};

const triggerDescriptions: Record<string, string> = {
  NEW_CONTACT: "Fires when a new contact submits the contact form",
  BOOKING_CREATED: "Fires when a new booking is created",
  BEFORE_BOOKING: "Fires 24 hours before a scheduled booking",
  FORM_PENDING: "Fires when a form remains incomplete",
  INVENTORY_LOW: "Fires when an item drops below its threshold",
  STAFF_REPLY: "Fires when a staff member manually replies, pausing automation",
};

/**
 *
 */
function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 *
 * @param root0
 * @param root0.rules
 * @param root0.onToggle
 * @param root0.onDelete
 * @param root0.onEdit
 * @param root0.onTest
 * @param root0.deletingId
 * @param root0.testingId
 */
export function RuleList({
  rules,
  onToggle,
  onDelete,
  onEdit,
  onTest,
  deletingId,
  testingId,
}: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="py-20 text-center">
        <Zap className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h3 className="text-muted-foreground text-lg font-medium">No automation rules</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create rules to automate your workflows
        </p>
      </div>
    );
  }

  // Group rules by trigger type
  const groupedRules = rules.reduce<Record<string, AutomationRuleDTO[]>>((acc, rule) => {
    const trigger = rule.trigger || "OTHER";
    if (!acc[trigger]) acc[trigger] = [];
    acc[trigger].push(rule);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedRules).map(([trigger, triggerRules]) => {
        const config = triggerConfig[trigger] || triggerConfig.NEW_CONTACT;
        const GroupIcon = config.icon;
        return (
          <div key={trigger}>
            {/* Group header */}
            <div className="mb-3 flex items-center gap-2">
              <GroupIcon className={`h-4 w-4 ${config.color}`} />
              <h3 className="text-muted-foreground text-sm font-semibold">{config.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {triggerRules.length}
              </Badge>
              <p className="text-muted-foreground ml-2 text-xs">{triggerDescriptions[trigger]}</p>
            </div>

            <div className="space-y-3">
              {triggerRules.map((rule) => {
                const ruleConfig = triggerConfig[rule.trigger] || triggerConfig.NEW_CONTACT;
                const Icon = ruleConfig.icon;
                return (
                  <Card key={rule.id}>
                    <CardContent className="py-4">
                      {/* Flow card: trigger -> action */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 ${ruleConfig.bgColor} flex items-center justify-center rounded-lg`}
                        >
                          <Icon className={`h-5 w-5 ${ruleConfig.color}`} />
                        </div>
                        <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <Mail className="text-primary h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{rule.name}</p>
                            <Badge
                              variant={rule.isActive ? "default" : "secondary"}
                              className={rule.isActive ? "bg-green-600" : ""}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {rule.messageTemplate && (
                            <p className="text-muted-foreground mt-1 max-w-md truncate text-xs">
                              {rule.messageTemplate}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3">
                            {rule.delayMinutes > 0 && (
                              <span className="text-muted-foreground text-[10px]">
                                Delay: {rule.delayMinutes} min
                              </span>
                            )}
                            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                              <Clock className="h-3 w-3" />
                              Last triggered: {getRelativeTime(rule.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onEdit(rule)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onTest(rule.id)}
                            disabled={testingId === rule.id}
                          >
                            <PlayCircle className="mr-1 h-3.5 w-3.5" />
                            {testingId === rule.id ? "Tested" : "Test"}
                          </Button>
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(v) => onToggle(rule.id, v)}
                          />

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Automation Rule</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete{" "}
                                  <span className="font-semibold">&quot;{rule.name}&quot;</span>?
                                  This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              {/* DialogClose wraps Cancel to close the uncontrolled Dialog */}
                              <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => onDelete(rule.id)}
                                  disabled={deletingId === rule.id}
                                >
                                  {deletingId === rule.id ? "Deleting..." : "Delete Rule"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
