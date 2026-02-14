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
  Users,
  BarChart3,
  Rocket,
  Play,
  Star,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Workflow,
  Settings,
  Eye,
  Handshake,
  ChevronRight,
  Building2,
  UserCog,
  Link2,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  Check,
  Zap as Lightning,
  Layers,
  Gauge,
  Headphones
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const features = [
  { 
    icon: Calendar, 
    title: "Smart Bookings", 
    description: "Public booking pages, availability management, automatic confirmations & reminders. Customers book without logging in.",
    color: "blue",
    highlights: ["Custom booking pages", "Availability management", "Automated reminders"]
  },
  { 
    icon: MessageSquare, 
    title: "Unified Inbox", 
    description: "All customer communication in one place. Email, SMS, and automated messages with full conversation history.",
    color: "indigo",
    highlights: ["Email & SMS integration", "Conversation history", "Automated responses"]
  },
  { 
    icon: FileText, 
    title: "Dynamic Forms", 
    description: "Contact forms, intake forms, and post-booking forms. Auto-sent and tracked for completion.",
    color: "purple",
    highlights: ["Custom form builder", "Post-booking automation", "Completion tracking"]
  },
  { 
    icon: Package, 
    title: "Inventory Tracking", 
    description: "Track supplies, set thresholds, get alerts when stock runs low. Never run out unexpectedly.",
    color: "emerald",
    highlights: ["Real-time tracking", "Low-stock alerts", "Usage forecasting"]
  },
  { 
    icon: Zap, 
    title: "Automation Engine", 
    description: "Event-based rules that handle follow-ups, reminders, and alerts. No hidden logic - just predictable automation.",
    color: "amber",
    highlights: ["Event-based triggers", "Welcome messages", "Form reminders"]
  },
  { 
    icon: BarChart3, 
    title: "Command Dashboard", 
    description: "Real-time visibility into your business. See bookings, leads, forms, inventory, and alerts at a glance.",
    color: "rose",
    highlights: ["Live overview", "Key alerts", "Drill-down actions"]
  },
];

const stats = [
  { value: "6+", label: "Tools Replaced", description: "Ditch the tool chaos" },
  { value: "80%", label: "Time Saved", description: "Automation advantage" },
  { value: "0", label: "Missed Leads", description: "Never lose a customer" },
  { value: "24/7", label: "Automation", description: "Works while you sleep" },
];

const problems = [
  { icon: AlertTriangle, title: "Tool Chaos", description: "6+ disconnected tools that don't talk to each other" },
  { icon: Clock, title: "Missed Follow-ups", description: "Leads lost because responses are delayed" },
  { icon: Eye, title: "No Visibility", description: "Owners only find problems after damage is done" },
  { icon: Package, title: "Inventory Surprises", description: "Stock runs out unexpectedly" },
];

const solutions = [
  { icon: Handshake, title: "One Platform", description: "Everything connects - bookings, forms, inventory, communication" },
  { icon: Zap, title: "Automated", description: "Event-based automation handles follow-ups automatically" },
  { icon: BarChart3, title: "Full Visibility", description: "Real-time dashboard shows exactly what's happening now" },
  { icon: Bell, title: "Proactive Alerts", description: "Get notified before small issues become big problems" },
];

const steps = [
  { step: "01", title: "Create Workspace", desc: "Business name, address, timezone", icon: Building2 },
  { step: "02", title: "Connect Channels", desc: "Link email & SMS messaging", icon: Link2 },
  { step: "03", title: "Build Forms", desc: "Contact & intake forms", icon: FileText },
  { step: "04", title: "Set Bookings", desc: "Services & availability", icon: Calendar },
  { step: "05", title: "Add Automation", desc: "Event-based rules", icon: Workflow },
  { step: "06", title: "Track Inventory", desc: "Supplies & alerts", icon: Package },
  { step: "07", title: "Invite Staff", desc: "Role-based access", icon: Users },
  { step: "08", title: "Go Live!", desc: "Activate & serve", icon: Rocket },
];

