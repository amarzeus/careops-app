"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { toast } from "@/hooks/use-toast";
import { InventoryList } from "@/components/inventory/inventory-list";
import { InventoryDialog } from "@/components/inventory/inventory-dialog";
import { InventoryItemDTO } from "@/types/dto";

/**
 *
 */
export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItemDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItemDTO | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Mock forecast for now until we have an AI endpoint
    const [forecast, setForecast] = useState<Record<string, { daysRemaining: number; confidence: string }>>({});

    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch("/api/inventory");
            if (!res.ok) throw new Error("Failed to fetch inventory");
            const data = await res.json();
            setItems(data.items);

            // AI Forecast
            try {
                const forecastRes = await fetch("/api/ai/inventory-forecast", { method: "POST" });
                if (forecastRes.ok) {
                    const fData = await forecastRes.json();
                    const forecastMap: Record<string, { daysRemaining: number; confidence: string }> = {};
                    fData.forecast.forEach((f: any) => {
                        forecastMap[f.name] = { daysRemaining: f.daysRemaining, confidence: f.confidence };
                    });
                    setForecast(forecastMap);
                }
            } catch (err) {
                console.error("AI Forecast failed", err);
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not load inventory", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanning(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(",")[1];
                const mimeType = file.type;

                const res = await fetch("/api/ai/inventory/scan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64, mimeType }),
                });

                if (!res.ok) throw new Error("Scan failed");

                const { data } = await res.json();
                if (data && data.items && data.items.length > 0) {
                    const firstItem = data.items[0];
                    const newItem: InventoryItemDTO = {
                        id: "", // New item
                        name: firstItem.name,
                        description: `Imported from invoice ${data.invoiceNumber || ""}`,
                        quantity: firstItem.quantity,
                        threshold: 5, // Default
                        unit: "units", // Default or inferred
                        vendorName: data.vendor || "",
                        vendorEmail: "",
                        vendorPhone: "",
                    };

                    setSelectedItem(newItem);
                    setDialogOpen(true);

                    toast({
                        title: "Scan Complete",
                        description: `Found ${data.items.length} items. Opening the first one for review.`,
                    });
                } else {
                    toast({ title: "No Items Found", description: "Could not identify inventory items in the image." });
                }
            };
        } catch (error) {
            console.error(error);
            toast({ title: "Scan Error", description: "Failed to process invoice image.", variant: "destructive" });
        } finally {
            setScanning(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            const payload = {
                ...data,
                quantity: parseInt(data.quantity),
                threshold: parseInt(data.threshold),
            };

            let res;
            if (selectedItem && selectedItem.id) {
                res = await fetch("/api/inventory", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, id: selectedItem.id }),
                });
            } else {
                res = await fetch("/api/inventory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) throw new Error("Operation failed");

            toast({
                title: "Success",
                description: `Item ${selectedItem && selectedItem.id ? "updated" : "created"} successfully`
            });
            setDialogOpen(false);
            fetchItems();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");

            toast({ title: "Deleted", description: "Item removed from inventory" });
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdateQuantity = async (id: string, newQty: number) => {
        try {
            const res = await fetch("/api/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, quantity: newQty }),
            });
            if (!res.ok) throw new Error("Failed to update");

            toast({ title: "Updated", description: "Quantity updated" });
            fetchItems();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
        }
    };

    const handleNotifyVendor = (item: InventoryItemDTO) => {
        // Placeholder for email integration
        toast({ title: "Email Sent", description: `Order request sent to ${item.vendorName}` });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.vendorName && item.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full">
            <Header title="Inventory" subtitle="Track supplies and automate reordering">
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="invoice-upload"
                            onChange={handleScan}
                            disabled={scanning}
                        />
                        <Button variant="outline" onClick={() => document.getElementById("invoice-upload")?.click()} disabled={scanning}>
                            {scanning ? "Scanning..." : "Scan Invoice"}
                        </Button>
                    </div>
                    <Button onClick={() => { setSelectedItem(undefined); setDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                </div>
            </Header>

            <div className="flex-1 p-6 space-y-6">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search inventory..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <InventoryList
                        items={filteredItems}
                        forecast={forecast}
                        onUpdateQuantity={handleUpdateQuantity}
                        onDelete={handleDelete}
                        onEdit={(item) => { setSelectedItem(item); setDialogOpen(true); }}
                        onNotifyVendor={handleNotifyVendor}
                        deletingId={deletingId}
                    />
                )}
            </div>

            <InventoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleCreateOrUpdate}
                item={selectedItem ?? null}
            />
        </div>
    );
}
