"use client";

import Link from "next/link";
import { 
  Calendar, 
  MessageSquare, 
  FileText, 
  Package, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  BarChart3,
  Rocket,
  Star,
  Building2,
  Workflow,
  Menu,
  X,
  Check,
  Zap as Lightning,
  Layers,
  Gauge,
  Headphones,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const features = [
  { 
    icon: Calendar, 
    title: "Smart Bookings", 
    description: "Automated scheduling with public pages, availability management, and instant confirmations.",
    color: "blue"
  },
  { 
    icon: MessageSquare, 
    title: "Unified Inbox", 
    description: "All communication channels in one place. Email, SMS, and AI-powered responses.",
    color: "indigo"
  },
  { 
    icon: FileText, 
    title: "Dynamic Forms", 
    description: "Intelligent forms that auto-send after bookings and track completion seamlessly.",
    color: "purple"
  },
  { 
    icon: Package, 
    title: "Inventory Tracking", 
    description: "Real-time stock monitoring with smart alerts before items run out.",
    color: "emerald"
  },
  { 
    icon: Zap, 
    title: "Automation Engine", 
    description: "Event-driven workflows that handle follow-ups, reminders, and notifications.",
    color: "amber"
  },
  { 
    icon: BarChart3, 
    title: "Command Dashboard", 
    description: "Live business overview with actionable insights and drill-down capabilities.",
    color: "rose"
  },
];

const stats = [
  { value: "6+", label: "Tools Replaced", description: "Consolidate your stack" },
  { value: "80%", label: "Time Saved", description: "Automation advantage" },
  { value: "0", label: "Missed Leads", description: "Never lose a customer" },
  { value: "24/7", label: "Active", description: "Always running" },
];

const steps = [
  { step: "01", title: "Create Workspace", desc: "Set up your business profile" },
  { step: "02", title: "Connect Channels", desc: "Link email & SMS" },
  { step: "03", title: "Build Forms", desc: "Create intake forms" },
  { step: "04", title: "Set Bookings", desc: "Configure services" },
  { step: "05", title: "Add Automation", desc: "Set up workflows" },
  { step: "06", title: "Track Inventory", desc: "Monitor supplies" },
  { step: "07", title: "Invite Staff", desc: "Add team members" },
  { step: "08", title: "Go Live", desc: "Launch operations" },
];

const testimonials = [
  {
    quote: "Replaced 6 tools with one platform. Our operations are now seamless.",
    author: "Sarah Chen",
    role: "Wellness Studio Owner",
    avatar: "SC"
  },
  {
    quote: "The AI suggestions save me hours every week. Incredible time saver.",
    author: "Marcus Johnson",
    role: "Service Director",
    avatar: "MJ"
  },
  {
    quote: "Setup was done in 15 minutes. Doubled our booking conversions.",
    author: "Emily Rodriguez",
    role: "Founder",
    avatar: "ER"
  },
];

const benefits = [
  { icon: Layers, title: "All-in-One", description: "Unified platform" },
  { icon: Gauge, title: "Fast Setup", description: "Minutes, not months" },
  { icon: Headphones, title: "24/7 Support", description: "Always here to help" },
];

// 3D Tilt Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * 8, y: -x * 8 });
    };

    const card = cardRef.current;
    if (isHovered) {
      card?.addEventListener("mousemove", handleMouseMove);
    }
    return () => card?.removeEventListener("mousemove", handleMouseMove);
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 ease-out ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
      }}
    >
      {children}
    </div>
  );
}

