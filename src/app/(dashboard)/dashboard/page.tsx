"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  FileText,
  Package,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Plus,
  Send,
  Activity,
  Zap,
  Clock,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TodaysSchedule } from "@/components/dashboard/todays-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { HoverExpandCard } from "@/components/dashboard/hover-expand-card";
import { cn } from "@/lib/utils";

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
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    link?: string;
  }>;
}

/**
 *
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isVisible, setIsVisible] = useState(true);

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
    // Initial fetch
    fetchMetrics();

    // Set up polling interval (30 seconds for more real-time feel)
    const interval = setInterval(() => {
      if (isVisible && !document.hidden) {
        fetchMetrics();
      }
    }, 30000);

    // Handle visibility change (pause polling when tab not active)
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      if (!document.hidden) {
        // Refresh immediately when coming back to tab
        fetchMetrics();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle online/offline
    const handleOnline = () => {
      toast({ title: "Back Online", description: "Refreshing dashboard..." });
      fetchMetrics();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isVisible]);

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-muted/30/50 p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl sm:h-48" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  const m = data?.metrics || {
    bookingsToday: 0,
    bookingsUpcoming: 0,
    bookingsCompleted: 0,
    bookingsNoShow: 0,
    bookingsUnconfirmed: 0,
    newContacts: 0,
    totalContacts: 0,
    ongoingConversations: 0,
    unansweredMessages: 0,
    pendingForms: 0,
    overdueForms: 0,
    completedForms: 0,
    totalFormSubmissions: 0,
    lowStockItems: 0,
    criticalItems: 0,
    totalInventoryItems: 0,
  };

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Dashboard" subtitle="Overview of your business performance">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {refreshing ? (
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          <span>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </Header>

      {/* Page body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        {/* ══════ Quick Actions Bar ══════ */}
        <section className="no-scrollbar flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:gap-3">
          <Link href="/bookings">
            <Button
              size="sm"
              className="h-8 gap-2 bg-primary text-xs text-white hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New Booking
            </Button>
          </Link>
          <Link href="/inbox">
            <Button size="sm" variant="outline" className="h-8 gap-2 text-xs">
              <Send className="h-3.5 w-3.5" /> Send Message
            </Button>
          </Link>
          <Link href="/forms">
            <Button size="sm" variant="outline" className="h-8 gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> View Forms
            </Button>
          </Link>
          <Link href="/inventory">
            <Button size="sm" variant="outline" className="h-8 gap-2 text-xs">
              <Package className="h-3.5 w-3.5" /> Check Inventory
            </Button>
          </Link>
          <Link href="/automation">
            <Button size="sm" variant="outline" className="h-8 gap-2 text-xs">
              <Zap className="h-3.5 w-3.5" /> Automations
            </Button>
          </Link>
        </section>

        {/* ══════ 1. Operational Metrics (Top Row) ══════ */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
          <MetricCard
            title="Today's Bookings"
            value={m.bookingsToday}
            icon={Calendar}
            color="blue"
            href="/bookings"
            trend={{ value: m.bookingsToday, label: "" }}
          />
          <MetricCard
            title="Inbox"
            value={m.unansweredMessages}
            icon={MessageSquare}
            color={m.unansweredMessages > 0 ? "amber" : "emerald"}
            alert={m.unansweredMessages > 0}
            href="/inbox"
          />
          <MetricCard
            title="Pending Forms"
            value={m.pendingForms}
            icon={FileText}
            color={m.overdueForms > 0 ? "amber" : "violet"}
            alert={m.overdueForms > 0}
            href="/forms"
          />
          <MetricCard
            title="New Leads"
            value={m.newContacts}
            icon={Users}
            color="emerald"
            href="/inbox"
          />
          <MetricCard
            title="Completed"
            value={m.bookingsCompleted}
            icon={CheckCircle}
            color="gray"
            href="/bookings"
          />
        </section>

        {/* ══════ 2. High Priority Attention Section (Middle Row) ══════ */}
        {/* ══════ 2. High Priority Attention Section (Middle Row) ══════ */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* A. Attention Required (Key Alerts) */}
          <HoverExpandCard
            title="Attention Required"
            icon={AlertTriangle}
            count={data?.keyAlerts?.length || 0}
            countLabel={data?.keyAlerts?.length ? `${data.keyAlerts.length}` : undefined}
            headerColorClass="text-amber-900"
            iconColorClass="text-amber-600"
            previewText={data?.keyAlerts?.length ? `${data.keyAlerts.length} items` : "All clear"}
            className="h-[72px]"
          >
            {data?.keyAlerts && data.keyAlerts.length > 0 ? (
              <div className="space-y-2">
                {data.keyAlerts.map((alert, i) => (
                  <button
                    key={i}
                    onClick={() => alert.link && router.push(alert.link)}
                    className="group/item flex w-full items-start gap-3 rounded-lg border bg-background p-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        alert.priority === "critical"
                          ? "bg-red-500"
                          : alert.priority === "high"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="group-hover/item:text-primary text-xs leading-tight font-medium text-foreground transition-colors">
                        {alert.message}
                      </p>
                      <p className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                        {alert.category}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/item:text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No alerts needing attention.
              </div>
            )}
          </HoverExpandCard>

          {/* B. AI Suggestions */}
          <HoverExpandCard
            title="AI Insights"
            icon={Sparkles}
            count={data?.aiInsights?.length || 0}
            headerColorClass="text-violet-900"
            iconColorClass="text-violet-600"
            previewText={
              data?.aiInsights?.length ? `${data.aiInsights.length} insights` : "No insights"
            }
            className="h-[72px]"
          >
            {data?.aiInsights && data.aiInsights.length > 0 ? (
              <div className="space-y-2">
                {data.aiInsights.slice(0, 5).map((insight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-md border border-violet-100 bg-background p-2.5 transition-colors hover:border-violet-200"
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        insight.priority === "high"
                          ? "bg-red-500"
                          : insight.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs leading-snug text-muted-foreground">{insight.message}</p>
                      <Badge
                        variant="secondary"
                        className="h-4 border border-violet-100 bg-violet-50 px-1 text-[9px] text-violet-700 hover:bg-violet-100"
                      >
                        {insight.action}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-50">
                <p className="text-xs text-muted-foreground">No suggestions right now</p>
              </div>
            )}
          </HoverExpandCard>

          {/* C. Critical Stock */}
          <HoverExpandCard
            title="Critical Stock"
            icon={Package}
            count={data?.lowStockDetails?.length || 0}
            headerColorClass="text-red-900"
            iconColorClass="text-red-600"
            previewText={
              data?.lowStockDetails?.length
                ? `${data.lowStockDetails.length} items low`
                : "Stock OK"
            }
            className="h-[72px]"
          >
            {data?.lowStockDetails && data.lowStockDetails.length > 0 ? (
              <div className="space-y-2">
                {data.lowStockDetails.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-red-100 bg-background p-2.5 text-xs"
                  >
                    <span
                      className="flex-1 truncate pr-2 font-medium text-foreground"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {item.quantity} / {item.threshold}
                    </Badge>
                  </div>
                ))}
                <Link href="/inventory" className="block w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    View All Inventory
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-50">
                <CheckCircle className="mb-2 h-6 w-6 text-emerald-300" />
                <p className="text-xs text-muted-foreground">Inventory levels healthy</p>
              </div>
            )}
          </HoverExpandCard>
        </section>

        {/* ══════ 3. Visuals (Bottom Row) ══════ */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Main Chart Column (2/3) */}
          <div className="flex h-full min-h-[300px] flex-col lg:col-span-2">
            <PerformanceChart data={data?.chartData || []} />
          </div>

          {/* Schedule (1/3) */}
          <div className="flex h-full min-h-[300px] flex-col overflow-y-auto">
            <TodaysSchedule bookings={data?.todaysBookings || []} />
          </div>
        </div>

        {/* ══════ 4. Activity Feed ══════ */}
        {data?.recentActivity && data.recentActivity.length > 0 && (
          <Card className="border-border/40/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-xs transition-colors hover:bg-muted/30"
                    onClick={() => activity.link && router.push(activity.link)}
                  >
                    <div
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        activity.type === "booking"
                          ? "bg-blue-500"
                          : activity.type === "contact"
                            ? "bg-emerald-500"
                            : activity.type === "form"
                              ? "bg-violet-500"
                              : activity.type === "inventory"
                                ? "bg-red-500"
                                : activity.type === "automation"
                                  ? "bg-amber-500"
                                  : "bg-muted"
                      )}
                    />
                    <span className="flex-1 text-muted-foreground">{activity.message}</span>
                    <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
