/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import { StaffList } from "@/components/staff/staff-list";
import { InviteStaffDialog } from "@/components/staff/invite-staff-dialog";
import { StaffMemberDTO } from "@/types/dto";

/**
 * Staff management page for workspace owners
 */
export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      <Header title="Team & Permissions" subtitle="Manage staff access to CareOps">
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
      </div>

      <InviteStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleInvite} />
    </div>
  );
}
