/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Plus, Users, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import { StaffList } from "@/components/staff/staff-list";
import { InviteStaffDialog } from "@/components/staff/invite-staff-dialog";
import { StaffScheduleEditor } from "@/components/staff/schedule-editor";
import { StaffMemberDTO } from "@/types/dto";

type Tab = "team" | "schedules";

/**
 * Staff management page with Team and Schedules tabs
 */
export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("team");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaff(data.staff);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Could not load staff list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (data: any) => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite staff");
      }

      toast({
        title: "Success",
        description: "Staff member invited successfully",
      });
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite staff",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      toast({ title: "Success", description: "Staff member removed" });
      fetchStaff();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Could not remove staff member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Team & Permissions" subtitle="Manage staff access and schedules">
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 h-9 gap-2 text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Staff</span>
        </Button>
      </Header>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 sm:p-6">
        {/* Tab Switcher */}
        <div className="bg-muted/30 flex gap-1 rounded-lg border p-1">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "team"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Team
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "schedules"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            Schedules
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "team" && (
          <>
            {loading ? (
              <div>Loading team...</div>
            ) : (
              <StaffList
                staff={staff}
                onEdit={(_member) => {
                  toast({
                    title: "Info",
                    description: "Edit functionality coming soon",
                  });
                }}
                onDelete={handleDelete}
                onToggleRole={(_id) => {
                  toast({
                    title: "Info",
                    description: "Role management coming soon",
                  });
                }}
              />
            )}
          </>
        )}

        {activeTab === "schedules" && (
          <div className="space-y-6">
            {loading ? (
              <div>Loading team...</div>
            ) : staff.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
                No staff members yet. Add team members first.
              </div>
            ) : (
              staff.map((member) => (
                <div key={member.id} className="bg-card rounded-xl border p-4 shadow-sm">
                  <StaffScheduleEditor userId={member.id} userName={member.name} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <InviteStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleInvite} />
    </div>
  );
}
