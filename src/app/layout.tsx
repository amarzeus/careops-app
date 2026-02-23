import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VoiceProvider } from "@/components/providers/voice-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://careops-app.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CareOps – Unified Service Operations Platform",
    template: "%s | CareOps",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  description:
    "CareOps is the all-in-one operations platform for service businesses. Manage bookings, leads, intake forms, inventory, automated messaging, and AI voice reception from one dashboard.",
  keywords: [
    "service business management",
    "booking system",
    "appointment scheduling",
    "AI receptionist",
    "inventory management",
    "lead management",
    "business operations platform",
    "CareOps",
  ],
  authors: [{ name: "Amar Kumar", url: "https://github.com/amarzeus" }],
  creator: "Amar Kumar",
  publisher: "CareOps",
  category: "Business Software",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "CareOps",
    title: "CareOps – Unified Service Operations Platform",
    description:
      "One platform to manage your entire service business — bookings, leads, forms, inventory, AI voice receptionist, and more.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "CareOps – Unified Service Operations Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareOps – Unified Service Operations Platform",
    description:
      "AI-powered operations platform for service businesses. Bookings, inventory, voice agents, and more.",
    images: ["/images/og-image.png"],
    creator: "@amarzeus",
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: "google2370b9081550b6c5",
  },
};

/**
 *
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense — replace ca-pub-XXXXXXXXXXXXXXXX with your publisher ID */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Schema.org: Organization + WebApplication structured data */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "CareOps",
                url: BASE_URL,
                logo: `${BASE_URL}/favicon.ico`,
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "amarzeus.dev@gmail.com",
                  contactType: "customer support",
                },
                sameAs: ["https://github.com/amarzeus/careops-app"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "CareOps",
                url: BASE_URL,
                applicationCategory: "BusinessApplication",
                operatingSystem: "All",
                description:
                  "Unified operations platform for service businesses — bookings, AI voice, inventory, leads, and automation.",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                author: {
                  "@type": "Person",
                  name: "Amar Kumar",
                  email: "amarzeus.dev@gmail.com",
                },
              },
            ]),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VoiceProvider>{children}</VoiceProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
