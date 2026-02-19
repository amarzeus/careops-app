import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Privacy Policy | CareOps",
    description:
        "Read CareOps's Privacy Policy to understand how we collect, use, and protect your personal data — including Google OAuth, cookies, and advertising.",
    openGraph: {
        title: "Privacy Policy | CareOps",
        description: "How CareOps collects, uses, and protects your personal information.",
        url: "https://careops-app.onrender.com/privacy",
        siteName: "CareOps",
        type: "website",
    },
};

/**
 * Privacy Policy — AdSense & GDPR compliant.
 */
export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-100 sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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

            <div className="bg-gradient-to-b from-blue-50 to-white py-12 px-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-gray-500">Last Updated: February 19, 2026</p>
            </div>

            <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-gray-700 leading-relaxed">

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                    <p>
                        CareOps (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by Amar Kumar
                        (<a href="mailto:amarzeus.dev@gmail.com" className="text-blue-600 hover:underline">amarzeus.dev@gmail.com</a>),
                        is committed to protecting your privacy. This Privacy Policy explains how we
                        collect, use, disclose, and safeguard your information when you use our platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                    <p className="mb-4">We may collect the following categories of information:</p>
                    <ul className="list-disc pl-6 space-y-3">
                        <li><strong>Account Information:</strong> Name, email address, and password (hashed) when you register.</li>
                        <li><strong>Contact Information:</strong> Phone number if provided for SMS features.</li>
                        <li><strong>Calendar Data:</strong> If you connect Google Calendar, we access and sync your calendar events to manage bookings.</li>
                        <li><strong>Business Data:</strong> Bookings, leads, inventory items, forms, and messages you create within the platform.</li>
                        <li><strong>Usage Data:</strong> Pages visited, features used, and error logs — collected to improve the platform.</li>
                        <li><strong>Device &amp; Technical Data:</strong> IP address, browser type, and operating system for security and analytics.</li>
                        <li><strong>Cookie Data:</strong> See our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link> for details.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                    <ul className="list-disc pl-6 space-y-3">
                        <li>Provide, maintain, and improve the CareOps platform.</li>
                        <li>Sync bookings with your connected Google Calendar.</li>
                        <li>Send automated reminders, notifications, and intake forms via email, SMS, and voice.</li>
                        <li>Authenticate your identity and secure your account.</li>
                        <li>Analyse usage patterns to improve features and performance.</li>
                        <li>Display relevant advertisements via Google AdSense (see Section 7).</li>
                        <li>Comply with legal obligations.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Google OAuth API Scopes</h2>
                    <p className="mb-4">
                        CareOps uses Google OAuth 2.0 to authenticate users and to connect Google Calendar.
                        We request only the minimum scopes necessary:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><code className="bg-gray-100 px-1 rounded">openid</code>, <code className="bg-gray-100 px-1 rounded">email</code>, <code className="bg-gray-100 px-1 rounded">profile</code> — for authentication.</li>
                        <li><code className="bg-gray-100 px-1 rounded">https://www.googleapis.com/auth/calendar</code> — to manage bookings in your calendar.</li>
                        <li><code className="bg-gray-100 px-1 rounded">https://www.googleapis.com/auth/calendar.events</code> — to create, update, and delete booking events.</li>
                    </ul>
                    <p className="mt-4 italic text-gray-500">
                        CareOps does not share your Google Calendar data with third parties for marketing
                        or advertising purposes. Use of Google APIs is subject to Google&apos;s Privacy Policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
                    <p className="mb-4">CareOps integrates with the following third-party providers:</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Provider</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Purpose</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Privacy Policy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr><td className="px-4 py-3 font-medium">Google</td><td className="px-4 py-3">Authentication, Calendar sync</td><td className="px-4 py-3"><a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td></tr>
                                <tr className="bg-gray-50/50"><td className="px-4 py-3 font-medium">Twilio</td><td className="px-4 py-3">SMS, WhatsApp, OTP</td><td className="px-4 py-3"><a href="https://www.twilio.com/legal/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td></tr>
                                <tr><td className="px-4 py-3 font-medium">Vapi.ai</td><td className="px-4 py-3">AI voice calls</td><td className="px-4 py-3"><a href="https://vapi.ai/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td></tr>
                                <tr className="bg-gray-50/50"><td className="px-4 py-3 font-medium">Google Gemini</td><td className="px-4 py-3">AI features</td><td className="px-4 py-3"><a href="https://ai.google.dev/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td></tr>
                                <tr><td className="px-4 py-3 font-medium">Google AdSense</td><td className="px-4 py-3">Advertising</td><td className="px-4 py-3"><a href="https://policies.google.com/technologies/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing &amp; Disclosure</h2>
                    <p>
                        We do not sell your personal information. We may share data with the third-party
                        providers listed above only as necessary to provide our services. We may also
                        disclose information if required by law or to protect the rights and safety of
                        CareOps and its users.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Google AdSense &amp; Advertising</h2>
                    <p>
                        CareOps uses Google AdSense to display advertisements. Google, as a third-party
                        vendor, uses cookies (including the DoubleClick cookie) to serve ads based on
                        your prior visits to this website and other websites. You may opt out of
                        personalised advertising by visiting{" "}
                        <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                            Google Ads Settings
                        </a>.
                        See our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link> for more details.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active or as needed to provide
                        our services. You may request deletion of your account and associated data at
                        any time by contacting us. Data will be permanently removed within 30 days of
                        the request.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights</h2>
                    <p className="mb-4">Depending on your location, you may have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access the personal data we hold about you.</li>
                        <li>Request correction of inaccurate data.</li>
                        <li>Request deletion of your data.</li>
                        <li>Object to or restrict the processing of your data.</li>
                        <li>Data portability (receive your data in a machine-readable format).</li>
                    </ul>
                    <p className="mt-4">To exercise these rights, email <a href="mailto:amarzeus.dev@gmail.com" className="text-blue-600 hover:underline">amarzeus.dev@gmail.com</a>.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Security</h2>
                    <p>
                        We implement industry-standard security measures including HTTPS encryption,
                        bcrypt password hashing, and environment-variable-based secret management.
                        However, no system is 100% secure — please use a strong, unique password
                        and report any vulnerabilities to <a href="mailto:amarzeus.dev@gmail.com" className="text-blue-600 hover:underline">amarzeus.dev@gmail.com</a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of
                        significant changes by updating the &quot;Last Updated&quot; date. Continued use
                        of CareOps after changes constitutes acceptance of the updated policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                    <p>
                        For any privacy-related questions, contact:<br /><br />
                        <strong>Amar Kumar</strong><br />
                        <a href="mailto:amarzeus.dev@gmail.com" className="text-blue-600 hover:underline">amarzeus.dev@gmail.com</a><br />
                        <a href="https://github.com/amarzeus/careops-app" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">github.com/amarzeus/careops-app</a>
                    </p>
                </section>
            </main>

            <footer className="border-t border-gray-100 py-12 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© 2026 CareOps by Amar Kumar. All rights reserved.</p>
                    <div className="flex gap-6 items-center">
                        <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
                        <Link href="/cookies" className="hover:text-gray-700">Cookie Policy</Link>
                        <Link href="/faq" className="hover:text-gray-700">FAQ</Link>
                        <a href="https://github.com/amarzeus/careops-app" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
