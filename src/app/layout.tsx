import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VoiceProvider } from "@/components/providers/voice-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "CareOps - Unified Operations Platform",
  description: "One platform to manage your entire service business - bookings, leads, forms, inventory, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <VoiceProvider>
          {children}
        </VoiceProvider>
      </body>
    </html>
  );
}
