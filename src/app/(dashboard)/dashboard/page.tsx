"use client";

import React, { useEffect, useState } from "react";
import {
    LayoutDashboard, Calendar, Users, FileText,
    Package, Settings, LogOut, Loader2, Sparkles
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionList } from "@/components/dashboard/action-list";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ metrics: any, insights: Array<{ priority: "high" | "medium" | "low"; category: string; message: string; action: string; link?: string }> } | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch("/api/dashboard/metrics");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const { metrics, insights } = data || { metrics: {}, insights: [] };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Command Center</h1>
                        <p className="text-sm text-gray-500">Live overview of your operations.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </Button>
                    </div>
                </div>

                {/* Executive Summary (AI) */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Today's Bookings"
                                value={metrics.bookingsToday || 0}
                                icon={Calendar}
                                description="Scheduled for today"
                            />
                            <StatCard
                                title="New Leads"
                                value={metrics.newContacts || 0}
                                icon={Users}
                                description="Last 7 days"
                                trend="up"
                            />
                            <StatCard
                                title="Pending Forms"
                                value={metrics.pendingForms || 0}
                                icon={FileText}
                                description="Waiting for completion"
                                alert={metrics.pendingForms > 5}
                            />
                            <StatCard
                                title="Low Stock"
                                value={metrics.lowStockItems || 0}
                                icon={Package}
                                description="Items below threshold"
                                alert={metrics.lowStockItems > 0}
                            />
                        </div>

                        {/* Chart Placeholder (Future) */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm min-h-[300px] flex items-center justify-center text-gray-400 border-dashed">
                            <p className="text-sm">Performance Chart (Coming Soon)</p>
                        </div>
                    </div>

                    {/* Action Items Column */}
                    <div className="lg:col-span-1">
                        <ActionList insights={insights || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}
