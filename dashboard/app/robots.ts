import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/home', '/onboarding', '/analytics', '/flows/', '/ab-tests/', '/settings', '/api/'],
      },
    ],
    sitemap: 'https://www.noboarding.co/sitemap.xml',
  }
}
