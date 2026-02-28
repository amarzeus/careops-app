"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface RevenueData {
  period: string;
  totalRevenue: number;
  previousRevenue: number;
  growthPercent: number;
  totalBookings: number;
  avgBookingValue: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  revenueByService: Array<{ name: string; revenue: number; count: number }>;
  revenueByStaff: Array<{ name: string; revenue: number; count: number }>;
}

/**
 * Analytics page for viewing revenue and performance metrics.
 *
 * @returns {JSX.Element} The analytics dashboard.
 */
/**
 * Revenue Analytics Page component.
 */
export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/revenue?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "usd", // default or use workspace settings
    }).format(value);

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        title="Revenue Analytics"
        subtitle="Track your business performance and revenue metrics."
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Period Selector */}
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

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "--" : formatCurrency(data?.totalRevenue || 0)}
                </div>
                <p className="text-muted-foreground mt-1 flex items-center text-xs">
                  {loading ? (
                    "-- vs previous"
                  ) : (data?.growthPercent || 0) >= 0 ? (
                    <span className="flex items-center text-green-500">
                      <TrendingUp className="mr-1 h-3 w-3" /> +{data?.growthPercent}% vs previous
                    </span>
                  ) : (
                    <span className="flex items-center text-red-500">
                      <TrendingUp className="mr-1 h-3 w-3 rotate-180" /> {data?.growthPercent}% vs
                      previous
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "--" : data?.totalBookings}</div>
                <p className="text-muted-foreground mt-1 text-xs">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Activity className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "--" : formatCurrency(data?.avgBookingValue || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Per completed booking</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    Loading chart...
                  </div>
                ) : data?.dailyRevenue.length === 0 ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    No revenue data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.dailyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        tickFormatter={(val) => `$${val}`}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        width={60}
                      />
                      <Tooltip
                        // @ts-expect-error recharts type definitions are complex
                        formatter={(val: number) => [`$${val}`, "Revenue"]}
                        labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Revenue by Service</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    Loading chart...
                  </div>
                ) : data?.revenueByService.length === 0 ? (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.revenueByService.slice(0, 5) || []}
                      layout="vertical"
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        fontSize={12}
                      />
                      <Tooltip
                        // @ts-expect-error recharts types
                        formatter={(val: number) => [`$${val}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
