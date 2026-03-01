import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Noboarding. Learn how Odanta LLC collects, uses, and protects your data when using the Noboarding platform, SDK, and API.",
  openGraph: {
    title: "Privacy Policy — Noboarding",
    description:
      "How Noboarding collects, uses, and protects your data. Operated by Odanta LLC.",
    url: "/privacy",
  },
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
