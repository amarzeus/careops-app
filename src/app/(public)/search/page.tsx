"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Building2, Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion, useReducedMotion } from "framer-motion";

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
      className={`border-border/50 bg-background/40 relative overflow-hidden rounded-[32px] border backdrop-blur-3xl transition-all duration-[500ms] ease-out ${
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
      <div className="relative z-20 flex h-full flex-col">{children}</div>
    </motion.div>
  );
}

interface Workspace {
  id: string;
  name: string;
  address?: string;
  services: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
}

/**
 *
 */
export default function SearchPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/public/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (_error) {
      console.error("Error fetching workspaces:", _error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-background text-foreground selection:bg-primary/30 selection:text-foreground relative flex min-h-screen flex-col overflow-hidden font-sans">
      <CursorGlow />

      {/* Glassmorphic Navbar */}
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
            <span className="from-foreground to-foreground/70 ml-2 hidden bg-gradient-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent sm:block">
              Directory
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 md:flex">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="hover:bg-muted/50 rounded-full text-sm font-bold transition-colors duration-300"
                >
                  Business Login
                </Button>
              </Link>
              <MagneticButton>
                <Link href="/register">
                  <Button className="bg-cta text-cta-foreground shadow-cta/10 group relative overflow-hidden rounded-full px-7 font-bold shadow-xl transition-all duration-300 hover:opacity-90">
                    <span className="relative z-10">List Your Business</span>
                    <div className="from-primary/30 absolute inset-0 bg-gradient-to-r to-purple-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </Button>
                </Link>
              </MagneticButton>
            </div>
            <ThemeToggle />
            <button className="dark:hover:bg-background/10 rounded-full p-2 transition-colors hover:bg-black/5 md:hidden">
              <Menu className="text-foreground h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Premium Liquid Search Hero */}
      <section className="relative overflow-hidden px-4 pt-40 pb-20 text-center">
        {/* Background Orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-primary/20 animate-float absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full opacity-70 mix-blend-screen blur-[120px]" />
          <div className="animate-float-delayed absolute right-[-10%] bottom-[-10%] h-[60%] w-[60%] rounded-full bg-purple-500/20 opacity-50 mix-blend-screen blur-[120px]" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-foreground mb-6 text-[clamp(2.5rem,6vw,4rem)] leading-tight font-black tracking-[-0.03em]"
        >
          Find Local Services & <br />
          <span className="from-primary bg-gradient-to-r via-purple-500 to-amber-500 bg-clip-text text-transparent">
            Book Instantly.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-muted-foreground mx-auto mb-12 max-w-7xl text-lg font-medium md:text-xl"
        >
          Browse top-rated businesses, check real-time availability, and schedule appointments
          without ever signing up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="group relative mx-auto max-w-7xl"
        >
          <div className="from-primary absolute -inset-1 rounded-2xl bg-gradient-to-r to-purple-500 opacity-25 blur transition duration-500 group-hover:opacity-50"></div>
          <div className="bg-background border-border/50 relative flex items-center rounded-2xl border p-2 pl-4 shadow-2xl backdrop-blur-xl transition-all duration-300">
            <Search className="text-muted-foreground mr-3 h-6 w-6" />
            <input
              type="text"
              className="text-foreground placeholder:text-muted-foreground/50 w-full border-none bg-transparent py-3 text-lg outline-none focus:ring-0"
              placeholder="Find plumbers, barbers, consultants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button className="from-primary ml-2 h-12 rounded-xl bg-gradient-to-r to-purple-600 px-8 font-bold transition-opacity hover:opacity-90">
              Search
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Premium Results Grid */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-32 opacity-50">
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
          </div>
        ) : filteredWorkspaces.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkspaces.map((workspace) => (
              <SpotlightCard key={workspace.id} className="flex h-[420px] flex-col">
                {/* Card Header Image Area */}
                <div className="from-muted/50 to-muted/20 border-border/50 relative flex h-40 items-center justify-center overflow-hidden border-b bg-gradient-to-br">
                  <div className="bg-background/5 absolute inset-0 backdrop-blur-sm" />
                  <div className="bg-primary/10 border-primary/20 z-10 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner transition-transform duration-500 hover:scale-110">
                    <Building2 className="text-primary/70 h-8 w-8" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <h3 className="text-foreground mb-1 text-2xl font-bold tracking-tight">
                      {workspace.name}
                    </h3>
                    {workspace.address && (
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
                        <MapPin className="text-primary/70 h-4 w-4" />
                        {workspace.address}
                      </p>
                    )}
                  </div>

                  {/* Services List */}
                  <div className="flex-1 space-y-3 overflow-hidden">
                    {workspace.services.length > 0 ? (
                      <div className="space-y-2">
                        {workspace.services.slice(0, 3).map((service) => (
                          <div
                            key={service.id}
                            className="bg-muted/30 hover:bg-muted/50 border-border/40 flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors"
                          >
                            <span className="text-foreground/80 truncate pr-2 font-medium">
                              {service.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-background/50 shrink-0 backdrop-blur-md"
                            >
                              ${service.price}
                            </Badge>
                          </div>
                        ))}
                        {workspace.services.length > 3 && (
                          <p className="text-primary pt-1 pl-2 text-xs font-bold tracking-wide uppercase">
                            + {workspace.services.length - 3} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground/60 bg-muted/10 border-border/50 flex h-full items-center justify-center rounded-xl border border-dashed text-sm font-medium italic">
                        No services listed
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-border/50 mt-6 flex gap-3 border-t pt-6">
                    <Link href={`/book/${workspace.id}`} className="flex-1">
                      <Button className="bg-cta text-cta-foreground w-full rounded-xl font-bold shadow-md transition-all hover:opacity-90">
                        Book Now
                      </Button>
                    </Link>
                    <Link href={`/contact/${workspace.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="hover:bg-muted/50 border-border/60 w-full rounded-xl font-bold transition-colors"
                      >
                        Contact
                      </Button>
                    </Link>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md px-4 py-32 text-center">
            <div className="bg-muted/50 border-border/50 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border shadow-inner">
              <Search className="text-muted-foreground/50 h-10 w-10" />
            </div>
            <h3 className="mb-2 text-2xl font-bold tracking-tight">No businesses found</h3>
            <p className="text-muted-foreground mb-8 font-medium">
              We couldn&apos;t find anything matching your search. Try adjusting your terms or list
              your own business.
            </p>
            <MagneticButton>
              <Link href="/register">
                <Button className="bg-cta text-cta-foreground shadow-cta/10 rounded-full px-8 py-6 text-lg font-bold shadow-xl transition-colors hover:opacity-90">
                  List Your Business
                </Button>
              </Link>
            </MagneticButton>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-border/40 bg-muted/10 mt-auto border-t py-10 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 lg:px-8">
          <p className="text-muted-foreground text-sm font-medium">
            &copy; 2026 CareOps Directory. All rights reserved.
          </p>
          <a
            href="https://github.com/amarzeus/careops-app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