const roles = [
  {
    icon: Settings,
    title: "Business Owner",
    description: "Sets up, configures, monitors. Focuses on visibility and control, not daily execution.",
    abilities: ["System configuration", "Dashboard monitoring", "Staff management", "Automation rules"]
  },
  {
    icon: UserCog,
    title: "Staff User",
    description: "Handles daily operations - communication, bookings, form completion tracking.",
    abilities: ["Manage inbox", "Update bookings", "Track forms", "Cannot change config"]
  },
];

const integrations = [
  { name: "Email", description: "Confirmations, alerts", icon: Mail },
  { name: "SMS", description: "Reminders, updates", icon: Phone },
  { name: "Calendar", description: "Availability sync", icon: Calendar },
  { name: "Webhooks", description: "Custom integrations", icon: Link2 },
];

const testimonials = [
  {
    quote: "CareOps replaced our entire tech stack. We went from 6 tools to 1 platform. Game changer.",
    author: "Sarah Chen",
    role: "Owner, Wellness Studio",
    avatar: "SC"
  },
  {
    quote: "The AI suggestions are incredible. It writes half my messages for me! More time for clients.",
    author: "Marcus Johnson",
    role: "Director, Service Pro",
    avatar: "MJ"
  },
  {
    quote: "Setup took 15 minutes. Within a week, we doubled our booking conversions.",
    author: "Emily Rodriguez",
    role: "Founder, Health Hub",
    avatar: "ER"
  },
];

const benefits = [
  { icon: Layers, title: "All-in-One", description: "Everything you need in one place" },
  { icon: Gauge, title: "Fast Setup", description: "Up and running in minutes" },
  { icon: Headphones, title: "24/7 Support", description: "We're here to help anytime" },
];

// Animation hook
function useInView(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [ref, threshold]);

  return [setRef, isVisible] as const;
}

