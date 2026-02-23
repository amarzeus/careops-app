"use client";

import { useState } from "react";
import { Edit2, Mail, Package, Save, Sparkles, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { InventoryItemDTO } from "@/types/dto";

interface InventoryListProps {
  items: InventoryItemDTO[];
  forecast: Record<string, { daysRemaining: number | string; confidence: string }>;
  onUpdateQuantity: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  onEdit: (item: InventoryItemDTO) => void;
  onNotifyVendor: (item: InventoryItemDTO) => void;
  deletingId: string | null;
}

/**
 *
 * @param root0
 * @param root0.items
 * @param root0.forecast
 * @param root0.onUpdateQuantity
 * @param root0.onDelete
 * @param root0.onEdit
 * @param root0.onNotifyVendor
 * @param root0.deletingId
 */
export function InventoryList({
  items,
  forecast,
  onUpdateQuantity,
  onDelete,
  onEdit,
  onNotifyVendor,
  deletingId,
}: InventoryListProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-background border-border/40 rounded-2xl border-2 border-dashed py-20 text-center italic transition-colors">
        <Package className="mx-auto mb-4 h-16 w-16 text-gray-200" />
        <h3 className="text-muted-foreground text-lg font-medium">Your inventory is empty</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Start tracking supplies to see AI forecasting in action.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isLow = item.quantity <= item.threshold;
        const itemForecast = forecast[item.name];
        const pct =
          item.threshold > 0 ? Math.min((item.quantity / (item.threshold * 3)) * 100, 100) : 100;

        return (
          <Card
            key={item.id}
            className={cn(
              "bg-background overflow-hidden border-0 shadow-sm transition-all hover:shadow-md",
              isLow && "ring-1 ring-red-100"
            )}
          >
            <CardContent className="p-0">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-bold">{item.name}</p>
                    {item.description && (
                      <p className="text-muted-foreground mt-1 truncate text-xs">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isLow && (
                      <Badge
                        variant="destructive"
                        className="h-5 animate-pulse px-1.5 text-[10px] font-bold tracking-tighter uppercase shadow-sm"
                      >
                        Critical
                      </Badge>
                    )}
                    {itemForecast && (
                      <div className="flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                        <Sparkles className="h-2.5 w-2.5" />
                        {itemForecast.daysRemaining} days left
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  {editId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        autoFocus
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="h-10 w-24 text-lg font-bold"
                      />
                      <Button
                        size="icon"
                        className="shrink-0 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          onUpdateQuantity(item.id, parseInt(editQty));
                          setEditId(null);
                        }}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setEditId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="group flex cursor-pointer items-baseline gap-1"
                      onClick={() => {
                        setEditId(item.id);
                        setEditQty(String(item.quantity));
                      }}
                    >
                      <span className="text-foreground text-3xl font-black tracking-tighter">
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium uppercase">
                        {item.unit}
                      </span>
                      <Edit2 className="text-muted-foreground ml-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex justify-between text-[10px] font-bold tracking-widest uppercase">
                    <span>Stock Level</span>
                    <span>Threshold: {item.threshold}</span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn("bg-muted/30 h-2", isLow && "[&>div]:bg-red-500")}
                  />
                </div>
              </div>

              <div className="bg-muted/30/50 flex items-center justify-between border-t border-gray-50 px-6 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase italic">
                    Vendor
                  </span>
                  <span className="text-muted-foreground max-w-[120px] truncate text-xs font-semibold">
                    {item.vendorName || "Not assigned"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isLow && item.vendorEmail && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-orange-200 px-2 text-[10px] text-orange-600 hover:bg-orange-50"
                      onClick={() => onNotifyVendor(item)}
                    >
                      <Mail className="h-3 w-3" /> Notify Vendor
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary h-8 px-2"
                    onClick={() => onEdit(item)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Dialog
                    open={deleteConfirmId === item.id}
                    onOpenChange={(open) => setDeleteConfirmId(open ? item.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Inventory Item</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete{" "}
                          <span className="font-semibold">&quot;{item.name}&quot;</span>? This
                          action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onDelete(item.id);
                            setDeleteConfirmId(null);
                          }}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
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
  );
}
