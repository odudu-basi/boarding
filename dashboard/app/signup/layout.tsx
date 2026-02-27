import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Noboarding account. Build server-driven onboarding flows for your React Native app with AI generation and A/B testing.",
  openGraph: {
    title: "Sign Up — Noboarding",
    description:
      "Create a free account and start building server-driven onboarding flows for React Native.",
    url: "/signup",
  },
  alternates: {
    canonical: "/signup",
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
