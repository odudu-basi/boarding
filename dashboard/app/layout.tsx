import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.noboarding.co";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Noboarding — Server-Driven Onboarding for React Native",
    template: "%s | Noboarding",
  },
  description:
    "Build, A/B test, and update React Native onboarding flows over the air — no app review required. AI-powered screen generation, analytics, and RevenueCat integration.",
  keywords: [
    "react native onboarding",
    "server-driven UI",
    "mobile onboarding",
    "A/B testing onboarding",
    "over the air updates",
    "react native SDK",
    "onboarding flow builder",
    "mobile app onboarding",
    "AI screen generation",
    "RevenueCat onboarding",
  ],
  authors: [{ name: "Noboarding" }],
  creator: "Noboarding",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Noboarding",
    title: "Noboarding — Server-Driven Onboarding for React Native",
    description:
      "Build, A/B test, and update React Native onboarding flows over the air — no app review required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Noboarding — Server-Driven Onboarding for React Native",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noboarding — Server-Driven Onboarding for React Native",
    description:
      "Build, A/B test, and update React Native onboarding flows over the air — no app review required.",
    images: ["/og-image.png"],
  },
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
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Noboarding",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "React Native (iOS, Android)",
    description:
      "Server-driven onboarding flows for React Native apps with AI generation, A/B testing, and over-the-air updates.",
    url: BASE_URL,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "715",
      offerCount: "4",
    },
    creator: {
      "@type": "Organization",
      name: "Noboarding",
      url: BASE_URL,
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
