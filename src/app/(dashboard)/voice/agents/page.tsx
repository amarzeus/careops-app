"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Plus,
  MoreVertical,
  Trash2,
  Phone,
  Loader2,
  Power,
  PowerOff
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AgentCustomizer } from "@/components/voice/agent-customizer";

interface VoiceAgent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  vapiAssistantId: string | null;
  canBook: boolean;
  canCheckStatus: boolean;
  canTransfer: boolean;
  canHandleInquiry: boolean;
  createdAt: string;
  phoneNumbers: { id: string; phoneNumber: string }[];
}

/**
 *
 */
export default function VoiceAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voice/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load voice agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (agent: VoiceAgent) => {
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update agent");

      toast({
        title: agent.isActive ? "Agent Deactivated" : "Agent Activated",
        description: `${agent.name} is now ${agent.isActive ? "inactive" : "active"}`,
      });

      fetchAgents();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (agent: VoiceAgent) => {
    if (agent.phoneNumbers.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Remove all phone numbers from this agent first",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;

    setDeleting(agent.id);
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete agent");

      toast({
        title: "Agent Deleted",
        description: `${agent.name} has been removed`,
      });

      fetchAgents();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleAgentCreated = (agentId: string) => {
    setCreateDialogOpen(false);
    fetchAgents();
    router.push(`/voice/numbers?agentId=${agentId}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        title="Voice Agents"
        subtitle="Manage your AI voice assistants"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Agents</CardTitle>
            <CardDescription>
              Voice agents handle incoming calls and can make outbound calls
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Voice Agent</DialogTitle>
                <DialogDescription>
                  Configure a new AI voice agent for your business
                </DialogDescription>
              </DialogHeader>
              <AgentCustomizer
                workspaceId=""
                onAgentCreated={handleAgentCreated}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No voice agents yet</p>
              <p className="text-sm">Create your first agent to start handling calls</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Phone Numbers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="font-medium">{agent.name}</div>
                      {agent.description && (
                        <div className="text-sm text-muted-foreground">
                          {agent.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {agent.canBook && (
                          <Badge variant="outline" className="text-xs">Book</Badge>
                        )}
                        {agent.canCheckStatus && (
                          <Badge variant="outline" className="text-xs">Status</Badge>
                        )}
                        {agent.canTransfer && (
                          <Badge variant="outline" className="text-xs">Transfer</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.phoneNumbers.length > 0 ? (
                        <div className="space-y-1">
                          {agent.phoneNumbers.map((pn) => (
                            <div key={pn.id} className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {pn.phoneNumber}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(agent)}>
                            {agent.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(agent)}
                            disabled={deleting === agent.id}
                          >
                            {deleting === agent.id ? (
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
    </div>
  );
}
