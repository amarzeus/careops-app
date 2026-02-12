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
      <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
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
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header - Compact */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Overview</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground hidden sm:block bg-gray-100 px-2 py-0.5 rounded-full">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics(true)}
              disabled={refreshing}
              className="gap-2 h-8 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Tighter spacing, max height optimized for 1080p/1440p without scroll if possible */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-4 lg:gap-5 overflow-hidden">

        {/* ══════ 1. High Priority Action Items (Top Row) ══════ */}
        <section>
          {/* <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            At a Glance
          </h2> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <MetricCard
              title="Today's Bookings"
              value={m.bookingsToday}
              icon={Calendar}
              description={m.bookingsUpcoming > 0 ? `+${m.bookingsUpcoming} upcoming` : "No upcoming"}
              color="blue"
              href="/bookings"
              trend={{ value: m.bookingsToday, label: "" }}
            />
            <MetricCard
              title="Inbox attention"
              value={m.unansweredMessages}
              icon={MessageSquare}
              description="Unanswered messages"
              color={m.unansweredMessages > 0 ? "red" : "emerald"}
              alert={m.unansweredMessages > 0}
              href="/inbox"
              trend={m.unansweredMessages > 0 ? { value: m.unansweredMessages, label: "" } : undefined}
            />
            <MetricCard
              title="Pending Forms"
              value={m.pendingForms}
              icon={FileText}
              description={`${m.overdueForms} overdue`}
              color={m.overdueForms > 0 ? "amber" : "violet"}
              alert={m.overdueForms > 0}
              href="/forms"
            />
            <MetricCard
              title="Inventory Alert"
              value={m.criticalItems}
              icon={Package}
              description={`${m.lowStockItems} low stock`}
              color={m.criticalItems > 0 ? "red" : "emerald"}
              alert={m.criticalItems > 0}
              href="/inventory"
            />
          </div>
        </section>

        {/* ══════ 2. Main Operational View (Middle Section) ══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">

          {/* Main Chart Column (2/3) */}
          <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
            {/* Reduced height for chart container */}
            <div className="flex-1 min-h-[300px]">
              <PerformanceChart data={data?.chartData || []} />
            </div>

            {/* Secondary Metrics Grid - More compact */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="shadow-none border bg-white/50 p-0">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{m.newContacts}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">New Leads</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50 p-0">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{m.bookingsCompleted}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Completed</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50 p-0">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{m.totalContacts}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Clients</div>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-white/50 p-0">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{m.completedForms}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Forms</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar Column (1/3) */}
          <div className="space-y-4 flex flex-col h-full overflow-y-auto pr-1">
            <TodaysSchedule bookings={data?.todaysBookings || []} />

            {/* Key Alerts - priority */}
            <KeyAlerts alerts={data?.keyAlerts || []} />

            {/* AI Insights - Compact */}
            {data?.aiInsights && data.aiInsights.length > 0 && (
              <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100 shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-violet-900 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-3">
                  {data.aiInsights.slice(0, 2).map((insight, i) => (
                    <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-md bg-white/60 border border-violet-100/50 hover:bg-white transition-colors">
                      <div className="mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 leading-snug mb-1 truncate">{insight.message}</p>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-violet-100 text-violet-700 hover:bg-violet-200">
                          {insight.action}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Inventory Details Compact */}
            {data?.lowStockDetails && data.lowStockDetails.length > 0 && (
              <Card className="border-red-100 bg-red-50/10 shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4 border-b border-red-50">
                  <CardTitle className="text-xs font-semibold text-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Critical Stock
                    </div>
                    <Link href="/inventory" className="text-[10px] font-medium text-red-600 hover:underline">
                      View All
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 px-4 grid gap-2">
                  {data.lowStockDetails.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-900 truncate max-w-[100px]">{item.name}</span>
                      <span className="font-mono text-red-600 font-bold">{item.quantity} / {item.threshold}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
