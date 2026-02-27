import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Blog',
    template: '%s | Noboarding Blog',
  },
  description:
    'Insights on mobile onboarding, A/B testing, conversion optimization, and building better user experiences for React Native apps.',
  openGraph: {
    title: 'Blog — Noboarding',
    description:
      'Insights on mobile onboarding, A/B testing, and conversion optimization.',
    url: '/blog',
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
