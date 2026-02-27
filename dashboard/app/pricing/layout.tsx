import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for Noboarding. Monthly credits for AI screen generation, A/B testing, and analytics. Start free, scale as you grow.",
  openGraph: {
    title: "Pricing — Noboarding",
    description:
      "Simple, transparent pricing. Monthly credits for AI screen generation, A/B testing, and analytics.",
    url: "/pricing",
  },
  alternates: {
    canonical: "/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
