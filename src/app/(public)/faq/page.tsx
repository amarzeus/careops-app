import type { Metadata } from "next";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ – Frequently Asked Questions | CareOps",
  description:
    "Find answers to the most common questions about CareOps — bookings, AI features, integrations, billing, privacy, and more.",
  openGraph: {
    title: "FAQ | CareOps",
    description: "Answers to the most common questions about CareOps operations platform.",
    url: "https://careops-app.onrender.com/faq",
    siteName: "CareOps",
    type: "website",
  },
};

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is CareOps?",
        a: "CareOps is a unified operations platform for service businesses. It consolidates bookings, lead management, intake forms, inventory tracking, automated messaging, and AI-powered voice reception into a single dashboard — eliminating tool chaos.",
      },
      {
        q: "Who is CareOps built for?",
        a: "CareOps is designed for small-to-medium service businesses: medical practices, wellness centres, cleaning companies, salons, consulting firms, and any business that manages appointments, clients, and supplies.",
      },
      {
        q: "How do I get started?",
        a: "Sign up for an account, complete the AI-guided onboarding (takes under 5 minutes), connect your calendar and messaging providers, and your operations are live. The onboarding assistant walks you through every step.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes. You can explore CareOps with a free workspace. No credit card is required to sign up.",
      },
    ],
  },
  {
    category: "Bookings & Calendar",
    items: [
      {
        q: "How does the calendar sync work?",
        a: "CareOps integrates with Google Calendar via OAuth 2.0. When a booking is created or updated in CareOps, a corresponding event is created (or updated) in your connected Google Calendar in real time, preventing double-bookings.",
      },
      {
        q: "Can clients book appointments themselves?",
        a: "Yes. Each workspace has a public booking link (e.g. /book/[workspaceId]) that clients can use to self-schedule based on your availability.",
      },
      {
        q: "Does CareOps send booking reminders?",
        a: "Yes. CareOps uses Vapi.ai to make automated outbound voice calls before appointments, and Twilio to send SMS reminders. Both are configurable per workspace.",
      },
    ],
  },
  {
    category: "AI Features",
    items: [
      {
        q: "What AI is powering CareOps?",
        a: "CareOps uses Google Gemini 2.0 (Flash and Pro variants) for the onboarding assistant, smart reply engine, inventory forecasting, intake form generation, and operational anomaly detection.",
      },
      {
        q: "What is the AI Voice Receptionist?",
        a: "The voice receptionist is powered by Vapi.ai and can make outbound calls to confirm appointments, collect intake information, and transfer complex situations to a human. It runs 24/7 without manual intervention.",
      },
      {
        q: "Can CareOps scan invoices automatically?",
        a: "Yes. The Inventory Scan feature uses Gemini's multimodal vision API to extract line items, quantities, and vendor details from a photograph or uploaded image of an invoice.",
      },
    ],
  },
  {
    category: "Integrations",
    items: [
      {
        q: "Which integrations does CareOps support?",
        a: "CareOps integrates with Google Calendar (scheduling), Google Gemini (AI), Vapi.ai (voice), Twilio (SMS/WhatsApp/OTP), and SMTP/Nodemailer (email). More integrations are on the roadmap.",
      },
      {
        q: "How do I connect Google Calendar?",
        a: "Go to Settings → Integrations → Google Calendar and click Connect. You will be redirected to Google's OAuth consent screen. Once authorised, your calendar syncs automatically.",
      },
      {
        q: "Can I use my own Twilio or Vapi credentials?",
        a: "Yes. Bring-your-own-key is supported. Add your Twilio Account SID, Auth Token, and phone number (and your Vapi API key) in your .env file or via the Settings → Integrations panel.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    items: [
      {
        q: "How is my data stored?",
        a: "All data is stored in a PostgreSQL database. Passwords are hashed with bcrypt. API keys and secrets are stored as environment variables and never exposed to the client.",
      },
      {
        q: "Does CareOps share my data with third parties?",
        a: "No. CareOps does not sell or share your data with third parties for advertising. Data is only shared with the integrated services you explicitly authorise (e.g. Google Calendar, Twilio) to perform the functions you request.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. Contact amarzeus.dev@gmail.com to request full account deletion. Your data will be permanently removed within 30 days.",
      },
      {
        q: "Does CareOps use cookies?",
        a: "Yes. CareOps uses essential session cookies for authentication and, if you opt in, analytics cookies to improve the platform. See our Cookie Policy for full details.",
      },
    ],
  },
  {
    category: "Technical & Open Source",
    items: [
      {
        q: "Is CareOps open source?",
        a: "Yes. CareOps is open source under the MIT License. The full source code is available on GitHub at github.com/amarzeus/careops-app.",
      },
      {
        q: "What is the tech stack?",
        a: "CareOps is built with Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS, Radix UI, Vitest, and Playwright. It deploys on Render.",
      },
      {
        q: "How do I report a bug or request a feature?",
        a: "Open an issue on our GitHub repository. Use the Bug Report template for bugs and the Feature Request template for new ideas. For security issues, please email amarzeus.dev@gmail.com directly.",
      },
    ],
  },
];

/**
 * FAQ page — structured content for SEO and Google AdSense readiness.
 */
export default function FAQPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Schema.org FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.flatMap((cat) =>
              cat.items.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              }))
            ),
          }),
        }}
      />

      {/* Nav */}
      <nav className="border-border/40 bg-background/90 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="full" size={32} />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-50 to-white px-6 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
            <HelpCircle className="text-primary h-8 w-8" />
          </div>
        </div>
        <h1 className="text-foreground mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mx-auto max-w-7xl text-xl">
          Everything you need to know about CareOps. Can&apos;t find an answer?{" "}
          <a href="mailto:amarzeus.dev@gmail.com" className="text-primary hover:underline">
            Email us
          </a>
          .
        </p>
      </div>

      {/* FAQ Content */}
      <main className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {faqs.map((category) => (
          <section key={category.category}>
            <h2 className="text-foreground border-border/40 mb-8 flex items-center gap-2 border-b pb-3 text-2xl font-bold">
              <ChevronDown className="text-primary h-5 w-5" />
              {category.category}
            </h2>
            <div className="space-y-6">
              {category.items.map((item) => (
                <div key={item.q} className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-foreground mb-3 text-lg font-semibold">{item.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-primary rounded-2xl p-10 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">Still have questions?</h2>
          <p className="mb-6 text-blue-100">
            Our team is happy to help. Drop us an email and we&apos;ll get back to you within 24
            hours.
          </p>
          <a
            href="mailto:amarzeus.dev@gmail.com"
            className="bg-background text-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors hover:bg-blue-50"
          >
            Contact Support
          </a>
        </div>
      </main>

      <footer className="border-border/40 bg-muted/30 border-t py-12">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 CareOps by Amar Kumar. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-muted-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-muted-foreground">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-muted-foreground">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
