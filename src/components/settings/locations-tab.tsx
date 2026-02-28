import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Location {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  isActive: boolean;
}

/**
 * Settings Location Tab component
 */
export function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to load locations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          name: "",
          address: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setIsDialogOpen(false);
        fetchLocations();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create location");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Basic toggle endpoint logic would go here. For now we will just assume
    // It's a placeholder until the user updates `api/locations/[id]/route.ts`.
    alert(`Toggle location ${id} to ${!currentStatus} requested`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground text-sm">
            Manage your business locations and branches.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Downtown Clinic"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">Create Location</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-8 text-center">Loading...</div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No locations yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              Add your first branch or clinic location to start managing operations across multiple
              sites.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="group space-y-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      {loc.name}
                      {loc.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                          Inactive
                        </span>
                      )}
                    </h3>
                    {loc.address && (
                      <p className="text-muted-foreground flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {loc.address}
                      </p>
                    )}
                    <p className="text-muted-foreground flex items-center text-sm">
                      <Clock className="mr-1 h-3 w-3" />
                      {loc.timezone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground -mt-2 -mr-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleToggleStatus(loc.id, loc.isActive)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
