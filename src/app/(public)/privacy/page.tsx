import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                <p className="text-gray-600 mb-6">Last Updated: February 14, 2026</p>

                <section className="space-y-8 prose prose-blue max-w-none">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            CareOps ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use our services, including our Google Calendar integration.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            When you use CareOps, we may collect the following information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Contact Information</strong>: Name, email address, and phone number.</li>
                            <li><strong>Calendar Data</strong>: If you connect your Google Calendar, we access your calendar events to sync bookings and prevent double-booking.</li>
                            <li><strong>Usage Data</strong>: Information about how you use our platform to improve our services.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li>Provide and maintain our platform.</li>
                            <li>Sync bookings with your connected calendar.</li>
                            <li>Send automated reminders and notifications.</li>
                            <li>Improve platform performance and user experience.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Google OAuth API Scopes</h2>
                        <p className="text-gray-600 leading-relaxed">
                            CareOps requests access to your Google Calendar to manage bookings. We specifically use the following scopes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-4">
                            <li><code>https://www.googleapis.com/auth/calendar</code>: To see, edit, share, and permanently delete all the calendars you can access using Google Calendar.</li>
                            <li><code>https://www.googleapis.com/auth/calendar.events</code>: To view and edit events on all your calendars.</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-4 italic">
                            CareOps does not share your calendar data with third parties for marketing or advertising purposes.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We retain your information only as long as necessary to provide our services or as required by law. You can disconnect your Google Calendar or delete your account at any time.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at privacy@careops-hackathon.example.com.
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
