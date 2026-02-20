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
            className={`relative overflow-hidden rounded-[32px] border border-border/50 bg-background/40 backdrop-blur-3xl transition-all duration-[500ms] ease-out ${isHovered ? "border-primary/40 shadow-2xl shadow-primary/10" : "shadow-sm"
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
            <div className="relative z-20 h-full flex flex-col">
                {children}
            </div>
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

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-primary/30 selection:text-foreground">
            <CursorGlow />

            {/* Glassmorphic Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[600ms] ${scrolled
                    ? "bg-background/70 backdrop-blur-2xl border-b border-border/40 py-3 shadow-sm"
                    : "bg-transparent py-6"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo variant="full" size={32} />
                        <span className="font-bold text-xl tracking-tight hidden sm:block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent ml-2">Directory</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="ghost" className="text-sm font-bold rounded-full hover:bg-muted/50 transition-colors duration-300">
                                    Business Login
                                </Button>
                            </Link>
                            <MagneticButton>
                                <Link href="/register">
                                    <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-7 shadow-xl shadow-foreground/10 font-bold transition-all duration-300 relative overflow-hidden group">
                                        <span className="relative z-10">List Your Business</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </Button>
                                </Link>
                            </MagneticButton>
                        </div>
                        <ThemeToggle />
                        <button className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-background/10 transition-colors">
                            <Menu className="w-5 h-5 text-foreground" />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Premium Liquid Search Hero */}
            <section className="relative pt-40 pb-20 px-4 text-center overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-float opacity-70" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen animate-float-delayed opacity-50" />
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-[clamp(2.5rem,6vw,4rem)] font-black tracking-[-0.03em] leading-tight text-foreground mb-6"
                >
                    Find Local Services & <br />
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent">Book Instantly.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-muted-foreground mb-12 max-w-7xl mx-auto text-lg md:text-xl font-medium"
                >
                    Browse top-rated businesses, check real-time availability, and schedule appointments without ever signing up.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="max-w-7xl mx-auto relative group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative flex items-center bg-background border border-border/50 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 p-2 pl-4">
                        <Search className="text-muted-foreground w-6 h-6 mr-3" />
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-foreground text-lg py-3 placeholder:text-muted-foreground/50 focus:ring-0"
                            placeholder="Find plumbers, barbers, consultants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button className="rounded-xl px-8 h-12 ml-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity font-bold">
                            Search
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* Premium Results Grid */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
                {loading ? (
                    <div className="flex justify-center items-center py-32 opacity-50">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : filteredWorkspaces.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredWorkspaces.map((workspace) => (
                            <SpotlightCard key={workspace.id} className="flex flex-col h-[420px]">
                                {/* Card Header Image Area */}
                                <div className="h-40 relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 border-b border-border/50 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-background/5 backdrop-blur-sm" />
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner z-10 transition-transform duration-500 hover:scale-110">
                                        <Building2 className="w-8 h-8 text-primary/70" />
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-bold tracking-tight mb-1 text-foreground">{workspace.name}</h3>
                                        {workspace.address && (
                                            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                                <MapPin className="w-4 h-4 text-primary/70" />
                                                {workspace.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* Services List */}
                                    <div className="space-y-3 flex-1 overflow-hidden">
                                        {workspace.services.length > 0 ? (
                                            <div className="space-y-2">
                                                {workspace.services.slice(0, 3).map((service) => (
                                                    <div key={service.id} className="flex items-center justify-between text-sm bg-muted/30 hover:bg-muted/50 border border-border/40 px-3 py-2 rounded-xl transition-colors">
                                                        <span className="font-medium text-foreground/80 truncate pr-2">{service.name}</span>
                                                        <Badge variant="outline" className="bg-background/50 backdrop-blur-md shrink-0">
                                                            ${service.price}
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {workspace.services.length > 3 && (
                                                    <p className="text-xs text-primary font-bold pl-2 pt-1 tracking-wide uppercase">
                                                        + {workspace.services.length - 3} more
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-sm font-medium text-muted-foreground/60 italic bg-muted/10 rounded-xl border border-dashed border-border/50">
                                                No services listed
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-6 pt-6 border-t border-border/50">
                                        <Link href={`/book/${workspace.id}`} className="flex-1">
                                            <Button className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl shadow-md transition-all">
                                                Book Now
                                            </Button>
                                        </Link>
                                        <Link href={`/contact/${workspace.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full font-bold rounded-xl hover:bg-muted/50 border-border/60 transition-colors">
                                                Contact
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 px-4 max-w-md mx-auto">
                        <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border/50 shadow-inner">
                            <Search className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2">No businesses found</h3>
                        <p className="text-muted-foreground font-medium mb-8">
                            We couldn&apos;t find anything matching your search. Try adjusting your terms or list your own business.
                        </p>
                        <MagneticButton>
                            <Link href="/register">
                                <Button className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-8 py-6 text-lg font-bold transition-colors">
                                    List Your Business
                                </Button>
                            </Link>
                        </MagneticButton>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 bg-muted/10 py-10 mt-auto backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-between gap-4 text-center sm:flex-row">
                    <p className="text-sm font-medium text-muted-foreground">&copy; 2026 CareOps Directory. All rights reserved.</p>
                    <a
                        href="https://github.com/amarzeus/careops-app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}

