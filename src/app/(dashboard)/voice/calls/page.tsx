"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Phone,
  PhoneCall,
  RefreshCcw,
  Search,
  Shield,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceCallItem {
  id: string;
  callSid: string | null;
  direction: string;
  status: string;
  duration: number | null;
  outcome: string | null;
  summary: string | null;
  transcript: string | null;
  metadata: string | null;
  escalated: boolean;
  escalationReason: string | null;
  createdAt: string;
  endedAt: string | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  consent: {
    id: string;
    consentResponse: boolean;
    consentText: string;
    capturedAt: string;
  } | null;
}

interface CallsResponse {
  calls: VoiceCallItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 *
 */
function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 *
 */
function statusTone(status: string): string {
  const normalized = status.toUpperCase();
  if (["COMPLETED"].includes(normalized)) return "text-emerald-700 border-emerald-200 bg-emerald-50";
  if (["NO_ANSWER", "FAILED", "BUSY"].includes(normalized)) return "text-rose-700 border-rose-200 bg-rose-50";
  if (["INITIATED", "RINGING", "IN_PROGRESS"].includes(normalized)) return "text-blue-700 border-blue-200 bg-blue-50";
  if (["SKIPPED"].includes(normalized)) return "text-amber-700 border-amber-200 bg-amber-50";
  return "text-gray-700 border-gray-200 bg-gray-50";
}

/**
 *
 */
function formatDuration(seconds: number | null): string {
  if (!seconds || seconds < 1) return "-";
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${mins}:${String(rem).padStart(2, "0")}`;
}

/**
 *
 */
export default function VoiceCallsPage() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<VoiceCallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [escalationFilter, setEscalationFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCall, setSelectedCall] = useState<VoiceCallItem | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [canResolveEscalations, setCanResolveEscalations] = useState(false);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (outcome !== "all") params.set("outcome", outcome);
      if (escalationFilter !== "all") params.set("escalated", escalationFilter);

      const res = await fetch(`/api/voice/calls?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load calls");
      }

      const data = (await res.json()) as CallsResponse;
      setCalls(data.calls || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load calls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [status, outcome, escalationFilter]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setCanResolveEscalations(false);
          return;
        }

