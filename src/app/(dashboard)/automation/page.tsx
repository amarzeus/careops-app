"use client";

import React, { useEffect, useState } from "react";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import { RuleList } from "@/components/automation/rule-list";
import { RuleDialog } from "@/components/automation/rule-dialog";
import { AutomationRuleDTO } from "@/types/dto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 *
 */
export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRuleDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRuleDTO | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/automation");
      if (res.ok) setRules((await res.json()).rules);
    } catch (_error) {
      toast({ title: "Error", description: "Failed to load rules", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<AutomationRuleDTO>) => {
    try {
      let res;
      if (selectedRule) {
        res = await fetch(`/api/automation/${selectedRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) throw new Error("Operation failed");
      toast({ title: "Success", description: "Rule saved", variant: "default" });
      fetchRules();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save rule", variant: "destructive" });
      throw error;
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/automation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      fetchRules();
    } catch (_error) {
      toast({ title: "Error", description: "Failed to toggle rule", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/automation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      toast({ title: "Success", description: "Rule deleted", variant: "default" });
      fetchRules();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Delete rule error:", error);
      toast({ title: "Error", description: "Failed to delete rule", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/automation/${id}/test`, { method: "POST" });
      if (!res.ok) throw new Error("Test failed");
      toast({ title: "Success", description: "Rule tested", variant: "default" });
    } catch (_error) {
      toast({ title: "Error", description: "Test failed", variant: "destructive" });
    } finally {
      setTimeout(() => setTestingId(null), 2000);
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.length - activeCount;

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Automation" subtitle="Event-based rules that work for you">
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 h-9 gap-2 text-white"
          onClick={() => {
            setSelectedRule(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Rule
        </Button>
      </Header>

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        {!loading && rules.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2 sm:px-4">
              <Zap className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm font-medium">
                {rules.length} rule{rules.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 sm:px-4">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">{activeCount} active</span>
            </div>
            <div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2 sm:px-4">
              <div className="bg-muted h-2 w-2 rounded-full" />
              <span className="text-muted-foreground text-sm font-medium">
                {inactiveCount} inactive
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted/30 h-20 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <RuleList
            rules={rules}
            onToggle={handleToggle}
            onDelete={(id) => setDeleteConfirmId(id)}
            onEdit={(rule) => {
              setSelectedRule(rule);
              setDialogOpen(true);
            }}
            onTest={handleTest}
            deletingId={deleting ? deleteConfirmId : null}
            testingId={testingId}
          />
        )}
      </div>

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={selectedRule}
        onSave={handleSave}
      />

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
