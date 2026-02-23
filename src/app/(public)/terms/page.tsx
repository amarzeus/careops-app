import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 *
 */
export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen">
      <nav className="border-border/40 border-b">
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

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-foreground mb-8 text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last Updated: February 14, 2026</p>

        <section className="prose prose-blue max-w-none space-y-8">
          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the CareOps platform (&quot;Platform&quot;), you agree to be
              bound by these Terms of Service. If you do not agree to these terms, please do not use
              the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              CareOps provides business operation management tools, including booking systems,
              inventory tracking, and messaging automation. We may update, modify, or discontinue
              features at any time.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Our service integrates with third-party providers, including Google (for Calendar),
              Twilio (for messaging), and Resend (for email). Your use of these integrations is also
              subject to their respective terms and privacy policies.
            </p>
            <p className="text-muted-foreground leading-relaxed font-semibold">
              Specifically regarding Google Calendar:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You grant CareOps permission to access and modify your Google Calendar events to
              facilitate business bookings. We are not responsible for unintended deletions or
              modifications caused by incorrect system use.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">5. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Platform for any illegal purposes, to send spam, or to
              interfere with the integrity or performance of the service.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, CareOps shall not be liable for any indirect,
              incidental, or consequential damages resulting from your use of the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your access to the Platform at our
              discretion, without notice, for conduct that we believe violates these Terms.
            </p>
          </div>
          <div>
            <h2 className="text-foreground mb-4 text-2xl font-bold">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-muted/30 border-border/40 mt-4 rounded-lg border p-4">
              <p className="text-foreground font-semibold">Amar Kumar</p>
              <a href="mailto:amarzeus.dev@gmail.com" className="text-primary hover:underline">
                amarzeus.dev@gmail.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border/40 bg-muted/30 border-t py-12">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 CareOps by Amar Kumar. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-muted-foreground">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-muted-foreground">
              Cookie Policy
            </Link>
            <Link href="/faq" className="hover:text-muted-foreground">
              FAQ
            </Link>
            <a
              href="https://github.com/amarzeus/careops-app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
