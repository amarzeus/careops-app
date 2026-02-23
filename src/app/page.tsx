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
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

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
      className="pointer-events-none fixed inset-0 z-[100] hidden md:block mix-blend-screen dark:mix-blend-color-dodge transition-opacity duration-500 ease-in-out"
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
function MagneticButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.15, y: (e.clientY - cy) * 0.15 });
  }, [prefersReducedMotion]);

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [prefersReducedMotion]);

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
      className={`relative overflow-hidden rounded-[32px] border border-border/50 bg-background/5 backdrop-blur-3xl transition-all duration-[500ms] ease-out ${isHovered ? "border-primary/40 shadow-2xl shadow-primary/10" : "shadow-sm"
        } ${className}`}
      style={{
        transform: isHovered && !prefersReducedMotion
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
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
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-[600ms] rounded-2xl ${scrolled
        ? "bg-background/80 backdrop-blur-2xl border border-border/40 py-3 shadow-lg"
        : "bg-transparent py-4"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo variant="full" size={32} />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {["Features", "Integrations", "Pricing"].map((item) => (
            <a
              key={item}
              href={item === "Pricing" ? "#pricing" : `#${item.toLowerCase()}`}
              className="text-sm font-semibold tracking-wide text-foreground/70 hover:text-foreground transition-all duration-300 flex items-center gap-2"
            >
              {item}
              {item === "Pricing" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Beta</span>
              )}
            </a>
          ))}
          <Link
            href="/search"
            className="text-sm font-semibold tracking-wide text-foreground/70 hover:text-foreground transition-all duration-300"
          >
            Find a Business
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-bold rounded-full hover:bg-muted/50 transition-colors duration-300">
                Log In
              </Button>
            </Link>
            <MagneticButton>
              <Link href="/register">
                <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-7 shadow-xl shadow-foreground/10 font-bold transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </Link>
            </MagneticButton>
          </div>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-background/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
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
      <div className="bg-background/90 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Liquid morphing background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-gradient-to-r from-purple-500/10 to-amber-500/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float-delayed" style={{ animationDuration: '15s' }} />
      </div>

      {/* Text Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-background/40 backdrop-blur-md text-foreground text-xs font-extrabold mb-12 border border-foreground/10 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">Next-Generation Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(3rem,8vw,5.5rem)] font-black tracking-[-0.04em] leading-[0.9] text-foreground mb-6"
        >
          Operations,
          <br />
          <span className="relative inline-block mt-1">
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent blur-xl opacity-40 animate-pulse-slow" />
            <span className="relative bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              liquid smooth.
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-muted-foreground max-w-7xl mx-auto mb-10 leading-relaxed font-medium"
        >
          The absolute pinnacle of service operations. Replace your entire fragmented stack with one beautifully unified engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <MagneticButton>
            <Link href="/register">
              <Button
                size="lg"
                className="h-16 px-12 rounded-full text-lg font-bold bg-cta text-cta-foreground shadow-2xl shadow-cta/20 hover:shadow-cta/30 hover:scale-[1.04] active:scale-[0.96] transition-all duration-400 ease-out"
              >
                Start Free Trial
                <ArrowRight className="ml-3 w-5 h-5" />
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
          style={{ rotateX: prefersReducedMotion ? 0 : rotateX, rotateY: prefersReducedMotion ? 0 : rotateY }}
          className="relative w-full aspect-[16/10] rounded-[32px] overflow-hidden border border-white/20 dark:border-white/10 bg-background/40 dark:bg-black/40 backdrop-blur-[40px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* Faux dashboard glowing grid lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+Cjwvc3ZnPg==')] opacity-[0.03] dark:opacity-[0.05]" />

          <div className="absolute inset-0 p-8 flex flex-col pointer-events-none">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                </div>
                <div className="h-8 w-48 bg-muted/30 rounded-lg flex items-center px-3 border border-border/20">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-xs text-muted-foreground">Search patients...</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 transition-colors">
                  <Bell className="w-4 h-4 text-foreground/70" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">AK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 flex gap-6 mt-6">
              {/* Sidebar List */}
              <div className="w-48 hidden md:flex flex-col gap-2">
                {[
                  { icon: LayoutDashboard, label: "Overview", active: true },
                  { icon: Calendar, label: "Appointments", active: false },
                  { icon: Users, label: "Patients", active: false },
                  { icon: FileText, label: "Invoices", active: false },
                  { icon: Settings, label: "Settings", active: false },
                ].map((item, i) => (
                  <div key={i} className={`h-10 rounded-xl px-3 flex items-center gap-3 transition-colors border border-transparent ${item.active ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' : 'bg-muted/10 text-muted-foreground'}`}>
                    <item.icon className={`w-4 h-4 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main Area */}
              <div className="flex-1 flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { title: "Total Revenue", value: "₹24,500", trend: "+12.5%", color: "from-blue-500/20 to-blue-500/5", ring: "ring-blue-500/20", trendColor: "text-green-500 bg-green-500/10" },
                    { title: "New Bookings", value: "145", trend: "+5.2%", color: "from-purple-500/20 to-purple-500/5", ring: "ring-purple-500/20", trendColor: "text-green-500 bg-green-500/10" },
                    { title: "Cancellations", value: "3", trend: "-2.1%", color: "from-orange-500/20 to-orange-500/5", ring: "ring-orange-500/20", trendColor: "text-red-500 bg-red-500/10" },
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-2xl bg-gradient-to-b ${stat.color} border border-border/40 backdrop-blur-md p-5 flex flex-col justify-between shadow-sm ring-1 ring-inset ${stat.ring}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">{stat.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trendColor}`}>{stat.trend}</span>
                      </div>
                      <span className="text-2xl font-black tracking-tight text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Real Recharts Area */}
                <div className="flex-1 rounded-2xl bg-muted/10 border border-border/40 backdrop-blur-md relative overflow-hidden flex flex-col p-4 shadow-inner pointer-events-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-sm font-bold text-foreground">Revenue Overview</h3>
                    <span className="text-xs font-medium text-muted-foreground">Last 7 Days</span>
                  </div>
                  <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} dy={10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
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
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 box-shadow-inner border border-white/20 rounded-[32px] pointer-events-none" />
        </motion.div>

        {/* Ambient base glow */}
        <div className="absolute -z-10 bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-1/2 bg-primary/20 blur-[150px] rounded-full mix-blend-screen" />
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
    <div className="min-h-screen bg-background selection:bg-foreground/10 selection:text-foreground overflow-hidden">
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
            className="fixed inset-0 z-[60] bg-background/80 md:hidden"
          >
            <div className="flex flex-col h-full p-8 relative z-10">
              <div className="flex items-center justify-between mb-16">
                <Logo variant="full" size={32} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-full bg-background/10 border border-white/20 backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
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
                    className="text-4xl font-black tracking-[-0.04em] text-foreground hover:text-primary transition-colors"
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
                    className="text-4xl font-black tracking-[-0.04em] text-foreground/60 hover:text-primary transition-colors"
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
                      <Button variant="ghost" className="w-full text-xl h-14 font-bold rounded-2xl">
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
                      <Button className="w-full h-16 text-xl bg-cta text-cta-foreground font-bold rounded-2xl shadow-xl shadow-cta/10">
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
        <section id="features" className="py-32 lg:py-56 bg-background relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="max-w-7xl">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl md:text-7xl lg:text-[100px] font-black tracking-[-0.05em] leading-[0.85]"
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
                className="text-xl font-medium text-muted-foreground max-w-sm mb-4"
              >
                Six powerful modules engineered for maximum efficiency.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Card: Smart Bookings */}
              <SpotlightCard className="md:col-span-2 md:row-span-2 p-6 md:p-8 lg:p-10 min-h-[300px] lg:min-h-[380px] flex flex-col justify-between group overflow-hidden bg-background/40">
                <div className="z-10 relative">
                  <div className="w-12 h-12 rounded-[16px] bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 ease-out shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">Smart Bookings</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium max-w-sm">
                    Public scheduling pages with real-time availability, automated confirmations, and flawless calendar sync.
                  </p>
                </div>

                {/* Decorative background element for large card */}
                <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-blue-500/10 to-transparent blur-3xl -z-10 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                <div className="absolute -right-10 -bottom-10 w-48 h-48 border border-blue-500/20 rounded-full sm:flex hidden -z-10" />
                <div className="absolute -right-20 -bottom-20 w-64 h-64 border border-blue-500/20 rounded-full sm:flex hidden -z-10" />
              </SpotlightCard>

              {/* Small Card 1: Unified Inbox */}
              <SpotlightCard className="md:col-span-1 p-6 md:p-8 min-h-[220px] flex flex-col justify-between group overflow-hidden bg-background/40">
                <div className="z-10 relative">
                  <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center mb-5 border border-primary/20 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 tracking-tight">Unified Inbox</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Email, SMS, and AI responses organized in one interface.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-primary/10 to-transparent blur-2xl -z-10 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
              </SpotlightCard>

              {/* Small Card 2: Dynamic Forms */}
              <SpotlightCard className="md:col-span-1 p-6 md:p-8 min-h-[220px] flex flex-col justify-between group overflow-hidden bg-background/40">
                <div className="z-10 relative">
                  <div className="w-10 h-10 rounded-[12px] bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 tracking-tight">Dynamic Forms</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Intelligent intake workflows that adapt to user responses.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl from-purple-500/10 to-transparent blur-2xl -z-10 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
              </SpotlightCard>

              {/* Wide Card: Automation Engine */}
              <SpotlightCard className="md:col-span-3 p-6 md:p-8 lg:p-10 min-h-[200px] flex flex-col md:flex-row items-start md:items-center justify-between group overflow-hidden bg-background/40">
                <div className="max-w-xl z-10 relative">
                  <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">Automation Engine</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                    Event-driven workflows for reminders, follow-ups, and notifications running silently in the background.
                  </p>
                </div>

                {/* Decorative abstract diagram or rings for wide card */}
                <div className="relative mt-6 md:mt-0 w-full md:w-auto flex-1 flex justify-end z-10 pointer-events-none">
                  <div className="w-32 h-32 md:w-40 md:h-40 relative opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 rounded-full border border-dashed border-amber-500/30 animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-8 rounded-full border border-amber-500/20 animate-[spin_8s_linear_infinite]" />
                    <div className="absolute inset-0 m-auto w-10 h-10 bg-amber-500/10 rounded-full blur-md" />
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-3xl -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* ─── INTEGRATIONS ─── */}
        <section id="integrations" className="py-24 border-y border-border/40 bg-secondary/30 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Flawlessly connects with your favorite tools</h3>
          </div>

          <div className="flex w-[200%] md:w-[150%] animate-marquee">
            {/* Double the logos to create the infinite loop effect smoothly */}
            {[1, 2].map((set) => (
              <div key={set} className="flex flex-1 justify-around items-center px-4">
                {['Google Calendar', 'Razorpay', 'Twilio', 'Mailchimp', 'Slack', 'Zoom', 'QuickBooks'].map((logo, i) => (
                  <div key={i} className="text-xl md:text-2xl font-black text-foreground/20 whitespace-nowrap px-8 hover:text-foreground/40 transition-colors cursor-default">
                    {logo}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ─── SOCIAL PROOF - Minimal Numbers ─── */}
        <section className="py-32 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
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
                  <div className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-background to-background/50">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm md:text-base font-bold tracking-widest uppercase text-background/60">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* ─── PRICING ─── */}
        <section id="pricing" className="py-40 lg:py-64 relative overflow-hidden bg-background">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent rounded-full blur-[150px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-black tracking-tight mb-6"
              >
                Simple, <span className="text-primary italic">transparent</span> pricing.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto"
              >
                No hidden fees. No complicated tiers. Pick a plan that scales with your growth.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  features: ["1 phone number", "200 voice minutes", "500 SMS/month", "Email support", "3 staff members"],
                  highlight: true,
                  description: "Full power for growing teams.",
                },
                {
                  id: "pro",
                  name: "Pro",
                  price: "₹4,999",
                  period: "month",
                  features: ["3 phone numbers", "1000 voice minutes", "2000 SMS/month", "Priority support", "Analytics", "10 staff members"],
                  highlight: false,
                  description: "Professional grade operations.",
                },
                {
                  id: "enterprise",
                  name: "Enterprise",
                  price: "₹14,999",
                  period: "month",
                  features: ["Unlimited numbers", "Unlimited voice", "Unlimited SMS", "SLA guarantee", "Dedicated support", "Custom integrations"],
                  highlight: false,
                  description: "Custom scale and security.",
                },
              ].map((plan) => (
                <SpotlightCard
                  key={plan.name}
                  className={`p-8 flex flex-col justify-between overflow-hidden shadow-none ${plan.highlight
                    ? "border-primary/40 bg-primary/5 scale-105 shadow-2xl shadow-primary/10"
                    : "border-border/40 bg-background/20"
                    }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-bl-xl z-20">
                      Popular
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-6 font-medium">{plan.description}</p>
                    <div className="mb-8">
                      <span className="text-4xl font-black">{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-muted-foreground text-sm ml-2">/{plan.period}</span>}
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm font-medium leading-tight">
                          <CheckCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register">
                    <Button
                      className={`w-full rounded-full h-12 font-bold transition-all duration-300 ${plan.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                        : "variant-outline hover:bg-muted/50 border-border/40 text-foreground"
                        }`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.price === "Free" ? "Get Started Free" : "Subscribe Now"}
                    </Button>
                  </Link>

                  {/* Subtle design element for highlighted card */}
                  {plan.highlight && (
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
                  )}
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Ambient base glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-primary/5 blur-[150px] -z-10 rounded-full" />
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-40 lg:py-64 relative overflow-hidden bg-gradient-to-b from-background to-primary/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent rounded-full blur-[150px] animate-pulse-slow" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black tracking-[-0.05em] leading-[0.9] text-foreground mb-12"
            >
              The platform you
              <br />
              <span className="text-foreground/30">
                deserve.
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <MagneticButton>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-20 px-14 rounded-full text-xl font-black bg-foreground text-background shadow-2xl shadow-foreground/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-500 ease-out relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Start Building Now
                    </span>
                    <span className="absolute inset-0 rounded-full border border-background/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 ease-out" />
                  </Button>
                </Link>
              </MagneticButton>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background py-8 border-t border-border/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
              <Logo variant="full" size={24} />
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
