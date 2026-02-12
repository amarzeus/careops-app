"use client";

import React, { useEffect, useState } from "react";
import { Package, Plus, AlertTriangle, Edit2, Trash2, Save, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string; name: string; description: string; quantity: number; threshold: number; unit: string;
  vendorName: string; vendorEmail: string; vendorPhone: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [forecast, setForecast] = useState<Record<string, { daysRemaining: number | string; confidence: string }>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [newItem, setNewItem] = useState({ name: "", description: "", quantity: "0", threshold: "5", unit: "units", vendorName: "", vendorEmail: "", vendorPhone: "" });
  const [editDialogItem, setEditDialogItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", quantity: "", threshold: "", unit: "", vendorName: "", vendorEmail: "", vendorPhone: "" });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchForecast();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setItems((await res.json()).items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load inventory";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchForecast = async () => {
    try {
      const res = await fetch("/api/ai/inventory-forecast", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const forecastMap: Record<string, { daysRemaining: number | string; confidence: string }> = {};
        data.forecast.forEach((f: { name: string; daysRemaining: number | string; confidence: string }) => {
          forecastMap[f.name] = f;
        });
        setForecast(forecastMap);
      }
    } catch (error) {
      console.error("Forecast fetch error:", error);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createItem = async () => {
    if (!newItem.name) return;
    try {
      const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newItem, quantity: parseInt(newItem.quantity), threshold: parseInt(newItem.threshold) }) });
      if (!res.ok) throw new Error("Failed to create item");
      toast({ title: "Success", description: "Inventory item created", variant: "success" });
      setDialogOpen(false); setNewItem({ name: "", description: "", quantity: "0", threshold: "5", unit: "units", vendorName: "", vendorEmail: "", vendorPhone: "" }); fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const updateQuantity = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: parseInt(editQty) }) });
      if (!res.ok) throw new Error("Failed to update quantity");
      toast({ title: "Success", description: "Quantity updated", variant: "success" });
      setEditId(null); fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      toast({ title: "Success", description: "Item deleted", variant: "success" });
      setDeleteConfirmId(null);
      fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openEditItem = (item: InventoryItem) => {
    setEditForm({
      name: item.name,
      description: item.description || "",
      quantity: String(item.quantity),
      threshold: String(item.threshold),
      unit: item.unit || "units",
      vendorName: item.vendorName || "",
      vendorEmail: item.vendorEmail || "",
      vendorPhone: item.vendorPhone || "",
    });
    setEditDialogItem(item);
  };

  const saveEditItem = async () => {
    if (!editDialogItem || !editForm.name) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/inventory/${editDialogItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          quantity: parseInt(editForm.quantity),
          threshold: parseInt(editForm.threshold),
          unit: editForm.unit,
          vendorName: editForm.vendorName,
          vendorEmail: editForm.vendorEmail,
          vendorPhone: editForm.vendorPhone,
        }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      toast({ title: "Success", description: "Item updated", variant: "success" });
      setEditDialogItem(null);
      fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setEditSaving(false); }
  };

  const lowStockCount = items.filter(i => i.quantity <= i.threshold).length;

  return (
    <div>
      <Header title="Inventory" subtitle={`${items.length} items tracked${lowStockCount > 0 ? ` | ${lowStockCount} low stock` : ""}`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Item</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle><DialogDescription>Track resources used in your business.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2"><Label>Item Name *</Label><Input placeholder="Surgical Gloves" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" value={newItem.threshold} onChange={e => setNewItem(p => ({ ...p, threshold: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Unit</Label><Input placeholder="boxes" value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Description</Label><Input placeholder="Size L, latex-free" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Vendor (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Vendor Name</Label><Input value={newItem.vendorName} onChange={e => setNewItem(p => ({ ...p, vendorName: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Vendor Email</Label><Input type="email" value={newItem.vendorEmail} onChange={e => setNewItem(p => ({ ...p, vendorEmail: e.target.value }))} /></div>
                </div>
              </div>
              <Button onClick={createItem} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">Create Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>
      <div className="p-6">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 italic transition-colors">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">Your inventory is empty</h3>
            <p className="text-sm text-gray-400 mt-1">Start tracking supplies to see AI forecasting in action.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => {
              const isLow = item.quantity <= item.threshold;
              const itemForecast = forecast[item.name];
              const pct = item.threshold > 0 ? Math.min((item.quantity / (item.threshold * 3)) * 100, 100) : 100;

              return (
                <Card key={item.id} className={cn("transition-all hover:shadow-md border-0 bg-white shadow-sm overflow-hidden", isLow && "ring-1 ring-red-100")}>
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isLow && <Badge variant="destructive" className="animate-pulse shadow-sm text-[10px] font-bold px-1.5 h-5 uppercase tracking-tighter">Critical</Badge>}
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
                            <Input type="number" autoFocus value={editQty} onChange={e => setEditQty(e.target.value)} className="h-10 w-24 text-lg font-bold" />
                            <Button size="icon" className="bg-green-600 hover:bg-green-700 shrink-0" onClick={() => updateQuantity(item.id)}><Save className="w-4 h-4" /></Button>
                            <Button variant="outline" size="icon" className="shrink-0" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1 cursor-pointer group" onClick={() => { setEditId(item.id); setEditQty(String(item.quantity)); }}>
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">{item.quantity}</span>
                            <span className="text-sm font-medium text-gray-500 uppercase">{item.unit}</span>
                            <Edit2 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-400">
                          <span>Stock Level</span>
                          <span>Threshold: {item.threshold}</span>
                        </div>
                        <Progress value={pct} className={cn("h-2 bg-gray-100", isLow && "[&>div]:bg-red-500")} />
                      </div>
                    </div>

                      <div className="px-6 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">Vendor</span>
                          <span className="text-xs font-semibold text-gray-600 truncate max-w-[120px]">{item.vendorName || "Not assigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600 h-8 px-2" onClick={() => openEditItem(item)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Dialog open={deleteConfirmId === item.id} onOpenChange={open => setDeleteConfirmId(open ? item.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-8 px-2">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Inventory Item</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold">&quot;{item.name}&quot;</span>? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2">
                              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                              <Button variant="destructive" onClick={() => deleteItem(item.id)}>Delete</Button>
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
        )}
      </div>

      {/* Full Edit Dialog */}
      <Dialog open={!!editDialogItem} onOpenChange={open => { if (!open) setEditDialogItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update all fields for this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Item Name *</Label><Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" value={editForm.threshold} onChange={e => setEditForm(p => ({ ...p, threshold: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Unit</Label><Input value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Vendor</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={editForm.vendorName} onChange={e => setEditForm(p => ({ ...p, vendorName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.vendorEmail} onChange={e => setEditForm(p => ({ ...p, vendorEmail: e.target.value }))} /></div>
                <div className="space-y-2 col-span-2"><Label>Phone</Label><Input value={editForm.vendorPhone} onChange={e => setEditForm(p => ({ ...p, vendorPhone: e.target.value }))} /></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEditItem} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditDialogItem(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