// Animated section component
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [ref, isVisible] = useInView(0.1);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [ref, isVisible] = useInView(0.5);
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 transform ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
      }`}
    >
      <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        {value}{suffix}
      </span>
    </div>
  );
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">CareOps</span>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-4">
          <a href="#features" onClick={onClose} className="block py-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" onClick={onClose} className="block py-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#roles" onClick={onClose} className="block py-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors">User Roles</a>
          <a href="#testimonials" onClick={onClose} className="block py-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
        </nav>
        <div className="p-4 border-t space-y-3">
          <Link href="/login" onClick={onClose} className="block">
            <Button variant="outline" className="w-full">Sign In</Button>
          </Link>
          <Link href="/register" onClick={onClose} className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-gradient-to-br from-blue-100 via-transparent to-indigo-100 rounded-full opacity-60 animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-gradient-to-tl from-rose-100 via-transparent to-amber-50 rounded-full opacity-50 animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: "7s", animationDelay: "3s" }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">CareOps</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-2">
              {["Features", "How It Works", "User Roles", "Testimonials"].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
            
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 px-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  Get Started Free
                </Button>
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-10 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>AI-Powered Unified Operations Platform</span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
            </AnimatedSection>
            
            {/* Headline */}
            <AnimatedSection className="mb-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-[1.02] tracking-tight">
                One Platform.<br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Every Operation.
                </span>
              </h1>
            </AnimatedSection>
            
            {/* Subheadline */}
            <AnimatedSection className="mb-12">
              <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Replace the chaos of disconnected tools. CareOps unifies bookings, leads, forms, 
                inventory, and communication into one intelligent platform.
              </p>
            </AnimatedSection>
            
            {/* CTA Buttons */}
            <AnimatedSection className="mb-16">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-600/30 h-14 px-10 text-base rounded-xl group w-full sm:w-auto hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    <Rocket className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl border-2 hover:bg-gray-50 bg-transparent hover:border-blue-300 w-full sm:w-auto transition-all duration-300">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Stats Row */}
            <AnimatedSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div 
                    key={stat.label} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <AnimatedCounter value={stat.value} />
                    <div className="text-sm text-gray-900 font-semibold mt-1">{stat.label}</div>
                    <div className="text-xs text-gray-500">{stat.description}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl opacity-10 rotate-12 blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-gradient-to-br from-rose-400 to-amber-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </section>

      {/* Benefits Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={benefit.title}>
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-center md:text-left">
                    <div className="font-semibold">{benefit.title}</div>
                    <div className="text-xs text-gray-500">{benefit.description}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              The Problem with <span className="text-red-500">Service Businesses</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Most service businesses today run on tool chaos. Here's how CareOps solves it.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {/* Problems */}
            <AnimatedSection>
              <h3 className="text-2xl font-bold text-red-600 mb-8 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                The Chaos
              </h3>
              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <div 
                    key={problem.title} 
                    className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 hover:-translate-x-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <problem.icon className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{problem.title}</h4>
                        <p className="text-gray-600">{problem.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            {/* Solutions */}
            <AnimatedSection>
              <h3 className="text-2xl font-bold text-green-600 mb-8 flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                The CareOps Solution
              </h3>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div 
                    key={solution.title} 
                    className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 hover:translate-x-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                        <solution.icon className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{solution.title}</h4>
                        <p className="text-gray-600">{solution.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 lg:py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">scale</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Six powerful modules that work together as one unified system.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title}>
                <div 
                  className="group bg-white rounded-2xl p-8 lg:p-10 border border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-gray-900/5 transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-gray-500">
                        <Check className="w-4 h-4 text-green-500" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 lg:py-32 bg-gradient-to-br from-white via-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              From chaos to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">control</span> in 8 steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Guided onboarding gets you fully operational in minutes. No IT degree required.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((item, index) => (
              <AnimatedSection key={item.step}>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-900/5 transition-all duration-300 group hover:-translate-y-2">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center mt-16">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/25 h-14 px-12 text-base rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                Start Setup <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* User Roles */}
      <section id="roles" className="py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Two roles. <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Complete control.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple role-based access for maximum security and clarity.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {roles.map((role, index) => (
              <AnimatedSection key={role.title}>
                <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-lg shadow-gray-900/5 hover:shadow-2xl hover:shadow-gray-900/10 transition-all duration-500 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <role.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{role.title}</h3>
                  <p className="text-gray-600 mb-8 text-lg">{role.description}</p>
                  <div className="space-y-3">
                    {role.abilities.map((ability) => (
                      <div key={ability} className="flex items-center gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        {ability}
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built-in <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Integrations</span>
            </h2>
            <p className="text-gray-600">Connect the tools you already use</p>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {integrations.map((integration) => (
              <AnimatedSection key={integration.name}>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group">
                  <integration.icon className="w-10 h-10 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-gray-900 text-lg">{integration.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-28 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-1 shadow-2xl">
              <div className="bg-gray-900 rounded-3xl aspect-video flex items-center justify-center relative overflow-hidden group cursor-pointer hover:shadow-blue-900/20 transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
                <div className="relative z-10 text-center">
                  <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto border border-white/20 group-hover:border-white/40">
                    <Play className="w-12 h-12 text-white ml-1" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Watch the Demo</h3>
                  <p className="text-gray-400 text-lg">See CareOps in action - 2 minute overview</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 lg:py-32 bg-gradient-to-br from-indigo-50 via-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Loved by <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">service businesses</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join hundreds of businesses already streamlining with CareOps
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={testimonial.author}>
                <div className="bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-lg shadow-gray-900/5 hover:shadow-2xl hover:shadow-gray-900/10 transition-all duration-500 hover:-translate-y-2">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonial.author}</div>
                      <div className="text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-8">
              Ready to transform your business?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of businesses that have streamlined their operations with CareOps. 
              Start your free trial today - no credit card required.
            </p>
          </AnimatedSection>
          
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-2xl h-16 px-12 text-lg rounded-2xl font-semibold hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
                  <Lightning className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-white/30 text-white hover:bg-white/10 bg-transparent hover:border-white/50 w-full sm:w-auto transition-all duration-300">
                  Sign In
                </Button>
              </Link>
            </div>
          </AnimatedSection>
          
          <AnimatedSection>
            <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                8-step guided setup
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Cancel anytime
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CareOps</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-sm text-gray-500">© 2026 CareOps</span>
            </div>
          </div>
          <div className="mt-12 pt-12 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              Built with ❤️ for service businesses everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
