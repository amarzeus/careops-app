import Link from "next/link";
import { Calendar, MessageSquare, FileText, Package, Zap, Sparkles, ArrowRight, Activity, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Calendar, title: "Smart Bookings", description: "Public booking pages, availability management, confirmations, and reminders - all automated." },
  { icon: MessageSquare, title: "Unified Inbox", description: "All customer communication in one place. Email, SMS, and automated messages with full history." },
  { icon: FileText, title: "Dynamic Forms", description: "Contact forms, intake forms, and post-booking forms. Auto-sent and tracked for completion." },
  { icon: Package, title: "Inventory Tracking", description: "Track supplies, set thresholds, get alerts, and auto-notify vendors when stock runs low." },
  { icon: Zap, title: "Automation Engine", description: "Event-based rules that handle follow-ups, reminders, and alerts without manual work." },
  { icon: Sparkles, title: "AI-Powered", description: "Gemini AI handles onboarding, suggests replies, generates insights, and writes messages." },
];

const benefits = [
  "Replace 6+ disconnected tools with one platform",
  "Never miss a lead or follow-up again",
  "Automate repetitive tasks and communications",
  "Real-time visibility into your business operations",
  "AI-powered insights and smart suggestions",
  "Set up in minutes with guided onboarding",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareOps</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Operations Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          One Platform.<br />
          <span className="text-blue-600">Every Operation.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Stop juggling disconnected tools. CareOps unifies bookings, leads, forms, inventory,
          and communication into one intelligent platform. <span className="text-indigo-600 font-medium">Click the mic below to ask our AI how we can help your business!</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
              Start Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need, nothing you don&apos;t</h2>
          <p className="text-lg text-gray-600">Built for service businesses that want to operate smarter.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why service businesses choose CareOps</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to streamline your operations?</h2>
        <p className="text-lg text-gray-600 mb-8">Set up your workspace in minutes. No credit card required.</p>
        <Link href="/register">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-500">CareOps</span>
          </div>
          <p className="text-sm text-gray-400">Built for the CareOps Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
