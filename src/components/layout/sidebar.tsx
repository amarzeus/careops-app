"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Calendar, FileText,
  Package, Users, Zap, Settings, LogOut, Menu, X, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badgeKey: null },
  { href: "/inbox", label: "Inbox", icon: MessageSquare, badgeKey: "inbox" as const },
  { href: "/bookings", label: "Bookings", icon: Calendar, badgeKey: "bookings" as const },
  { href: "/forms", label: "Forms", icon: FileText, badgeKey: null },
  { href: "/inventory", label: "Inventory", icon: Package, badgeKey: "lowStock" as const },
  { href: "/staff", label: "Staff", icon: Users, badgeKey: null },
  { href: "/automation", label: "Automation", icon: Zap, badgeKey: null },
  { href: "/settings", label: "Settings", icon: Settings, badgeKey: null },
];

type BadgeCounts = {
  inbox: number;
  bookings: number;
  lowStock: number;
};

interface SidebarProps {
  userName?: string;
  userRole?: string;
  workspaceName?: string;
}

export function Sidebar({ userName, userRole, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ inbox: 0, bookings: 0, lowStock: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [alertsRes, inventoryRes] = await Promise.all([
          fetch("/api/alerts"),
          fetch("/api/inventory"),
        ]);
        if (alertsRes.ok) {
          const data = await alertsRes.json();
          const unreadAlerts = (data.alerts || []).filter((a: { isRead: boolean }) => !a.isRead);
          const inboxCount = unreadAlerts.filter((a: { type: string }) => a.type === "message").length;
          const bookingCount = unreadAlerts.filter((a: { type: string }) => a.type === "booking").length;
          setBadges(prev => ({ ...prev, inbox: inboxCount, bookings: bookingCount }));
        }
        if (inventoryRes.ok) {
          const data = await inventoryRes.json();
          const lowStock = (data.items || []).filter(
            (i: { quantity: number; threshold: number }) => i.quantity <= i.threshold
          ).length;
          setBadges(prev => ({ ...prev, lowStock }));
        }
      } catch {
        // Silently fail — badges are non-critical
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CareOps</h1>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">{workspaceName || "Workspace"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          
          // Role-Based Visibility
          if (userRole !== "OWNER" && (item.href === "/settings" || item.href === "/automation")) {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-700" : "text-gray-400")} />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName || "User"}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole?.toLowerCase() || "owner"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-red-600" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
