import type { Metadata } from "next";
import { ArrowLeft, Cookie } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cookie Policy | CareOps",
  description:
    "Learn how CareOps uses cookies and similar tracking technologies. Understand your choices and how to manage cookies in your browser.",
  openGraph: {
    title: "Cookie Policy | CareOps",
    description: "How CareOps uses cookies and how you can manage your preferences.",
    url: "https://careops-app.onrender.com/cookies",
    siteName: "CareOps",
    type: "website",
  },
};

/**
 * Cookie Policy page — required for Google AdSense approval.
 */
export default function CookiePolicyPage() {
  return (
    <div className="bg-background min-h-screen">
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

      <div className="bg-gradient-to-b from-amber-50 to-white px-6 py-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Cookie className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-foreground mb-2 text-4xl font-bold">Cookie Policy</h1>
        <p className="text-muted-foreground">Last Updated: February 19, 2026</p>
      </div>

      <main className="text-muted-foreground mx-auto max-w-7xl space-y-10 px-4 py-12 leading-relaxed sm:px-6 lg:px-8">
        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that a website stores on your device when you visit it.
            They are widely used to make websites function efficiently, to provide analytics
            information, and to enable advertising features.
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">2. How We Use Cookies</h2>
          <p className="mb-4">CareOps uses cookies for the following purposes:</p>
          <div className="overflow-x-auto">
            <table className="border-border/40 w-full overflow-hidden rounded-lg border text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                    Category
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                    Purpose
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                    Required?
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Essential</td>
                  <td className="px-4 py-3">
                    Session authentication, security tokens, CSRF protection
                  </td>
                  <td className="px-4 py-3 font-medium text-green-600">Yes</td>
                </tr>
                <tr className="bg-muted/30/50">
                  <td className="px-4 py-3 font-medium">Preference</td>
                  <td className="px-4 py-3">
                    Remembering your theme (light/dark) and language settings
                  </td>
                  <td className="px-4 py-3 font-medium text-yellow-600">Optional</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Analytics</td>
                  <td className="px-4 py-3">
                    Understanding how users navigate the platform to improve it
                  </td>
                  <td className="px-4 py-3 font-medium text-yellow-600">Optional</td>
                </tr>
                <tr className="bg-muted/30/50">
                  <td className="px-4 py-3 font-medium">Advertising</td>
                  <td className="px-4 py-3">
                    Delivering relevant ads via Google AdSense. Google may use cookies to show
                    personalised ads based on your visits to this and other sites.
                  </td>
                  <td className="px-4 py-3 font-medium text-yellow-600">Optional</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">3. Third-Party Cookies</h2>
          <p className="mb-4">We use services that may set their own cookies on your device:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Google AdSense</strong> — Serves advertisements on our platform. Google uses
              the DoubleClick cookie to serve ads based on your prior visits. You can opt out at{" "}
              <a
                href="https://www.google.com/settings/ads"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              .
            </li>
            <li>
              <strong>Google Analytics</strong> — Helps us understand usage patterns. Data is
              anonymised and aggregated.
            </li>
            <li>
              <strong>Google OAuth</strong> — Used when you sign in with Google or connect Google
              Calendar. Subject to{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">4. Managing Cookies</h2>
          <p className="mb-4">
            You can control and/or delete cookies as you wish. You can delete all cookies already on
            your device and set most browsers to prevent them from being placed. Note that disabling
            essential cookies will impair the functionality of CareOps.
          </p>
          <p className="mb-4">Browser-specific guidance:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/en-gb/guide/safari/sfri11471"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">
            5. Google&apos;s Personalised Advertising
          </h2>
          <p>
            CareOps uses Google AdSense to display advertisements. Google may use cookies and web
            beacons to collect data about your visits to this and other websites to provide relevant
            advertisements. For more information or to opt out of personalised advertising, visit{" "}
            <a
              href="https://www.aboutads.info/choices/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>{" "}
            or{" "}
            <a
              href="https://www.youronlinechoices.com/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              youronlinechoices.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">6. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this
            page with an updated revision date. Continued use of CareOps after changes constitutes
            your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-2xl font-bold">7. Contact Us</h2>
          <p>
            For any questions about our use of cookies, contact{" "}
            <a href="mailto:amarzeus.dev@gmail.com" className="text-primary hover:underline">
              amarzeus.dev@gmail.com
            </a>
            .
          </p>
        </section>
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
            <Link href="/faq" className="hover:text-muted-foreground">
              FAQ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