        const data = (await res.json()) as { user?: { role?: string } };
        setCanResolveEscalations(data.user?.role === "OWNER");
      } catch {
        setCanResolveEscalations(false);
      }
    };

    void fetchCurrentUser();
  }, []);

  useEffect(() => {
    void fetchCalls();
  }, [fetchCalls]);

  const filteredCalls = useMemo(() => {
    if (!searchTerm.trim()) return calls;
    const term = searchTerm.toLowerCase();

    return calls.filter((call) => {
      const summary = (call.summary || "").toLowerCase();
      const transcript = (call.transcript || "").toLowerCase();
      const contactName = (call.contact?.name || "").toLowerCase();
      const contactPhone = (call.contact?.phone || "").toLowerCase();
      const callSid = (call.callSid || "").toLowerCase();

      return (
        contactName.includes(term) ||
        contactPhone.includes(term) ||
        callSid.includes(term) ||
        summary.includes(term) ||
        transcript.includes(term)
      );
    });
  }, [calls, searchTerm]);

  const stats = useMemo(() => {
    const escalated = calls.filter((call) => call.escalated).length;
    const completed = calls.filter((call) => call.status.toUpperCase() === "COMPLETED").length;
    const blocked = calls.filter((call) => call.outcome === "DNC_SKIP").length;

    return { escalated, completed, blocked };
  }, [calls]);

  const resolveEscalation = async (call: VoiceCallItem) => {
    if (!canResolveEscalations) {
      toast({
        title: "Owner access required",
        description: "Only workspace owners can resolve escalations.",
        variant: "destructive",
      });
      return;
    }

    setResolving(call.id);
    try {
      const res = await fetch(`/api/voice/calls/${call.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve-escalation",
          note: "Escalation reviewed from voice calls dashboard",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve escalation");
      }

      toast({ title: "Escalation resolved", description: "Call has been marked reviewed" });
      await fetchCalls();
      if (selectedCall?.id === call.id) {
        setSelectedCall({ ...call, escalated: false, escalationReason: null, outcome: "ESCALATION_REVIEWED" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve escalation",
        variant: "destructive",
      });
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50/30">
      <Header title="Voice Calls" subtitle="Review call outcomes, escalations, and consent" />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <PhoneCall className="h-5 w-5 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Escalated</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.escalated}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">DNC Blocked</p>
                  <p className="text-2xl font-bold text-rose-700">{stats.blocked}</p>
                </div>
                <Shield className="h-5 w-5 text-rose-600" />
              </CardContent>
            </Card>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="border-b bg-white/70">
              <CardTitle className="text-base">Call Log</CardTitle>
              {!canResolveEscalations ? (
                <p className="mt-1 text-xs text-amber-700">
                  Only workspace owners can resolve escalations.
                </p>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                <div className="relative lg:col-span-2">
                  <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search caller, phone, transcript"
                    className="pl-8"
                  />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="INITIATED">Initiated</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                    <SelectItem value="BUSY">Busy</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={escalationFilter} onValueChange={setEscalationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escalation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calls</SelectItem>
                    <SelectItem value="true">Escalated Only</SelectItem>
                    <SelectItem value="false">Non-Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="DNC_SKIP">DNC Skip</SelectItem>
                    <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                    <SelectItem value="BUSY">Busy</SelectItem>
                    <SelectItem value="ESCALATION_REVIEWED">Escalation Reviewed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchCalls}>
                  <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 overflow-auto p-0">
              {loading ? (
                <div className="flex h-full items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : filteredCalls.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
                  <Phone className="mb-3 h-8 w-8 text-gray-300" />
                  <p className="font-medium">No calls found</p>
                  <p className="text-xs">Try changing filters or search terms.</p>
                </div>
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Caller</th>
                      <th className="px-4 py-3 text-left">Direction</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Duration</th>
                      <th className="px-4 py-3 text-left">Outcome</th>
                      <th className="px-4 py-3 text-left">Consent</th>
                      <th className="px-4 py-3 text-left">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.map((call) => (
                      <tr key={call.id} className="border-t hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{call.contact?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{call.contact?.phone || call.callSid || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{call.direction}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusTone(call.status)}>
                            {call.status}
                          </Badge>
                          {call.escalated && (
                            <Badge variant="outline" className="ml-2 border-amber-200 bg-amber-50 text-amber-700">
                              Escalated
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{formatDuration(call.duration)}</td>
                        <td className="px-4 py-3">{call.outcome || "-"}</td>
                        <td className="px-4 py-3">
                          {call.consent ? (
                            <Badge
                              variant="outline"
                              className={call.consent.consentResponse
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"}
                            >
                              {call.consent.consentResponse ? "Granted" : "Denied"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(call.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedCall(call)}>
                              Details
                            </Button>
                            {call.escalated && canResolveEscalations && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={resolving === call.id}
                                onClick={() => resolveEscalation(call)}
                              >
                                {resolving === call.id ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-1 h-4 w-4" />
                                )}
                                Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
            <DialogDescription>
              {selectedCall?.contact?.name || "Unknown caller"} · {selectedCall ? new Date(selectedCall.createdAt).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedCall && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Status:</span> {selectedCall.status}</p>
                  <p><span className="text-gray-500">Outcome:</span> {selectedCall.outcome || "-"}</p>
                  <p><span className="text-gray-500">Duration:</span> {formatDuration(selectedCall.duration)}</p>
                  <p><span className="text-gray-500">Escalated:</span> {selectedCall.escalated ? "Yes" : "No"}</p>
                  {selectedCall.escalationReason && (
                    <p><span className="text-gray-500">Escalation reason:</span> {selectedCall.escalationReason}</p>
                  )}
                  {selectedCall.summary && (
                    <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-700">{selectedCall.summary}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selectedCall.consent ? (
                    <>
                      <p>
                        <span className="text-gray-500">Consent:</span>{" "}
                        {selectedCall.consent.consentResponse ? "Granted" : "Denied"}
                      </p>
                      <p><span className="text-gray-500">Prompt:</span> {selectedCall.consent.consentText}</p>
                      <p className="text-xs text-gray-500">
                        Captured at {new Date(selectedCall.consent.capturedAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No consent record attached.</p>
                  )}

                  {(() => {
                    const metadata = parseMetadata(selectedCall.metadata);
                    const retryCount = metadata.retryCount as number | undefined;
                    const nextRetryAt = metadata.nextRetryAt as string | undefined;
                    const smsFallbackRequired = metadata.smsFallbackRequired as boolean | undefined;

                    return (
                      <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                        <p>Retry count: {typeof retryCount === "number" ? retryCount : 0}</p>
                        <p>Next retry: {nextRetryAt ? new Date(nextRetryAt).toLocaleString() : "-"}</p>
                        <p>SMS fallback required: {smsFallbackRequired ? "Yes" : "No"}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-auto rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    {selectedCall.transcript || "No transcript available."}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
