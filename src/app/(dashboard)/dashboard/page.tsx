"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar, Users, MessageSquare, FileText, Package,
  AlertTriangle, ArrowRight, Sparkles, Activity, TrendingUp,
  Clock, UserPlus, CheckCircle, XCircle, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface DashboardData {
  bookings: { today: number; upcoming: number; completed: number; noShow: number; total: number };
  contacts: { total: number; new: number };
  conversations: { total: number; unread: number };
  forms: { pending: number; overdue: number; completed: number };
  inventory: { lowStock: Array<{ id: string; name: string; quantity: number; threshold: number; unit: string }> };
  alerts: Array<{ id: string; type: string; title: string; message: string; isRead: boolean; actionUrl: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Array<{ priority: string; category: string; message: string; action: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchInsights();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const dashData = await res.json();
        setData(dashData);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/ai/insights");
      if (res.ok) {
        const { insights: ai } = await res.json();
        setInsights(ai || []);
      }
    } catch (e) { console.error(e); }
    finally { setInsightsLoading(false); }
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-20">
        <Activity className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading your workspace...</p>
      </div>
    );
  }

  const stats = [
    { label: "Today's Bookings", value: data?.bookings.today || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", href: "/bookings" },
    { label: "Upcoming Bookings", value: data?.bookings.upcoming || 0, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", href: "/bookings" },
    { label: "New Contacts", value: data?.contacts.new || 0, icon: UserPlus, color: "text-green-600", bg: "bg-green-50", href: "/inbox" },
    { label: "Unread Messages", value: data?.conversations.unread || 0, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", href: "/inbox" },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="What's happening in your business right now" alertCount={data?.alerts.filter(a => !a.isRead).length || 0} />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* AI Insights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insightsLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : insights.length > 0 ? (
            insights.map((insight, i) => (
              <Card key={i} className={cn(
                "border-l-4",
                insight.priority === "high" ? "border-l-red-500" : insight.priority === "medium" ? "border-l-orange-500" : "border-l-blue-500"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-1 text-[10px] uppercase font-bold tracking-wider">{insight.category}</Badge>
                      <p className="text-sm font-medium text-gray-800 leading-tight">{insight.message}</p>
                      <Button variant="link" className="p-0 h-auto text-xs text-blue-600 font-bold mt-2 hover:no-underline">
                        {insight.action} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    {insight.priority === "high" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-3 border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Insights will appear here as your workspace becomes active.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
                    </div>
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Completed</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data?.bookings.completed || 0}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">No-shows</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data?.bookings.noShow || 0}</span>
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-semibold">{data?.bookings.total || 0}</span>
            </div>
            <Link href="/bookings">
              <Button variant="outline" className="w-full mt-2" size="sm">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Forms + Inventory */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Forms Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Forms Status</CardTitle>
              </div>
              <Link href="/forms"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{data?.forms.pending || 0}</p>
                <p className="text-xs text-yellow-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{data?.forms.overdue || 0}</p>
                <p className="text-xs text-red-600 mt-1">Overdue</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{data?.forms.completed || 0}</p>
                <p className="text-xs text-green-600 mt-1">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-base">Inventory Alerts</CardTitle>
              </div>
              <Link href="/inventory"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.inventory.lowStock && data.inventory.lowStock.length > 0 ? (
              <div className="space-y-2">
                {data.inventory.lowStock.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} {item.unit} left</p>
                    </div>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">All inventory levels are healthy</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <CardTitle className="text-base">Recent Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data?.alerts && data.alerts.length > 0 ? (
            <div className="space-y-2">
              {data.alerts.slice(0, 5).map((alert) => (
                <Link key={alert.id} href={alert.actionUrl || "#"}>
                  <div className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50", !alert.isRead && "bg-blue-50/50 border-blue-200")}>
                    <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", alert.type === "inventory" ? "text-orange-500" : alert.type === "booking" ? "text-blue-500" : "text-red-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    </div>
                    {!alert.isRead && <Badge variant="default" className="text-[10px] bg-blue-600">New</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No alerts at the moment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
