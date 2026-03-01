import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Noboarding. Read about account usage, subscriptions, credits, intellectual property, and data handling policies.",
  openGraph: {
    title: "Terms of Service — Noboarding",
    description:
      "Terms of Service for the Noboarding onboarding-as-a-service platform, operated by Odanta LLC.",
    url: "/terms",
  },
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
