"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Calendar, FileText,
  Package, Users, Zap, Settings, LogOut, Menu, X, PhoneCall, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "./logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badgeKey: null },
  { href: "/inbox", label: "Inbox", icon: MessageSquare, badgeKey: "inbox" as const },
  { href: "/bookings", label: "Bookings", icon: Calendar, badgeKey: "bookings" as const },
  { href: "/contacts", label: "Contacts", icon: Users, badgeKey: null },
  { href: "/forms", label: "Forms", icon: FileText, badgeKey: null },
  { href: "/inventory", label: "Inventory", icon: Package, badgeKey: "lowStock" as const },
  { href: "/voice/calls", label: "Voice", icon: PhoneCall, badgeKey: null },
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

/**
 *
 * @param root0
 * @param root0.userName
 * @param root0.userRole
 * @param root0.workspaceName
 */
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

  // Shared nav items renderer — used in both expanded and collapsed panels
  const renderNavItems = (collapsed: boolean) =>
    navItems.map((item) => {
      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
      const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

      if (userRole !== "OWNER" && (item.href === "/settings" || item.href === "/automation")) {
        return null;
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          title={collapsed ? item.label : undefined}
          className={cn(
            "group relative flex items-center rounded-lg transition-all duration-150",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
            isActive
              ? "bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-item-active-text)]"
              : "text-muted-foreground hover:bg-[var(--sidebar-item-hover-bg)] hover:text-foreground dark:hover:text-slate-200"
          )}
        >
          <item.icon
            className={cn(
              "shrink-0 transition-colors",
              collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
              isActive ? "text-[var(--sidebar-item-active-text)]" : "text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-slate-300"
            )}
          />
          {!collapsed && (
            <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
          )}
          {badgeCount > 0 && !collapsed && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
          {badgeCount > 0 && collapsed && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
          {/* Tooltip for collapsed mode */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2.5 z-50 hidden whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg group-hover:block">
              {item.label}
              {badgeCount > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-1 text-[9px] text-white">
                  {badgeCount}
                </span>
              )}
            </span>
          )}
        </Link>
      );
    });

  /* ─── USER AVATAR / FOOTER ─── */
  const initials = userName?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* ─────────────────────────────────────────
          COLLAPSED ICON-ONLY RAIL — always visible
          (shows on mobile, hidden on lg+)
          ───────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] lg:hidden">
        {/* Logo icon */}
        <div className="flex h-14 shrink-0 items-center justify-center border-b border-[var(--sidebar-border)]">
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <Logo variant="icon" size={32} />
          </Link>
        </div>

        {/* Mobile expand button */}
        <button
          className="mt-2 flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-lg transition-colors hover:bg-muted/50 dark:hover:bg-slate-800"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5 text-muted-foreground" />
        </button>

        {/* Collapsed nav */}
        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {renderNavItems(true)}
        </nav>

        {/* User avatar in rail */}
        <div className="mt-auto flex flex-col items-center justify-center p-2 pt-4 border-t border-[var(--sidebar-border)] gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-slate-700 dark:text-slate-300"
          >
            {initials}
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────
          FULL EXPANDED SIDEBAR — always visible on lg+
          ───────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] lg:flex">
        {/* Header / Logo */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--sidebar-border)] px-5">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo variant="icon" size={32} />
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-lg font-bold leading-none tracking-tight text-foreground">
                Care<span className="text-primary">Ops</span>
              </span>
              <p className="max-w-[140px] truncate text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80">
                {workspaceName || "Workspace"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-0.5">
            {renderNavItems(false)}
          </div>
        </nav>

        {/* Footer — user info + logout */}
        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-primary/90 dark:bg-blue-900/40 dark:text-blue-300">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{userName || "User"}</p>
              <p className="text-[11px] capitalize text-muted-foreground">{userRole?.toLowerCase() || "owner"}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          </div>
          <div className="flex gap-2 mb-2 px-2">
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────
          MOBILE FULL-SCREEN DRAWER OVERLAY
          ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "flex translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--sidebar-border)] px-5">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo variant="icon" size={32} />
            <div>
              <span className="text-lg font-bold leading-none tracking-tight text-foreground">
                Care<span className="text-primary">Ops</span>
              </span>
              <p className="max-w-[140px] truncate text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80">
                {workspaceName || "Workspace"}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted/50 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-0.5">
            {renderNavItems(false)}
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-primary/90">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{userName || "User"}</p>
              <p className="text-[11px] capitalize text-muted-foreground">{userRole?.toLowerCase() || "owner"}</p>
            </div>
          </div>
          <div className="flex gap-2 mb-2 px-2">
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
