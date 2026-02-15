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
      <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 italic transition-colors">
        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400">
          Your inventory is empty
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Start tracking supplies to see AI forecasting in action.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const isLow = item.quantity <= item.threshold;
        const itemForecast = forecast[item.name];
        const pct =
          item.threshold > 0
            ? Math.min((item.quantity / (item.threshold * 3)) * 100, 100)
            : 100;

        return (
          <Card
            key={item.id}
            className={cn(
              "transition-all hover:shadow-md border-0 bg-white shadow-sm overflow-hidden",
              isLow && "ring-1 ring-red-100"
            )}
          >
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isLow && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse shadow-sm text-[10px] font-bold px-1.5 h-5 uppercase tracking-tighter"
                      >
                        Critical
                      </Badge>
                    )}
                    {itemForecast && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        <Sparkles className="w-2.5 h-2.5" />
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
                        className="bg-green-600 hover:bg-green-700 shrink-0"
                        onClick={() => {
                          onUpdateQuantity(item.id, parseInt(editQty));
                          setEditId(null);
                        }}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setEditId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-baseline gap-1 cursor-pointer group"
                      onClick={() => {
                        setEditId(item.id);
                        setEditQty(String(item.quantity));
                      }}
                    >
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">
                        {item.quantity}
                      </span>
                      <span className="text-sm font-medium text-gray-500 uppercase">
                        {item.unit}
                      </span>
                      <Edit2 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-400">
                    <span>Stock Level</span>
                    <span>Threshold: {item.threshold}</span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn(
                      "h-2 bg-gray-100",
                      isLow && "[&>div]:bg-red-500"
                    )}
                  />
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">
                    Vendor
                  </span>
                  <span className="text-xs font-semibold text-gray-600 truncate max-w-[120px]">
                    {item.vendorName || "Not assigned"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isLow && item.vendorEmail && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 h-8 px-2 text-[10px] gap-1"
                      onClick={() => onNotifyVendor(item)}
                    >
                      <Mail className="w-3 h-3" /> Notify Vendor
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-blue-600 h-8 px-2"
                    onClick={() => onEdit(item)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Dialog
                    open={deleteConfirmId === item.id}
                    onOpenChange={(open) =>
                      setDeleteConfirmId(open ? item.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Inventory Item</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete{" "}
                          <span className="font-semibold">
                            &quot;{item.name}&quot;
                          </span>
                          ? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDeleteConfirmId(null)}
                        >
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
