"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Search, X, Clock, Calendar, Package, MessageSquare, FileText, Zap, ExternalLink, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  alertCount?: number;
  children?: React.ReactNode;
}

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

const alertTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  booking: { icon: Calendar, color: "text-blue-600" },
  inventory: { icon: Package, color: "text-red-600" },
  communication: { icon: MessageSquare, color: "text-green-600" },
  form: { icon: FileText, color: "text-purple-600" },
  automation: { icon: Zap, color: "text-amber-600" },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.subtitle
 * @param root0.children
 */
export function Header({ title, subtitle, children }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; label: string; href: string }[]>([]);

  const [bellOpen, setBellOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Mark all as read
  const markAllRead = async () => {
    const unreadIds = alerts.filter((a) => !a.isRead).map((a) => a.id);
    if (unreadIds.length === 0) return;
    try {
      await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch {
      // silent
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global search with quick navigation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const pages = [
      { type: "page", label: "Dashboard", href: "/dashboard", keywords: ["dashboard", "home", "overview", "metrics"] },
      { type: "page", label: "Inbox", href: "/inbox", keywords: ["inbox", "messages", "conversations", "chat", "reply"] },
      { type: "page", label: "Bookings", href: "/bookings", keywords: ["bookings", "appointments", "schedule", "calendar"] },
      { type: "page", label: "Forms", href: "/forms", keywords: ["forms", "intake", "contact", "submissions"] },
      { type: "page", label: "Inventory", href: "/inventory", keywords: ["inventory", "stock", "supplies", "items"] },
      { type: "page", label: "Voice Calls", href: "/voice/calls", keywords: ["voice", "calls", "vapi", "escalation", "transcript"] },
      { type: "page", label: "Staff", href: "/staff", keywords: ["staff", "team", "members", "permissions"] },
      { type: "page", label: "Automation", href: "/automation", keywords: ["automation", "rules", "triggers", "workflows"] },
      { type: "page", label: "Settings", href: "/settings", keywords: ["settings", "workspace", "profile", "security", "export"] },
    ];

    const matches = pages.filter(
      (p) => p.label.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q))
    );

    // Also match alerts
    const alertMatches = alerts
      .filter((a) => a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q))
      .slice(0, 3)
      .map((a) => ({
        type: "alert",
        label: `${a.title}: ${a.message}`,
        href: a.actionUrl || "/dashboard",
      }));

    setSearchResults([...matches, ...alertMatches].slice(0, 8));
  }, [searchQuery, alerts]);

  const navigateTo = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchQuery("");
    setBellOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="flex items-center justify-between py-3 pl-4 pr-4 sm:py-3.5 sm:pl-6 sm:pr-6 lg:pl-6">
        <div className="flex-1 min-w-0 mr-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {children}

          {/* Global Search - Desktop & Mobile Toggle */}
          <div className="relative" ref={searchRef}>
            <div className="hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9 w-64 bg-gray-50 h-9"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-5 h-5 text-gray-500" />
            </Button>

            {/* Search Results Dropdown / Mobile Search Bar */}
            {searchOpen && (
              <div className={cn(
                "absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50",
                "right-0 md:left-0 md:right-auto w-[calc(100vw-2rem)] md:w-80 max-w-sm"
              )}>
                <div className="p-2 md:hidden border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      autoFocus
                      className="pl-9 bg-gray-50 h-10"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors border-b last:border-0"
                      onClick={() => navigateTo(result.href)}
                    >
                      {result.type === "alert" ? (
                        <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{result.label}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                        {result.type}
                      </Badge>
                    </button>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-400">
                      No results for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={bellRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                setBellOpen(!bellOpen);
                if (!bellOpen) fetchAlerts();
              }}
            >
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Alerts Dropdown */}
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-screen max-w-sm sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
                  <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <ScrollArea className="max-h-96">
                  {loadingAlerts ? (
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {alerts.slice(0, 20).map((alert) => {
                        const config = alertTypeConfig[alert.type] || alertTypeConfig.automation;
                        const Icon = config.icon;
                        return (
                          <button
                            key={alert.id}
                            className={cn(
                              "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3",
                              !alert.isRead && "bg-blue-50/40"
                            )}
                            onClick={() => {
                              if (alert.actionUrl) navigateTo(alert.actionUrl);
                              setBellOpen(false);
                            }}
                          >
                            <div className={cn("mt-0.5 shrink-0", config.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn("text-sm font-medium truncate", !alert.isRead ? "text-gray-900" : "text-gray-600")}>
                                  {alert.title}
                                </p>
                                {!alert.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {getRelativeTime(alert.createdAt)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
