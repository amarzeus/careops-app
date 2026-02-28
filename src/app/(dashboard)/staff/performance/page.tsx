"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart as BarChartIcon, DollarSign, Clock, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StaffPerformance {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  commissionRate: number;
  completedBookings: number;
  totalRevenueGenerated: number;
  estimatedCommissions: number;
  totalHoursWorked: number;
  utilizationScore: number;
}

/**
 * Staff Performance Dashboard Page
 */
export default function StaffPerformancePage() {
  const [data, setData] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  /**
   * Fetches performance data for members.
   */
  useEffect(() => {
    /**
     * Inner helper to fetch data.
     */
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/staff?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch staff performance:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Sorting data for Leaderboard
  const topPerformers = [...data].sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated);

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        title="Staff Performance"
        subtitle="Track team utilization, hours, and estimated commissions."
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex justify-end space-x-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              onClick={() => setPeriod("week")}
            >
              7 Days
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              onClick={() => setPeriod("month")}
            >
              30 Days
            </Button>
            <Button
              variant={period === "quarter" ? "default" : "outline"}
              onClick={() => setPeriod("quarter")}
            >
              90 Days
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Main Bar Chart */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center text-base font-semibold">
                  <BarChartIcon className="mr-2 h-4 w-4" /> Revenue & Commissions by Staff
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    Loading chart...
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    No performance data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis
                        tickFormatter={(val) => `$${val}`}
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        width={60}
                      />
                      <Tooltip
                        formatter={(val: number | string | undefined) => [
                          `$${Number(val || 0).toFixed(2)}`,
                          "Amount",
                        ]}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="totalRevenueGenerated"
                        name="Revenue Generated"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="estimatedCommissions"
                        name="Commissions"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center text-base font-semibold">
                  <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" /> Top Performers
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground py-4 text-center">Loading...</div>
                ) : topPerformers.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">No data</div>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.slice(0, 5).map((staff, i) => (
                      <div key={staff.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground w-4 text-lg font-bold">{i + 1}</div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{staff.name}</p>
                            <p className="text-muted-foreground flex items-center text-xs">
                              {staff.completedBookings} bookings
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(staff.totalRevenueGenerated)}
                          </p>
                          <p className="text-muted-foreground text-xs">Generated</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Individual Staff Cards */}
          <h3 className="mt-8 mb-4 text-lg font-semibold">Detailed Metrics</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="text-muted-foreground col-span-full py-8 text-center">Loading...</div>
            ) : data.length === 0 ? (
              <div className="text-muted-foreground col-span-full rounded-lg border border-dashed py-8 text-center">
                No staff data found
              </div>
            ) : (
              data.map((staff) => (
                <Card key={staff.id}>
                  <CardHeader className="border-b pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar || ""} />
                          <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{staff.name}</CardTitle>
                          <p className="text-muted-foreground text-xs">{staff.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                          {(staff.commissionRate * 100).toFixed(0)}% Rate
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-muted-foreground mb-1 flex items-center text-xs">
                        <Clock className="mr-1 h-3 w-3" /> Hours
                      </p>
                      <p className="font-bold">{staff.totalHoursWorked}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 flex items-center text-xs">
                        <Activity className="mr-1 h-3 w-3" /> Utilization
                      </p>
                      <p className="font-bold">{staff.utilizationScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 flex items-center text-xs">
                        <DollarSign className="mr-1 h-3 w-3" /> Est. Payout
                      </p>
                      <p className="font-bold text-green-600">
                        {formatCurrency(staff.estimatedCommissions)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
