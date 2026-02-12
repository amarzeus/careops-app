"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  FileText,
  Package,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TodaysSchedule } from "@/components/dashboard/todays-schedule";
import { KeyAlerts } from "@/components/dashboard/key-alerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

/** Dashboard data shape from /api/dashboard/metrics */
interface DashboardData {
  metrics: {
    bookingsToday: number;
    bookingsUpcoming: number;
    bookingsCompleted: number;
    bookingsNoShow: number;
    bookingsUnconfirmed: number;
    newContacts: number;
    totalContacts: number;
    ongoingConversations: number;
    unansweredMessages: number;
    pendingForms: number;
    overdueForms: number;
    completedForms: number;
    totalFormSubmissions: number;
    lowStockItems: number;
    criticalItems: number;
    totalInventoryItems: number;
  };
  todaysBookings: Array<{
    id: string;
    time: string;
    service: string;
    contact: string;
    status: string;
  }>;
  chartData: Array<{
    name: string;
    bookings: number;
    leads: number;
    completed: number;
  }>;
  keyAlerts: Array<{
    priority: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    action: string;
    link: string;
  }>;
  aiInsights: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    message: string;
    action: string;
  }>;
  lowStockDetails: Array<{
    id: string;
    name: string;
    quantity: number;
    threshold: number;
    unit: string;
  }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const m = data?.metrics || {
    bookingsToday: 0, bookingsUpcoming: 0, bookingsCompleted: 0,
    bookingsNoShow: 0, bookingsUnconfirmed: 0, newContacts: 0,
    totalContacts: 0, ongoingConversations: 0, unansweredMessages: 0,
    pendingForms: 0, overdueForms: 0, completedForms: 0,
    totalFormSubmissions: 0, lowStockItems: 0, criticalItems: 0,
    totalInventoryItems: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time overview of your business operations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block bg-gray-100 px-2 py-1 rounded-full">
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics(true)}
              disabled={refreshing}
              className="gap-2 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">

        {/* ══════ 1. High Priority Action Items (Top Row) ══════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              At a Glance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <MetricCard
              title="Today's Bookings"
              value={m.bookingsToday}
              icon={Calendar}
              description={m.bookingsUpcoming > 0 ? `+${m.bookingsUpcoming} upcoming this week` : "No upcoming bookings"}
              color="blue"
              href="/bookings"
              trend={{ value: m.bookingsToday, label: "scheduled" }}
            />
            <MetricCard
              title="Inbox attention"
              value={m.unansweredMessages}
              icon={MessageSquare}
              description="Unanswered messages"
              color={m.unansweredMessages > 0 ? "red" : "emerald"}
              alert={m.unansweredMessages > 0}
              href="/inbox"
              trend={m.unansweredMessages > 0 ? { value: m.unansweredMessages, label: "needs reply" } : undefined}
            />
            <MetricCard
              title="Pending Forms"
              value={m.pendingForms}
              icon={FileText}
              description={`${m.overdueForms} overdue forms`}
              color={m.overdueForms > 0 ? "amber" : "violet"}
              alert={m.overdueForms > 0}
              href="/forms"
            />
            <MetricCard
              title="Inventory Alert"
              value={m.criticalItems}
              icon={Package}
              description={`${m.lowStockItems} low stock items`}
              color={m.criticalItems > 0 ? "red" : "emerald"}
              alert={m.criticalItems > 0}
              href="/inventory"
            />
          </div>
        </section>

        {/* ══════ 2. Main Operational View (Middle Section) ══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">

          {/* Main Chart Column (2/3) */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <PerformanceChart data={data?.chartData || []} />

            {/* Secondary Metrics Grid inside Main Column */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="shadow-none border bg-white/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{m.newContacts}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">New Leads</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{m.bookingsCompleted}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Completed</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{m.totalContacts}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Total Clients</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{m.completedForms}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Forms Done</div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Details (if key alerts empty, or just always show if relevant) */}
            {data?.lowStockDetails && data.lowStockDetails.length > 0 && (
              <Card className="border-red-100 bg-red-50/10 shadow-sm">
                <CardHeader className="pb-3 border-b border-red-50">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Critical Inventory
                    </div>
                    <Link href="/inventory" className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1">
                      Manage <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                  {data.lowStockDetails.slice(0, 4).map((item) => {
                    const pct = item.threshold > 0 ? Math.max(0, Math.min(100, (item.quantity / (item.threshold * 2)) * 100)) : 0;
                    return (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate pr-2" title={item.name}>{item.name}</h4>
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase">Critical</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct < 30 ? "bg-red-500" : pct < 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-600">{item.quantity} / {item.threshold} {item.unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar Column (1/3) */}
          <div className="space-y-6 flex flex-col">
            <TodaysSchedule bookings={data?.todaysBookings || []} />

            {/* Key Alerts & AI Insights Stack */}
            <div className="space-y-4">
              <KeyAlerts alerts={data?.keyAlerts || []} />

              {data?.aiInsights && data.aiInsights.length > 0 && (
                <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-violet-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.aiInsights.map((insight, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-white/60 border border-violet-100/50 hover:bg-white transition-colors">
                        <div className="mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-700 leading-relaxed mb-1.5">{insight.message}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-[9px] h-5 px-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200">
                              {insight.action}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
