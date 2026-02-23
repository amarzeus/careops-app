"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryItemDTO } from "@/types/dto";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemDTO | null; // null for create, object for edit
  onSave: (data: Partial<InventoryItemDTO>) => Promise<void>;
}

/**
 *
 * @param root0
 * @param root0.open
 * @param root0.onOpenChange
 * @param root0.item
 * @param root0.onSave
 */
export function InventoryDialog({ open, onOpenChange, item, onSave }: InventoryDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantity: "0",
    threshold: "5",
    unit: "units",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description || "",
        quantity: String(item.quantity),
        threshold: String(item.threshold),
        unit: item.unit || "units",
        vendorName: item.vendorName || "",
        vendorEmail: item.vendorEmail || "",
        vendorPhone: item.vendorPhone || "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        quantity: "0",
        threshold: "5",
        unit: "units",
        vendorName: "",
        vendorEmail: "",
        vendorPhone: "",
      });
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        quantity: parseInt(form.quantity),
        threshold: parseInt(form.threshold),
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update item details below." : "Track new resources used in your business."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Item Name *</Label>
              <Input
                placeholder="Surgical Gloves"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                value={form.threshold}
                onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="boxes"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Size L, latex-free"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="text-muted-foreground text-sm font-medium">Vendor (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input
                  value={form.vendorName}
                  onChange={(e) => setForm((p) => ({ ...p, vendorName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor Email</Label>
                <Input
                  type="email"
                  value={form.vendorEmail}
                  onChange={(e) => setForm((p) => ({ ...p, vendorEmail: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Vendor Phone</Label>
                <Input
                  value={form.vendorPhone}
                  onChange={(e) => setForm((p) => ({ ...p, vendorPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 w-full font-bold"
            disabled={saving}
          >
            {saving ? "Saving..." : item ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
