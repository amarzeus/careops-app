"use client";

import React, { useEffect, useState } from "react";
import { Package, Plus, AlertTriangle, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string; name: string; description: string; quantity: number; threshold: number; unit: string;
  vendorName: string; vendorEmail: string; vendorPhone: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [newItem, setNewItem] = useState({ name: "", description: "", quantity: "0", threshold: "5", unit: "units", vendorName: "", vendorEmail: "", vendorPhone: "" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setItems((await res.json()).items);
    } catch {} finally { setLoading(false); }
  };

  const createItem = async () => {
    if (!newItem.name) return;
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newItem, quantity: parseInt(newItem.quantity), threshold: parseInt(newItem.threshold) }) });
    setDialogOpen(false); setNewItem({ name: "", description: "", quantity: "0", threshold: "5", unit: "units", vendorName: "", vendorEmail: "", vendorPhone: "" }); fetchItems();
  };

  const updateQuantity = async (id: string) => {
    await fetch(`/api/inventory/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: parseInt(editQty) }) });
    setEditId(null); fetchItems();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const lowStockCount = items.filter(i => i.quantity <= i.threshold).length;

  return (
    <div>
      <Header title="Inventory" subtitle={`${items.length} items tracked${lowStockCount > 0 ? ` | ${lowStockCount} low stock` : ""}`}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Item</Button></DialogTrigger>
          <DialogContent>
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
              <Button onClick={createItem} className="w-full bg-blue-600 hover:bg-blue-700">Add Item</Button>
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
          <div className="text-center py-20"><Package className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-500">No inventory items</h3><p className="text-sm text-gray-400 mt-1">Add items to start tracking your resources</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const isLow = item.quantity <= item.threshold;
              const pct = item.threshold > 0 ? Math.min((item.quantity / (item.threshold * 3)) * 100, 100) : 100;
              return (
                <Card key={item.id} className={cn(isLow && "border-red-200 bg-red-50/30")}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      </div>
                      {isLow && <Badge variant="destructive" className="shrink-0"><AlertTriangle className="w-3 h-3 mr-1" />Low</Badge>}
                    </div>
                    <div className="mb-3">
                      {editId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="h-8 w-20" />
                          <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id)}><Save className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => { setEditId(item.id); setEditQty(String(item.quantity)); }}>
                          <span className="text-2xl font-bold">{item.quantity}</span>
                          <span className="text-sm text-gray-500">{item.unit}</span>
                          <Edit2 className="w-3 h-3 text-gray-400 ml-1" />
                        </div>
                      )}
                    </div>
                    <Progress value={pct} className={cn("h-1.5", isLow && "[&>div]:bg-red-500")} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">Threshold: {item.threshold} {item.unit}</span>
                      <Button variant="ghost" size="sm" className="text-red-500 h-6 px-2" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {item.vendorName && <p className="text-xs text-gray-400 mt-2">Vendor: {item.vendorName}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