// Gradient Orb Animation
function GradientOrb({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute rounded-full blur-3xl opacity-30 animate-pulse ${className}`}
      style={{ animationDuration: "8s", animationDelay: `${delay}s` }}
    />
  );
}

// Floating Element
function FloatingElement({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [offset, setOffset] = useState(0);
  const direction = delay % 2 === 0 ? 1 : -1;

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => prev + direction);
    }, 50);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div
      className={`transition-transform duration-100 ${className}`}
      style={{
        transform: `translateY(${Math.sin(offset * 0.1) * 8}px)`,
      }}
    >
      {children}
    </div>
  );
}

// Gradient Button
function GradientButton({ children, className = "", variant = "primary" }: { children: React.ReactNode; className?: string; variant?: "primary" | "secondary" }) {
  if (variant === "primary") {
    return (
      <button
        className={`
          relative px-8 py-4 rounded-2xl font-semibold text-lg
          bg-gradient-to-r from-blue-600 to-indigo-600 text-white
          shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40
          hover:-translate-y-1 active:translate-y-0
          transition-all duration-300
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      className={`
        px-8 py-4 rounded-2xl font-semibold text-lg
        bg-white text-gray-700 border-2 border-gray-200
        hover:border-gray-300 hover:-translate-y-1
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-white/98 backdrop-blur-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">CareOps</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-4">
          {["Features", "How It Works", "Testimonials"].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`} 
              onClick={onClose} 
              className="block py-4 text-xl font-medium text-gray-700 hover:text-blue-600"
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="p-6 border-t space-y-4">
          <Link href="/login" onClick={onClose} className="block">
            <Button variant="outline" className="w-full h-14 text-lg">Sign In</Button>
          </Link>
          <Link href="/register" onClick={onClose} className="block">
            <Button className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <GradientOrb className="w-[600px] h-[600px] bg-blue-300 -top-40 -left-40" delay={0} />
        <GradientOrb className="w-[500px] h-[500px] bg-indigo-300 top-1/2 right-0" delay={2} />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-300 bottom-0 left-1/4" delay={4} />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgb(0,0,0) 1px, transparent 1px), linear-gradient(90deg, rgb(0,0,0) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-lg py-3" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/25 hover:scale-105 transition-transform">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CareOps</span>
            </div>
            
            <div className="hidden lg:flex items-center gap-2">
              {["Features", "How It Works", "Testimonials"].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  {item}
                </a>
              ))}
            </div>
            
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5">
                  Get Started
                </Button>
              </Link>
            </div>
            
            <button className="lg:hidden p-3 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-10 border border-blue-100 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Operations Platform</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
              One Platform.<br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Every Operation.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Replace scattered tools with one intelligent system. Streamline bookings, communications, inventory, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register">
                <GradientButton className="group">
                  <span className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </GradientButton>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-lg shadow-gray-900/5">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-sm text-gray-900 font-semibold mt-1">{stat.label}</div>
                  <div className="text-xs text-gray-500">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <FloatingElement className="absolute top-1/4 left-[8%] hidden lg:block" delay={0}>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl shadow-2xl rotate-12 opacity-80" />
        </FloatingElement>
        <FloatingElement className="absolute top-1/3 right-[8%] hidden lg:block" delay={1}>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl -rotate-12 opacity-80" />
        </FloatingElement>
        <FloatingElement className="absolute bottom-1/4 left-[15%] hidden lg:block" delay={2}>
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-2xl rotate-6 opacity-80" />
        </FloatingElement>
      </section>

      {/* Benefits */}
      <section className="py-10 bg-gray-50/80 backdrop-blur-sm border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold">{benefit.title}</div>
                  <div className="text-xs text-gray-500">{benefit.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">scale</span> faster
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Six powerful modules working as one unified system.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <TiltCard key={feature.title}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-900/5 h-full hover:shadow-2xl hover:shadow-gray-900/10 transition-all">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 lg:py-36 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              From chaos to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">control</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Launch in 8 simple steps. No technical expertise needed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <TiltCard key={step.step}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
                  <div className="text-4xl font-black text-gray-100 mb-3">{step.step}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/register">
              <GradientButton>
                <span className="flex items-center gap-2">
                  Start Setup
                  <ArrowRight className="w-5 h-5" />
                </span>
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 lg:py-36 bg-gradient-to-br from-indigo-50 via-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">businesses</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Join hundreds of businesses already streamlining with CareOps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TiltCard key={testimonial.author}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-900/5 h-full">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <FloatingElement className="absolute top-20 left-[15%] hidden lg:block" delay={0}>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl" />
        </FloatingElement>
        <FloatingElement className="absolute bottom-20 right-[15%] hidden lg:block" delay={1}>
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full" />
        </FloatingElement>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-8">
            Ready to transform?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of businesses that have streamlined their operations. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <button className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 active:translate-y-0 transition-all">
                <span className="flex items-center gap-2">
                  <Lightning className="w-5 h-5" />
                  Get Started Free
                </span>
              </button>
            </Link>
            <Link href="/login">
              <button className="px-10 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                Sign In
              </button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100">
            <span className="flex items-center gap-2"><Check className="w-5 h-5" />No credit card required</span>
            <span className="flex items-center gap-2"><Check className="w-5 h-5" />8-minute setup</span>
            <span className="flex items-center gap-2"><Check className="w-5 h-5" />Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">CareOps</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white">Terms</Link>
              <span className="text-sm text-gray-500">© 2026 CareOps</span>
            </div>
          </div>
          <div className="mt-12 pt-12 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">Built with ❤️ for service businesses everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
