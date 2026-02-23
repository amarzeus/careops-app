import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 *
 */
export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo variant="full" size={32} />
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
                <p className="text-muted-foreground mb-6">Last Updated: February 14, 2026</p>

                <section className="space-y-8 prose prose-blue max-w-none">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using the CareOps platform (&quot;Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            CareOps provides business operation management tools, including booking systems, inventory tracking, and messaging automation. We may update, modify, or discontinue features at any time.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">4. Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Our service integrates with third-party providers, including Google (for Calendar), Twilio (for messaging), and Resend (for email). Your use of these integrations is also subject to their respective terms and privacy policies.
                        </p>
                        <p className="text-muted-foreground leading-relaxed font-semibold">
                            Specifically regarding Google Calendar:
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            You grant CareOps permission to access and modify your Google Calendar events to facilitate business bookings. We are not responsible for unintended deletions or modifications caused by incorrect system use.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">5. Prohibited Conduct</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree not to use the Platform for any illegal purposes, to send spam, or to interfere with the integrity or performance of the service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To the maximum extent permitted by law, CareOps shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">7. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate your access to the Platform at our discretion, without notice, for conduct that we believe violates these Terms.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/40">
                            <p className="font-semibold text-foreground">Amar Kumar</p>
                            <a href="mailto:amarzeus.dev@gmail.com" className="text-primary hover:underline">amarzeus.dev@gmail.com</a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border/40 py-12 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© 2026 CareOps by Amar Kumar. All rights reserved.</p>
                    <div className="flex gap-6 items-center">
                        <Link href="/terms" className="hover:text-muted-foreground">Terms of Service</Link>
                        <Link href="/cookies" className="hover:text-muted-foreground">Cookie Policy</Link>
                        <Link href="/faq" className="hover:text-muted-foreground">FAQ</Link>
                        <a href="https://github.com/amarzeus/careops-app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
