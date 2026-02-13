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
    color: "text-blue-600",
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
    color: "text-gray-600",
    bgColor: "bg-gray-100",
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
      <div className="text-center py-20">
        <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500">
          No automation rules
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Create rules to automate your workflows
        </p>
      </div>
    );
  }

  // Group rules by trigger type
  const groupedRules = rules.reduce<Record<string, AutomationRuleDTO[]>>(
    (acc, rule) => {
      const trigger = rule.trigger || "OTHER";
      if (!acc[trigger]) acc[trigger] = [];
      acc[trigger].push(rule);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedRules).map(([trigger, triggerRules]) => {
        const config = triggerConfig[trigger] || triggerConfig.NEW_CONTACT;
        const GroupIcon = config.icon;
        return (
          <div key={trigger}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-3">
              <GroupIcon className={`w-4 h-4 ${config.color}`} />
              <h3 className="text-sm font-semibold text-gray-600">
                {config.label}
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                {triggerRules.length}
              </Badge>
              <p className="text-xs text-gray-400 ml-2">
                {triggerDescriptions[trigger]}
              </p>
            </div>

            <div className="space-y-3">
              {triggerRules.map((rule) => {
                const ruleConfig =
                  triggerConfig[rule.trigger] || triggerConfig.NEW_CONTACT;
                const Icon = ruleConfig.icon;
                return (
                  <Card key={rule.id}>
                    <CardContent className="py-4">
                      {/* Flow card: trigger -> action */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 ${ruleConfig.bgColor} rounded-lg flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${ruleConfig.color}`} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
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
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                              {rule.messageTemplate}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {rule.delayMinutes > 0 && (
                              <span className="text-[10px] text-gray-400">
                                Delay: {rule.delayMinutes} min
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Clock className="w-3 h-3" />
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
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onTest(rule.id)}
                            disabled={testingId === rule.id}
                          >
                            <PlayCircle className="w-3.5 h-3.5 mr-1" />
                            {testingId === rule.id ? "Tested" : "Test"}
                          </Button>
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(v) => onToggle(rule.id, v)}
                          />

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Automation Rule</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete{" "}
                                  <span className="font-semibold">
                                    &quot;{rule.name}&quot;
                                  </span>
                                  ? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2">
                                {/* Note: We handle closing in parent usually, or use state. 
                                    Ideally we'd bubble up the intent to open dialog. 
                                    For simplicity, we'll assume the parent handles `deletingId` state 
                                    and we just trigger onDelete here directly or show confirmation.
                                    Actually, the original implementation had a state for the dialog ID.
                                    Here we are inside a map. A single dialog controlled by parent is better.
                                    But to match the prop interface `onDelete`, we'll just fire it. 
                                    The parent should show confirmation or we assume confirmation happened. 
                                    
                                    Wait, I put the Dialog INSIDE the map in the original code. 
                                    Here I am putting DialogContent inside too. 
                                    The issue is `open` control. 
                                    I'll change this to just a Button that triggers `onDelete` (which should open a confirmation in parent) 
                                    OR make this `RuleList` accept a `setDeleteId` prop to open a shared dialog.
                                    
                                    Let's stick to the pattern: `onDelete` triggers the action.
                                    BUT `onDelete` in parent does the actual API call. 
                                    So we need a confirmation step.
                                    I will move the confirmation dialog logic to the parent (Page) and just have a delete button here.
                                */}
                                <Button
                                  variant="destructive"
                                  onClick={() => onDelete(rule.id)}
                                  disabled={deletingId === rule.id}
                                >
                                  {deletingId === rule.id
                                    ? "Deleting..."
                                    : "Delete Rule"}
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
