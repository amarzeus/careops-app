/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  FileText,
  Zap,
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
            ? `perspective(1200px) rotateX(${(mousePos.y - 200) * -0.015}deg) rotateY(${(mousePos.x - 200) * 0.015}deg) scale3d(1.02, 1.02, 1.02)`
            : "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
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
      className={`fixed top-4 right-4 left-4 z-50 rounded-2xl transition-all duration-[600ms] ${
        scrolled
          ? "bg-background/80 border-border/40 border py-3 shadow-lg backdrop-blur-2xl"
          : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
            className="dark:hover:bg-background/10 rounded-full p-2 transition-colors hover:bg-black/5 md:hidden"
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
      <div className="bg-background/90 border-border/50 rounded-xl border p-3 shadow-xl backdrop-blur-md">
        <p className="text-muted-foreground mb-1 text-sm font-medium">{label}</p>
        <p className="from-primary bg-gradient-to-r to-purple-500 bg-clip-text text-xl font-bold text-transparent">
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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-32 pb-20"
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
          className="bg-background/40 text-foreground border-foreground/10 mb-12 inline-flex items-center gap-2 rounded-full border px-6 py-2 text-xs font-extrabold shadow-sm backdrop-blur-md"
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
          className="text-foreground mb-6 text-[clamp(3rem,8vw,5.5rem)] leading-[0.9] font-black tracking-[-0.04em]"
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
          className="text-muted-foreground mx-auto mb-10 max-w-7xl text-lg leading-relaxed font-medium md:text-xl"
        >
          The absolute pinnacle of service operations. Replace your entire fragmented stack with one
          beautifully unified engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center gap-6 sm:flex-row"
        >
          <MagneticButton>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-cta text-cta-foreground shadow-cta/20 hover:shadow-cta/30 h-16 rounded-full px-12 text-lg font-bold shadow-2xl transition-all duration-400 ease-out hover:scale-[1.04] active:scale-[0.96]"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Hero 3D Mockup - Liquid Glass Style */}
      <motion.div
        initial={{ opacity: 0, y: 150, rotateX: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-24 w-full max-w-7xl px-6"
        style={{ perspective: 1500 }}
      >
        <motion.div
          style={{
            rotateX: prefersReducedMotion ? 0 : rotateX,
            rotateY: prefersReducedMotion ? 0 : rotateY,
          }}
          className="bg-background/40 relative aspect-[16/10] w-full overflow-hidden rounded-[32px] border border-white/20 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] backdrop-blur-[40px] dark:border-white/10 dark:bg-black/40 dark:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* Faux dashboard glowing grid lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+Cjwvc3ZnPg==')] opacity-[0.03] dark:opacity-[0.05]" />

          <div className="pointer-events-none absolute inset-0 flex flex-col p-8">
            {/* Dashboard Header */}
            <div className="border-border/40 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                </div>
                <div className="bg-muted/30 border-border/20 flex h-8 w-48 items-center rounded-lg border px-3">
                  <Search className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-muted-foreground text-xs">Search patients...</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-muted/50 border-border/50 flex h-8 w-8 items-center justify-center rounded-full border transition-colors">
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
            <div className="mt-6 flex flex-1 gap-6">
              {/* Sidebar List */}
              <div className="hidden w-48 flex-col gap-2 md:flex">
                {[
                  { icon: LayoutDashboard, label: "Overview", active: true },
                  { icon: Calendar, label: "Appointments", active: false },
                  { icon: Users, label: "Patients", active: false },
                  { icon: FileText, label: "Invoices", active: false },
                  { icon: Settings, label: "Settings", active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex h-10 items-center gap-3 rounded-xl border border-transparent px-3 transition-colors ${item.active ? "bg-primary/10 border-primary/20 text-primary shadow-sm" : "bg-muted/10 text-muted-foreground"}`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${item.active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main Area */}
              <div className="flex flex-1 flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6">
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
                      className={`rounded-2xl bg-gradient-to-b ${stat.color} border-border/40 flex flex-col justify-between border p-5 shadow-sm ring-1 backdrop-blur-md ring-inset ${stat.ring}`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-muted-foreground text-sm font-semibold">
                          {stat.title}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stat.trendColor}`}
                        >
                          {stat.trend}
                        </span>
                      </div>
                      <span className="text-foreground text-2xl font-black tracking-tight">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Real Recharts Area */}
                <div className="bg-muted/10 border-border/40 pointer-events-auto relative flex flex-1 flex-col overflow-hidden rounded-2xl border p-4 shadow-inner backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <h3 className="text-foreground text-sm font-bold">Revenue Overview</h3>
                    <span className="text-muted-foreground text-xs font-medium">Last 7 Days</span>
                  </div>
                  <div className="min-h-[200px] w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={mockChartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          dy={10}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
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
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chromatic aberration & glass sweep */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent mix-blend-overlay" />
          <div className="box-shadow-inner pointer-events-none absolute inset-0 rounded-[32px] border border-white/20" />
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
        <section id="features" className="bg-background relative z-10 py-32 lg:py-56">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row">
              <div className="max-w-7xl">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl leading-[0.85] font-black tracking-[-0.05em] md:text-7xl lg:text-[100px]"
                >
                  Unrivaled
                  <br />
                  <span className="text-foreground/20">excellence.</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-muted-foreground mb-4 max-w-sm text-xl font-medium"
              >
                Six powerful modules engineered for maximum efficiency.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Large Card: Smart Bookings */}
              <SpotlightCard className="group bg-background/40 flex min-h-[300px] flex-col justify-between overflow-hidden p-6 md:col-span-2 md:row-span-2 md:p-8 lg:min-h-[380px] lg:p-10">
                <div className="relative z-10">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[16px] border border-blue-500/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-transform duration-500 ease-out group-hover:scale-110">
                    <Calendar className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight">Smart Bookings</h3>
                  <p className="text-muted-foreground max-w-sm text-base leading-relaxed font-medium">
                    Public scheduling pages with real-time availability, automated confirmations,
                    and flawless calendar sync.
                  </p>
                </div>

                {/* Decorative background element for large card */}
                <div className="absolute right-0 bottom-0 -z-10 h-2/3 w-2/3 bg-gradient-to-tl from-blue-500/10 to-transparent opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -right-10 -bottom-10 -z-10 hidden h-48 w-48 rounded-full border border-blue-500/20 sm:flex" />
                <div className="absolute -right-20 -bottom-20 -z-10 hidden h-64 w-64 rounded-full border border-blue-500/20 sm:flex" />
              </SpotlightCard>

              {/* Small Card 1: Unified Inbox */}
              <SpotlightCard className="group bg-background/40 flex min-h-[220px] flex-col justify-between overflow-hidden p-6 md:col-span-1 md:p-8">
                <div className="relative z-10">
                  <div className="bg-primary/10 border-primary/20 mb-5 flex h-10 w-10 items-center justify-center rounded-[12px] border transition-transform duration-500 ease-out group-hover:scale-110">
                    <MessageSquare className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Unified Inbox
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                    Email, SMS, and AI responses organized in one interface.
                  </p>
                </div>
                <div className="from-primary/10 absolute right-0 bottom-0 -z-10 h-1/2 w-1/2 bg-gradient-to-tl to-transparent opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </SpotlightCard>

              {/* Small Card 2: Dynamic Forms */}
              <SpotlightCard className="group bg-background/40 flex min-h-[220px] flex-col justify-between overflow-hidden p-6 md:col-span-1 md:p-8">
                <div className="relative z-10">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[12px] border border-purple-500/20 bg-purple-500/10 transition-transform duration-500 ease-out group-hover:scale-110">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">
                    Dynamic Forms
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                    Intelligent intake workflows that adapt to user responses.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 -z-10 h-1/2 w-1/2 bg-gradient-to-tl from-purple-500/10 to-transparent opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </SpotlightCard>

              {/* Wide Card: Automation Engine */}
              <SpotlightCard className="group bg-background/40 flex min-h-[200px] flex-col items-start justify-between overflow-hidden p-6 md:col-span-3 md:flex-row md:items-center md:p-8 lg:p-10">
                <div className="relative z-10 max-w-xl">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] border border-amber-500/20 bg-amber-500/10 transition-transform duration-500 ease-out group-hover:scale-110">
                    <Zap className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight">Automation Engine</h3>
                  <p className="text-muted-foreground text-base leading-relaxed font-medium">
                    Event-driven workflows for reminders, follow-ups, and notifications running
                    silently in the background.
                  </p>
                </div>

                {/* Decorative abstract diagram or rings for wide card */}
                <div className="pointer-events-none relative z-10 mt-6 flex w-full flex-1 justify-end md:mt-0 md:w-auto">
                  <div className="relative h-32 w-32 opacity-80 transition-opacity duration-700 group-hover:opacity-100 md:h-40 md:w-40">
                    <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-amber-500/30" />
                    <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-dashed border-amber-500/30" />
                    <div className="absolute inset-8 animate-[spin_8s_linear_infinite] rounded-full border border-amber-500/20" />
                    <div className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-amber-500/10 blur-md" />
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-50 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* ─── INTEGRATIONS ─── */}
        <section
          id="integrations"
          className="border-border/40 bg-secondary/30 relative overflow-hidden border-y py-24"
        >
          <div className="from-background absolute inset-y-0 left-0 z-10 w-1/3 bg-gradient-to-r to-transparent" />
          <div className="from-background absolute inset-y-0 right-0 z-10 w-1/3 bg-gradient-to-l to-transparent" />

          <div className="mx-auto mb-12 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
              Flawlessly connects with your favorite tools
            </h3>
          </div>

          <div className="animate-marquee flex w-[200%] md:w-[150%]">
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
                    className="text-foreground/20 hover:text-foreground/40 cursor-default px-8 text-xl font-black whitespace-nowrap transition-colors md:text-2xl"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ─── SOCIAL PROOF - Minimal Numbers ─── */}
        <section className="bg-foreground text-background py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-16 text-center md:grid-cols-4">
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
                  <div className="from-background to-background/50 mb-4 bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tighter text-transparent md:text-6xl">
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

        {/* ─── PRICING ─── */}
        <section id="pricing" className="bg-background relative overflow-hidden py-40 lg:py-64">
          <div className="absolute inset-0 z-0">
            <div className="from-primary/10 absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-purple-500/10 to-transparent blur-[150px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-20 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mb-6 text-5xl font-black tracking-tight md:text-7xl"
              >
                Simple, <span className="text-primary italic">transparent</span> pricing.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-muted-foreground mx-auto max-w-2xl text-xl font-medium"
              >
                No hidden fees. No complicated tiers. Pick a plan that scales with your growth.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  className={`flex flex-col justify-between overflow-hidden p-8 shadow-none ${
                    plan.highlight
                      ? "border-primary/40 bg-primary/5 shadow-primary/10 scale-105 shadow-2xl"
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
                      <span className="text-4xl font-black">{plan.price}</span>
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
        <section className="from-background to-primary/5 relative overflow-hidden bg-gradient-to-b py-40 lg:py-64">
          <div className="absolute inset-0 z-0">
            <div className="from-primary/10 animate-pulse-slow absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r via-purple-500/10 to-transparent blur-[150px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-foreground mb-12 text-6xl leading-[0.9] font-black tracking-[-0.05em] md:text-8xl"
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
                    className="bg-foreground text-background shadow-foreground/20 group relative h-20 overflow-hidden rounded-full px-14 text-xl font-black shadow-2xl transition-all duration-500 ease-out hover:scale-[1.05] active:scale-[0.95]"
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
            <div className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
              <Logo variant="full" size={24} />
            </div>
            <div className="flex items-center gap-8">
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
