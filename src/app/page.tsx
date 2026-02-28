/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  FileText,
  Zap,
  BarChart3,
  ShieldCheck,
  X,
  Menu,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  Search,
  CheckCheck,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

// ─────────────────────────────────────────────
// PREMIUM CURSOR GLOW — Liquid Glass blend mode
// ─────────────────────────────────────────────
/**
 *
 */
function CursorGlow() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] hidden mix-blend-screen transition-opacity duration-500 ease-in-out md:block dark:mix-blend-color-dodge"
      style={{
        background: `radial-gradient(1200px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.1), rgba(14,165,233,0.05) 20%, transparent 40%)`,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// MAGNETIC BUTTON
// ─────────────────────────────────────────────
/**
 *
 */
function MagneticButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setOffset({ x: (e.clientX - cx) * 0.15, y: (e.clientY - cy) * 0.15 });
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// SPOTLIGHT CARD — Glassmorphic 3D tilt
// ─────────────────────────────────────────────
/**
 *
 */
function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [prefersReducedMotion]
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`border-border/50 bg-background/5 relative overflow-hidden rounded-[32px] border backdrop-blur-3xl transition-all duration-[500ms] ease-out ${
        isHovered ? "border-primary/40 shadow-primary/10 shadow-2xl" : "shadow-sm"
      } ${className}`}
      style={{
        transform:
          isHovered && !prefersReducedMotion
            ? `perspective(1000px) rotateX(${(mousePos.y - 100) * -0.015}deg) rotateY(${(mousePos.x - 150) * 0.015}deg) scale3d(1.005, 1.005, 1.005)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      }}
    >
      {/* Spotlight overlay */}
      {isHovered && !prefersReducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(147,51,234,0.06), rgba(59,130,246,0.04) 40%, transparent 60%)`,
          }}
        />
      )}

      {/* Glass artifact overlay on top */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
/**
 *
 */
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const [hasAnimated, setHasAnimated] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const numericValue = parseInt(value.replace(/\D/g, ""), 10);
          if (isNaN(numericValue)) {
            setDisplay(value);
            return;
          }
          if (prefersReducedMotion) {
            setDisplay(String(numericValue));
            return;
          }
          let current = 0;
          const step = Math.max(1, Math.floor(numericValue / 40));
          const interval = setInterval(() => {
            current += step;
            if (current >= numericValue) {
              current = numericValue;
              clearInterval(interval);
            }
            setDisplay(String(current));
          }, 40); // slightly slower math for smoother feel
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, hasAnimated, prefersReducedMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
/**
 *
 */
function Navbar({
  scrolled,
  setMobileMenuOpen,
}: {
  scrolled: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-2 right-2 left-2 z-50 rounded-2xl transition-all duration-[600ms] sm:top-4 sm:right-4 sm:left-4 ${
        scrolled
          ? "bg-background/80 border-border/40 border py-3 shadow-lg backdrop-blur-2xl"
          : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <Logo variant="full" size={32} />
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {["Features", "Integrations", "Pricing"].map((item) => (
            <a
              key={item}
              href={item === "Pricing" ? "#pricing" : `#${item.toLowerCase()}`}
              className="text-foreground/70 hover:text-foreground flex items-center gap-2 text-sm font-semibold tracking-wide transition-all duration-300"
            >
              {item}
              {item === "Pricing" && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                  Beta
                </span>
              )}
            </a>
          ))}
          <Link
            href="/search"
            className="text-foreground/70 hover:text-foreground text-sm font-semibold tracking-wide transition-all duration-300"
          >
            Find a Business
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hover:bg-muted/50 rounded-full text-sm font-bold transition-colors duration-300"
              >
                Log In
              </Button>
            </Link>
            <MagneticButton>
              <Link href="/register">
                <Button className="bg-foreground text-background hover:bg-foreground/90 shadow-foreground/10 group relative overflow-hidden rounded-full px-7 font-bold shadow-xl transition-all duration-300">
                  <span className="relative z-10">Get Started</span>
                  <div className="from-primary/30 absolute inset-0 bg-gradient-to-r to-purple-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </Button>
              </Link>
            </MagneticButton>
          </div>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="dark:hover:bg-background/10 min-h-[44px] min-w-[44px] rounded-full p-2 transition-colors hover:bg-black/5 md:hidden"
          >
            <Menu className="text-foreground h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─────────────────────────────────────────────
// MOCK DATA FOR CHART
// ─────────────────────────────────────────────
const mockChartData = [
  { name: "Mon", revenue: 2400 },
  { name: "Tue", revenue: 4200 },
  { name: "Wed", revenue: 3800 },
  { name: "Thu", revenue: 5900 },
  { name: "Fri", revenue: 4800 },
  { name: "Sat", revenue: 7200 },
  { name: "Sun", revenue: 8500 },
];

/**
 *
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 border-border/50 rounded-xl border px-2 py-1.5 shadow-xl backdrop-blur-md sm:px-3 sm:py-2.5">
        <p className="text-muted-foreground mb-1 text-[11px] font-medium whitespace-nowrap sm:text-sm">
          {label}
        </p>
        <p className="from-primary bg-gradient-to-r to-purple-500 bg-clip-text text-sm font-bold whitespace-nowrap text-transparent min-[380px]:text-base sm:text-xl">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// UI/UX PRO MAX 3D HERO — Liquid Glass
// ─────────────────────────────────────────────
/**
 *
 */
function Hero3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 100, // softer spring for liquid feel
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 100,
    damping: 30,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;
      mouseX.set((clientX - rect.left) / rect.width - 0.5);
      mouseY.set((clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section
      className="relative flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center overflow-hidden pt-20 pb-12 md:min-h-screen md:pt-32 md:pb-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Liquid morphing background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="from-primary/10 to-primary/10 animate-float absolute top-1/4 left-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-r mix-blend-multiply blur-[120px] dark:mix-blend-screen"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="animate-float-delayed absolute right-1/4 bottom-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-r from-purple-500/10 to-amber-500/5 mix-blend-multiply blur-[120px] dark:mix-blend-screen"
          style={{ animationDuration: "15s" }}
        />
      </div>

      {/* Text Content */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-background/40 text-foreground border-foreground/10 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-extrabold shadow-sm backdrop-blur-md sm:mb-12 sm:px-6 sm:py-2 sm:text-xs"
        >
          <Sparkles className="text-primary h-4 w-4" />
          <span className="from-foreground to-foreground/50 bg-gradient-to-r bg-clip-text tracking-[0.15em] text-transparent uppercase">
            Next-Generation Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-foreground mb-5 text-5xl leading-[1.05] font-black tracking-[-0.04em] sm:mb-6 sm:text-6xl md:text-7xl lg:text-[84px] lg:leading-[0.9]"
        >
          Operations,
          <br />
          <span className="relative mt-1 inline-block">
            <span className="from-primary animate-pulse-slow absolute inset-0 bg-gradient-to-r via-purple-500 to-amber-500 bg-clip-text text-transparent opacity-40 blur-xl" />
            <span className="from-primary animate-gradient-shift relative bg-gradient-to-r via-purple-500 to-amber-500 bg-[length:200%_auto] bg-clip-text text-transparent">
              liquid smooth.
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground mx-auto mb-8 max-w-2xl text-base leading-relaxed font-medium sm:mb-10 sm:text-lg md:text-xl"
        >
          The absolute pinnacle of service operations. Replace your entire fragmented stack with one
          beautifully unified engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:gap-6"
        >
          <MagneticButton>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-cta text-cta-foreground shadow-cta/20 hover:shadow-cta/30 h-12 min-h-[44px] w-full rounded-full px-6 text-base font-bold shadow-2xl transition-all duration-400 ease-out hover:scale-[1.04] active:scale-[0.96] sm:h-16 sm:w-auto sm:px-12 sm:text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>
      </div>

      {/* 3D Dashboard Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6 md:mt-24 lg:px-8"
        style={{ perspective: 1800 }}
      >
        <motion.div
          style={{
            rotateX: prefersReducedMotion ? 0 : rotateX,
            rotateY: prefersReducedMotion ? 0 : rotateY,
          }}
          className="bg-background/40 relative mx-auto flex h-auto w-full flex-col overflow-hidden rounded-[24px] border border-white/20 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] backdrop-blur-[40px] sm:rounded-[28px] lg:rounded-[32px] dark:border-white/10 dark:bg-black/40 dark:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* Faux dashboard glowing grid lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+Cjwvc3ZnPg==')] opacity-[0.03] dark:opacity-[0.05]" />

          <div className="pointer-events-none relative z-10 flex h-full w-full flex-col p-4 sm:p-5 lg:p-8">
            {/* Dashboard Header */}
            <div className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                </div>
                <div className="bg-muted/30 border-border/20 hidden h-8 w-32 items-center rounded-lg border px-2 sm:flex sm:w-48 sm:px-3">
                  <Search className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-muted-foreground text-xs">Search patients...</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-muted/50 border-border/50 hidden h-8 w-8 items-center justify-center rounded-full border transition-colors min-[380px]:flex">
                  <Bell className="text-foreground/70 h-4 w-4" />
                </div>
                <div className="from-primary h-8 w-8 rounded-full bg-gradient-to-tr to-purple-500 p-[2px]">
                  <div className="bg-background flex h-full w-full items-center justify-center rounded-full">
                    <span className="text-foreground text-xs font-bold">AK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="mt-2 flex min-h-0 flex-1 gap-2 sm:mt-4 sm:gap-4">
              {/* Sidebar List */}
              <div className="hidden w-40 flex-col gap-1.5 md:flex">
                {[
                  { icon: LayoutDashboard, label: "Overview", active: true },
                  { icon: Calendar, label: "Appointments", active: false },
                  { icon: Users, label: "Patients", active: false },
                  { icon: FileText, label: "Invoices", active: false },
                  { icon: Settings, label: "Settings", active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex h-9 items-center gap-2.5 rounded-xl border border-transparent px-3 transition-colors ${item.active ? "bg-primary/10 border-primary/20 text-primary shadow-sm" : "bg-muted/10 text-muted-foreground"}`}
                  >
                    <item.icon
                      className={`h-3.5 w-3.5 ${item.active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main Area */}
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
                  {[
                    {
                      title: "Total Revenue",
                      value: "₹24,500",
                      trend: "+12.5%",
                      color: "from-blue-500/20 to-blue-500/5",
                      ring: "ring-blue-500/20",
                      trendColor: "text-green-500 bg-green-500/10",
                    },
                    {
                      title: "New Bookings",
                      value: "145",
                      trend: "+5.2%",
                      color: "from-purple-500/20 to-purple-500/5",
                      ring: "ring-purple-500/20",
                      trendColor: "text-green-500 bg-green-500/10",
                    },
                    {
                      title: "Cancellations",
                      value: "3",
                      trend: "-2.1%",
                      color: "from-orange-500/20 to-orange-500/5",
                      ring: "ring-orange-500/20",
                      trendColor: "text-red-500 bg-red-500/10",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`rounded-xl bg-gradient-to-b ${stat.color} border-border/40 flex flex-col justify-between border p-2 shadow-sm ring-1 backdrop-blur-md ring-inset ${stat.ring} ${i === 2 ? "col-span-2 sm:col-span-1" : ""} sm:rounded-2xl sm:p-4`}
                    >
                      <div className="mb-1 flex items-start justify-between sm:mb-2">
                        <span className="text-muted-foreground text-[10px] font-semibold sm:text-sm">
                          <span className="sm:hidden">
                            {stat.title === "Total Revenue"
                              ? "Revenue"
                              : stat.title === "New Bookings"
                                ? "Bookings"
                                : "Cancels"}
                          </span>
                          <span className="hidden sm:inline">{stat.title}</span>
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:py-0.5 sm:text-[10px] ${stat.trendColor}`}
                        >
                          {stat.trend}
                        </span>
                      </div>
                      <span className="text-foreground text-sm font-black tracking-tight min-[380px]:text-base sm:text-xl lg:text-2xl">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Real Recharts Area */}
                <div className="bg-background/90 border-border/40 pointer-events-auto relative flex min-h-[220px] flex-col overflow-visible rounded-xl border p-1.5 shadow-inner transition-all duration-300 sm:flex-1 sm:rounded-2xl md:p-3 dark:bg-white/5 dark:backdrop-blur-md">
                  <div className="mb-1 flex flex-col items-start justify-between gap-1 px-1 sm:mb-2 sm:flex-row sm:items-center sm:gap-0">
                    <h3 className="text-foreground text-xs font-bold sm:text-sm">
                      Revenue Overview
                    </h3>
                    <span className="text-muted-foreground text-[10px] font-medium sm:text-xs">
                      Last 7 Days
                    </span>
                  </div>
                  <div className="relative z-0 min-h-[140px] w-full flex-1 sm:min-h-[180px]">
                    {/* Floating User Avatars */}{" "}
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart
                          data={mockChartData}
                          margin={{ top: 12, right: 12, left: 8, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 8, fill: "var(--muted-foreground)" }}
                            interval="preserveStartEnd"
                            minTickGap={12}
                            tickMargin={8}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ zIndex: 20 }}
                            offset={16}
                            cursor={{
                              stroke: "var(--primary)",
                              strokeWidth: 1,
                              strokeDasharray: "4 4",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--primary)" }}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chromatic aberration & glass sweep */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent mix-blend-overlay" />
          <div className="box-shadow-inner pointer-events-none absolute inset-0 rounded-[28px] border border-white/20 lg:rounded-[32px]" />
        </motion.div>

        {/* Ambient base glow */}
        <div className="bg-primary/20 absolute bottom-0 left-1/2 -z-10 h-1/2 w-4/5 -translate-x-1/2 rounded-full mix-blend-screen blur-[150px]" />
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
/**
 *
 */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background selection:bg-foreground/10 selection:text-foreground min-h-screen overflow-hidden">
      <CursorGlow />
      <Navbar scrolled={scrolled} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="bg-background/80 fixed inset-0 z-[60] md:hidden"
          >
            <div className="relative z-10 flex h-full flex-col p-8">
              <div className="mb-16 flex items-center justify-between">
                <Logo variant="full" size={32} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="bg-background/10 rounded-full border border-white/20 p-3 backdrop-blur-md"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                {["Features", "Integrations", "Pricing"].map((item, i) => (
                  <motion.a
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    key={item}
                    href={item === "Pricing" ? "#pricing" : `#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground hover:text-primary text-4xl font-black tracking-[-0.04em] transition-colors"
                  >
                    {item}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Link
                    href="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground/60 hover:text-primary text-4xl font-black tracking-[-0.04em] transition-colors"
                  >
                    Find a Business
                  </Link>
                </motion.div>
                <div className="mt-8 flex flex-col gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="h-14 w-full rounded-2xl text-xl font-bold">
                        Log In
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="bg-cta text-cta-foreground shadow-cta/10 h-16 w-full rounded-2xl text-xl font-bold shadow-xl">
                        Get Started
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* ─── 3D HERO ─── */}
        <Hero3D />

        {/* ─── FEATURES - Liquid Tiles ─── */}
        <section id="features" className="bg-background relative z-10 py-14 sm:py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end md:gap-8">
              <div className="max-w-7xl">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-4xl leading-[0.9] font-black tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-[84px]"
                >
                  Unrivaled
                  <br />
                  <span className="text-foreground/60">excellence.</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-muted-foreground mb-2 max-w-sm text-base font-medium sm:text-lg md:mb-4 md:text-xl"
              >
                Six powerful modules engineered for maximum efficiency.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-6 lg:auto-rows-fr">
              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-3 md:row-span-2 md:p-6 lg:p-8">
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-colors group-hover:bg-blue-500/20"
                  >
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </motion.div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight md:text-2xl">
                    Smart Bookings
                  </h3>
                  <p className="text-foreground/80 max-w-xl text-sm leading-relaxed font-medium md:text-base">
                    Public scheduling pages with live availability, automated reminders, and
                    conflict-free calendar sync across your entire team.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["24/7 self-scheduling", "No-show recovery", "Multi-location routing"].map(
                      (chip) => (
                        <span
                          key={chip}
                          className="bg-background/80 border-border/60 text-foreground/85 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm"
                        >
                          {chip}
                        </span>
                      )
                    )}
                  </div>
                </div>
                {/* Decorative animations */}
                <motion.div
                  className="pointer-events-none absolute right-6 bottom-6 z-10 hidden items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 backdrop-blur-md md:flex"
                  animate={{ y: [0, -8, 0], rotate: [0, 2, -1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-foreground/80 text-xs font-semibold tracking-wider uppercase">
                    No-shows
                  </span>
                  <span className="text-foreground text-base font-black">-35%</span>
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-blue-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-3 md:p-6 lg:p-7">
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 transition-colors group-hover:bg-pink-500/20"
                  >
                    <MessageSquare className="h-6 w-6 text-pink-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Unified Inbox
                  </h3>
                  <ul className="text-foreground/80 space-y-2 text-sm leading-relaxed font-medium">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-500/50" />
                      SMS, email, & chat timelines
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-500/50" />
                      AI suggested 1-click replies
                    </li>
                  </ul>
                </div>
                <motion.div
                  className="border-border/60 bg-background/90 text-foreground pointer-events-none absolute top-5 right-5 rounded-full border px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-md"
                  animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  12 unread
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-2/3 w-2/3 bg-gradient-to-tl from-pink-500/15 to-transparent opacity-50 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-3 md:p-6 lg:p-7">
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 transition-colors group-hover:bg-purple-500/20"
                  >
                    <FileText className="h-6 w-6 text-purple-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Dynamic Forms
                  </h3>
                  <ul className="text-foreground/80 space-y-2 text-sm leading-relaxed font-medium">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />
                      Fields adapt to user input
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />
                      Validated CRM handoffs
                    </li>
                  </ul>
                </div>
                <motion.div
                  className="pointer-events-none absolute right-5 bottom-6 h-1.5 w-24 overflow-hidden rounded-full bg-purple-500/20"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                >
                  <motion.div
                    className="h-full rounded-full bg-purple-500/80"
                    animate={{ x: [-30, 90] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                    style={{ width: 30 }}
                  />
                </motion.div>
                <div className="absolute right-0 bottom-0 -z-10 h-2/3 w-2/3 bg-gradient-to-tl from-purple-500/15 to-transparent opacity-50 blur-2xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20"
                  >
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Live Analytics
                  </h3>
                  <p className="text-foreground/80 mb-6 flex-1 text-sm leading-[1.6] font-medium">
                    Real-time metrics, predictive forecasting, and custom KPI tracking to optimize
                    operational flow. Monitor staff utilization and revenue leaks instantly.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    {[
                      { label: "Revenue", value: "+18%", trend: "up" },
                      { label: "Dropoff", value: "-7%", trend: "down" },
                      { label: "Bookings", value: "+11%", trend: "up" },
                      { label: "Retention", value: "94%", trend: "up" },
                    ].map((m, i) => (
                      <motion.div
                        key={m.label}
                        className="border-border/60 bg-background/80 flex flex-col items-center justify-center rounded-xl border p-2.5 shadow-sm transition-colors group-hover:border-emerald-500/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="text-foreground/70 mb-1 text-xs font-semibold tracking-wider uppercase">
                          {m.label}
                        </div>
                        <div
                          className={`text-base font-black sm:text-lg ${m.trend === "up" ? "text-emerald-500" : "text-foreground"}`}
                        >
                          {m.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-emerald-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20"
                  >
                    <ShieldCheck className="h-6 w-6 text-cyan-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Compliance Guardrails
                  </h3>
                  <p className="text-foreground/80 mb-6 flex-1 text-sm leading-[1.6] font-medium">
                    HIPAA & SOC2 ready infrastructure. Implement strict role-based access controls,
                    comprehensive activity logging, and automatic data retention policies for
                    complete peace of mind.
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      { text: "Role-based matrix", icon: Users },
                      { text: "Detailed audit trail", icon: Search },
                      { text: "Auto data retention", icon: CheckCheck },
                    ].map((item, i) => (
                      <motion.div
                        key={item.text}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="border-border/40 bg-background/50 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors group-hover:border-cyan-500/30"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-cyan-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>

              <SpotlightCard className="group bg-background/70 dark:bg-background/40 flex flex-col justify-between overflow-hidden p-5 md:col-span-2 md:row-span-2 xl:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 transition-colors group-hover:bg-amber-500/20"
                  >
                    <Zap className="h-6 w-6 text-amber-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Automation Engine
                  </h3>
                  <p className="text-foreground/80 mb-6 flex-1 text-sm leading-[1.6] font-medium">
                    Visually map out complex sequences using our drag-and-drop workflow builder.
                    Build timed and event-based flows for reminders, escalations, and automated
                    follow-ups.
                  </p>
                  <div className="relative mt-auto">
                    <div className="flex flex-col gap-2">
                      <motion.div
                        className="h-2 w-full overflow-hidden rounded-full bg-amber-500/10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          className="h-full bg-amber-500"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        />
                      </motion.div>
                      <motion.div
                        className="h-2 w-4/5 overflow-hidden rounded-full bg-amber-500/10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          className="h-full bg-amber-400"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: "easeInOut",
                            delay: 0.2,
                          }}
                        />
                      </motion.div>
                      <motion.div
                        className="h-2 w-3/5 overflow-hidden rounded-full bg-amber-500/10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          className="h-full bg-amber-300"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut",
                            delay: 0.4,
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="absolute right-0 bottom-0 -z-10 h-3/4 w-3/4 bg-gradient-to-tl from-amber-500/15 to-transparent opacity-50 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* ─── INTEGRATIONS ─── */}
        <section
          id="integrations"
          className="border-border/40 bg-secondary/30 relative overflow-hidden border-y py-14 sm:py-20 md:py-24"
        >
          <div className="from-background absolute inset-y-0 left-0 z-10 w-1/3 bg-gradient-to-r to-transparent" />
          <div className="from-background absolute inset-y-0 right-0 z-10 w-1/3 bg-gradient-to-l to-transparent" />

          <div className="mx-auto mb-12 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
              Flawlessly connects with your favorite tools
            </h3>
          </div>

          <div className="animate-marquee flex w-[260%] sm:w-[210%] md:w-[150%]">
            {/* Double the logos to create the infinite loop effect smoothly */}
            {[1, 2].map((set) => (
              <div key={set} className="flex flex-1 items-center justify-around px-4">
                {[
                  "Google Calendar",
                  "Razorpay",
                  "Twilio",
                  "Mailchimp",
                  "Slack",
                  "Zoom",
                  "QuickBooks",
                ].map((logo, i) => (
                  <div
                    key={i}
                    className="text-foreground/60 hover:text-foreground/80 cursor-default px-4 text-base font-black whitespace-nowrap transition-colors sm:px-6 sm:text-lg md:px-8 md:text-2xl"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ─── SOCIAL PROOF - Minimal Numbers ─── */}
        <section className="bg-foreground text-background py-14 sm:py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 text-center sm:gap-12 md:grid-cols-4 md:gap-16">
              {[
                { value: "6", suffix: "+", label: "Tools replaced" },
                { value: "80", suffix: "%", label: "Time saved" },
                { value: "8", suffix: "min", label: "Setup time" },
                { value: "24", suffix: "/7", label: "Uptime" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="from-background to-background/50 mb-3 bg-gradient-to-br bg-clip-text text-3xl font-black tracking-tighter text-transparent sm:text-4xl md:mb-4 md:text-5xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-background/60 text-sm font-bold tracking-widest uppercase md:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="bg-background relative overflow-hidden py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center md:mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mb-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl"
              >
                Loved by <span className="text-primary">service teams</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground mx-auto max-w-lg text-base font-medium sm:text-lg"
              >
                Businesses across industries trust CareOps to streamline their operations.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {[
                {
                  name: "Dr. Priya Sharma",
                  role: "Dental Clinic Owner",
                  quote:
                    "CareOps cut our no-shows by 40% and automated appointment reminders we used to do manually. The AI insights actually predicted our busy days accurately.",
                  rating: 5,
                  color: "from-blue-500/10 to-blue-500/5",
                },
                {
                  name: "Rahul Kapoor",
                  role: "Salon Chain Manager",
                  quote:
                    "Managing 3 locations was chaos before CareOps. Now I have one dashboard for everything — bookings, inventory, staff schedules. Setup took under 10 minutes.",
                  rating: 5,
                  color: "from-purple-500/10 to-purple-500/5",
                },
                {
                  name: "Sneha Desai",
                  role: "Physiotherapy Studio",
                  quote:
                    "The voice AI assistant handles after-hours calls perfectly. Patients love the WhatsApp booking confirmations. It feels like having an extra receptionist.",
                  rating: 5,
                  color: "from-emerald-500/10 to-emerald-500/5",
                },
              ].map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className={`bg-gradient-to-b ${t.color} border-border/40 relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-sm sm:p-8`}
                >
                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {[...Array(t.rating)].map((_, s) => (
                      <svg
                        key={s}
                        className="h-4 w-4 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-6 flex-1 text-sm leading-relaxed font-medium italic sm:text-base">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="from-primary flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br to-purple-500 text-sm font-bold text-white">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-foreground text-sm font-bold">{t.name}</div>
                      <div className="text-muted-foreground text-xs font-medium">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:mt-16"
            >
              {[
                { label: "HIPAA Ready", icon: "🏥" },
                { label: "SOC2 Compliant", icon: "🛡️" },
                { label: "256-bit Encryption", icon: "🔐" },
                { label: "99.9% Uptime SLA", icon: "⚡" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase sm:text-sm"
                >
                  <span className="text-base sm:text-lg">{badge.icon}</span>
                  {badge.label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section
          id="pricing"
          className="bg-background relative overflow-hidden py-14 sm:py-20 lg:py-32"
        >
          <div className="absolute inset-0 z-0">
            <div className="from-primary/10 absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-purple-500/10 to-transparent blur-[150px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-16 md:mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mb-4 text-4xl font-black tracking-tight sm:text-5xl md:mb-6 md:text-6xl"
              >
                Simple, <span className="text-primary italic">transparent</span> pricing.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-muted-foreground mx-auto max-w-2xl text-base font-medium sm:text-lg md:text-xl"
              >
                No hidden fees. No complicated tiers. Pick a plan that scales with your growth.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  id: "free",
                  name: "Starter",
                  price: "Free",
                  period: "forever",
                  features: ["Dashboard access", "50 SMS/month", "Contact forms", "1 staff member"],
                  highlight: false,
                  description: "Perfect for solo practitioners.",
                },
                {
                  id: "growth",
                  name: "Growth",
                  price: "₹1,999",
                  period: "month",
                  features: [
                    "1 phone number",
                    "200 voice minutes",
                    "500 SMS/month",
                    "Email support",
                    "3 staff members",
                  ],
                  highlight: true,
                  description: "Full power for growing teams.",
                },
                {
                  id: "pro",
                  name: "Pro",
                  price: "₹4,999",
                  period: "month",
                  features: [
                    "3 phone numbers",
                    "1000 voice minutes",
                    "2000 SMS/month",
                    "Priority support",
                    "Analytics",
                    "10 staff members",
                  ],
                  highlight: false,
                  description: "Professional grade operations.",
                },
                {
                  id: "enterprise",
                  name: "Enterprise",
                  price: "₹14,999",
                  period: "month",
                  features: [
                    "Unlimited numbers",
                    "Unlimited voice",
                    "Unlimited SMS",
                    "SLA guarantee",
                    "Dedicated support",
                    "Custom integrations",
                  ],
                  highlight: false,
                  description: "Custom scale and security.",
                },
              ].map((plan) => (
                <SpotlightCard
                  key={plan.name}
                  className={`flex flex-col justify-between overflow-hidden p-6 shadow-none sm:p-8 ${
                    plan.highlight
                      ? "border-primary/40 bg-primary/5 shadow-primary/10 shadow-2xl lg:scale-105"
                      : "border-border/40 bg-background/20"
                  }`}
                >
                  {plan.highlight && (
                    <div className="bg-primary text-primary-foreground absolute top-0 right-0 z-20 rounded-bl-xl px-4 py-1 text-[10px] font-black tracking-widest uppercase">
                      Popular
                    </div>
                  )}
                  <div>
                    <h3 className="mb-2 text-xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground mb-6 text-xs font-medium">
                      {plan.description}
                    </p>
                    <div className="mb-8">
                      <span className="text-3xl font-black sm:text-4xl">{plan.price}</span>
                      {plan.price !== "Free" && (
                        <span className="text-muted-foreground ml-2 text-sm">/{plan.period}</span>
                      )}
                    </div>
                    <ul className="mb-8 space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-tight font-medium"
                        >
                          <CheckCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register">
                    <Button
                      className={`h-12 w-full rounded-full font-bold transition-all duration-300 ${
                        plan.highlight
                          ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg hover:opacity-90"
                          : "variant-outline hover:bg-muted/50 border-border/40 text-foreground"
                      }`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.price === "Free" ? "Get Started Free" : "Subscribe Now"}
                    </Button>
                  </Link>

                  {/* Subtle design element for highlighted card */}
                  {plan.highlight && (
                    <div className="bg-primary/10 absolute -right-8 -bottom-8 -z-10 h-24 w-24 rounded-full blur-2xl" />
                  )}
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Ambient base glow */}
          <div className="bg-primary/5 absolute -top-24 left-1/2 -z-10 h-1/2 w-2/3 -translate-x-1/2 rounded-full blur-[150px]" />
        </section>

        {/* ─── Final CTA ─── */}
        <section className="from-background to-primary/5 relative overflow-hidden bg-gradient-to-b py-14 sm:py-20 lg:py-32">
          <div className="absolute inset-0 z-0">
            <div className="from-primary/10 animate-pulse-slow absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-purple-500/10 to-transparent blur-[150px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-foreground mb-8 text-4xl leading-[0.95] font-black tracking-[-0.04em] sm:text-5xl md:mb-12 md:text-6xl"
            >
              The platform you
              <br />
              <span className="text-foreground/30">deserve.</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-6 sm:flex-row"
            >
              <MagneticButton>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-foreground text-background shadow-foreground/20 group relative h-14 min-h-[44px] overflow-hidden rounded-full px-8 text-base font-black shadow-2xl transition-all duration-500 ease-out hover:scale-[1.05] active:scale-[0.95] sm:h-16 sm:px-10 sm:text-lg"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Start Building Now
                    </span>
                    <span className="border-background/20 absolute inset-0 scale-150 rounded-full border opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100" />
                  </Button>
                </Link>
              </MagneticButton>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background border-border/40 relative z-10 border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3 opacity-100 transition-opacity">
              <Logo variant="full" size={24} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
