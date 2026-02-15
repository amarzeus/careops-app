import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 *
 */
export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">CareOps</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
                <p className="text-gray-600 mb-6">Last Updated: February 14, 2026</p>

                <section className="space-y-8 prose prose-blue max-w-none">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using the CareOps platform (&quot;Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                        <p className="text-gray-600 leading-relaxed">
                            CareOps provides business operation management tools, including booking systems, inventory tracking, and messaging automation. We may update, modify, or discontinue features at any time.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                        <p className="text-gray-600 leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Our service integrates with third-party providers, including Google (for Calendar), Twilio (for messaging), and Resend (for email). Your use of these integrations is also subject to their respective terms and privacy policies.
                        </p>
                        <p className="text-gray-600 leading-relaxed font-semibold">
                            Specifically regarding Google Calendar:
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            You grant CareOps permission to access and modify your Google Calendar events to facilitate business bookings. We are not responsible for unintended deletions or modifications caused by incorrect system use.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Conduct</h2>
                        <p className="text-gray-600 leading-relaxed">
                            You agree not to use the Platform for any illegal purposes, to send spam, or to interfere with the integrity or performance of the service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the maximum extent permitted by law, CareOps shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to suspend or terminate your access to the Platform at our discretion, without notice, for conduct that we believe violates these Terms.
                        </p>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gray-100 py-12 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-500">© 2026 CareOps Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
