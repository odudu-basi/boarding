import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your Noboarding dashboard to manage onboarding flows, view analytics, and run A/B tests.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/login",
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
