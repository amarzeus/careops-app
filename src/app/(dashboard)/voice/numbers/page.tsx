"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Plus,
  MoreVertical,
  Trash2,
  Bot,
  Loader2,
  ArrowRight,
  Link2,
  Unlink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EnhancedNumberSelector } from "@/components/voice/enhanced-number-selector";

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  label: string | null;
  vapiPhoneId: string | null;
  isActive: boolean;
  forwardToStaff: boolean;
  forwardNumber: string | null;
  voiceAgentId: string | null;
  createdAt: string;
  voiceAgent: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

interface VoiceAgent {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 *
 */
export default function PhoneNumbersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const preselectedAgentId = searchParams.get("agentId");

  useEffect(() => {
    fetchNumbers();
    fetchAgents();
  }, []);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voice/numbers");
      if (res.ok) {
        const data = await res.json();
        setNumbers(data);
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/voice/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || data);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  };

  const handleReassign = async (numberId: string) => {
    if (!selectedAgent) {
      toast({
        title: "Error",
        description: "Please select an agent",
        variant: "destructive",
      });
      return;
    }

    setUpdating(numberId);
    try {
      const res = await fetch(`/api/voice/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAgentId: selectedAgent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reassign number");
      }

      toast({
        title: "Number Reassigned",
        description: "Phone number has been assigned to the new agent",
      });

      setReassignDialogOpen(null);
      fetchNumbers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reassign number",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUnassign = async (numberId: string) => {
    setUpdating(numberId);
    try {
      const res = await fetch(`/api/voice/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAgentId: null }),
      });

      if (!res.ok) throw new Error("Failed to unassign number");

      toast({
        title: "Number Unassigned",
        description: "Phone number is no longer linked to an agent",
      });

      fetchNumbers();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to unassign number",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (number: PhoneNumber) => {
    if (!confirm(`Delete ${number.phoneNumber}? This cannot be undone.`)) return;

    setDeleting(number.id);
    try {
      const res = await fetch(`/api/voice/numbers/${number.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete number");

      toast({
        title: "Number Deleted",
        description: `${number.phoneNumber} has been removed`,
      });

      fetchNumbers();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete phone number",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleNumberAdded = (phoneNumber: string) => {
    setAddDialogOpen(false);
    fetchNumbers();
    toast({
      title: "Number Added",
      description: `${phoneNumber} has been added to your workspace`,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        title="Phone Numbers"
        subtitle="Manage your voice phone numbers"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned Numbers</CardTitle>
            <CardDescription>
              Phone numbers linked to your voice agents
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Phone Number</DialogTitle>
                <DialogDescription>
                  Search and provision a new phone number for your workspace
                </DialogDescription>
              </DialogHeader>
              <EnhancedNumberSelector
                agentId={preselectedAgentId || undefined}
                onNumberSelected={handleNumberAdded}
                onCancel={() => setAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No phone numbers yet</p>
              <p className="text-sm">Add a phone number to start receiving calls</p>
              <Button className="mt-4" onClick={() => router.push("/voice/setup")}>
                Start Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Voice Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{number.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {number.label || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {number.voiceAgent ? (
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>{number.voiceAgent.name}</span>
                          {!number.voiceAgent.isActive && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={number.isActive ? "default" : "secondary"}>
                        {number.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(number.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Dialog
                            open={reassignDialogOpen === number.id}
                            onOpenChange={(open) => setReassignDialogOpen(open ? number.id : null)}
                          >
                            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                              <button className="w-full flex items-center px-2 py-1.5 text-sm">
                                <Link2 className="mr-2 h-4 w-4" />
                                Assign to Agent
                              </button>
                            </DropdownMenuItem>
                          </Dialog>

                          {number.voiceAgent && (
                            <DropdownMenuItem
                              onClick={() => handleUnassign(number.id)}
                              disabled={updating === number.id}
                            >
                              <Unlink className="mr-2 h-4 w-4" />
                              Unassign
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(number)}
                            disabled={deleting === number.id}
                          >
                            {deleting === number.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={reassignDialogOpen !== null}
        onOpenChange={(open) => setReassignDialogOpen(open ? reassignDialogOpen : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Agent</DialogTitle>
            <DialogDescription>
              Select a voice agent to handle calls from this number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.filter(a => a.isActive).map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReassignDialogOpen(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => reassignDialogOpen && handleReassign(reassignDialogOpen)}
                disabled={!selectedAgent || updating === reassignDialogOpen}
              >
                {updating === reassignDialogOpen ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
