'use client'

import { theme } from '@/lib/theme'
import Link from 'next/link'

export default function PrivacyPage() {
  const sectionTitle: React.CSSProperties = {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: 700,
    color: theme.colors.text,
    marginTop: 40,
    marginBottom: 16,
    fontFamily: theme.fonts.sans,
  }

  const paragraph: React.CSSProperties = {
    fontSize: theme.fontSizes.base,
    color: '#444',
    lineHeight: 1.8,
    marginBottom: 16,
    fontFamily: theme.fonts.sans,
  }

  const listItem: React.CSSProperties = {
    fontSize: theme.fontSizes.base,
    color: '#444',
    lineHeight: 1.8,
    marginBottom: 8,
    fontFamily: theme.fonts.sans,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f5f0' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 1100,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: theme.fonts.serif,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: theme.fontSizes.lg,
            color: '#f26522',
          }}>
            Noboarding
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/docs" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Docs</Link>
          <Link href="/blog" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Blog</Link>
          <Link href="/pricing" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Pricing</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '140px 24px 80px' }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)',
          fontWeight: 700,
          color: theme.colors.text,
          marginBottom: 8,
          fontFamily: theme.fonts.sans,
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: theme.fontSizes.sm, color: '#999', marginBottom: 48, fontFamily: theme.fonts.sans }}>
          Last updated: February 28, 2026
        </p>

        <p style={paragraph}>
          This Privacy Policy describes how Odanta LLC ("Company", "we", "us", or "our") collects, uses, and protects your information when you use the Noboarding platform, including the dashboard, API, SDK, and all related services (collectively, the "Service").
        </p>

        <h2 style={sectionTitle}>1. Information We Collect</h2>
        <p style={paragraph}>We collect the following types of information:</p>
        <p style={{ ...paragraph, fontWeight: 600 }}>Account Information</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>Name and email address</li>
          <li style={listItem}>Organization name</li>
          <li style={listItem}>Authentication data (via Google OAuth or email/password)</li>
          <li style={listItem}>Billing and payment information (processed by Stripe)</li>
        </ul>
        <p style={{ ...paragraph, fontWeight: 600 }}>Usage Data</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>Onboarding flows and screen configurations you create</li>
          <li style={listItem}>AI screen generation prompts and outputs</li>
          <li style={listItem}>Analytics data from your end users' onboarding sessions (screen views, completion rates, interactions)</li>
          <li style={listItem}>Dashboard activity (pages visited, features used)</li>
        </ul>
        <p style={{ ...paragraph, fontWeight: 600 }}>Technical Data</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>IP address and approximate location</li>
          <li style={listItem}>Browser type and version</li>
          <li style={listItem}>Device information</li>
          <li style={listItem}>Cookies and similar technologies</li>
        </ul>

        <h2 style={sectionTitle}>2. How We Use Your Information</h2>
        <p style={paragraph}>We use your information to:</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>Provide, operate, and maintain the Service</li>
          <li style={listItem}>Process payments and manage subscriptions</li>
          <li style={listItem}>Generate AI-powered onboarding screens based on your prompts</li>
          <li style={listItem}>Provide analytics about your onboarding flows' performance</li>
          <li style={listItem}>Send transactional emails (account verification, billing receipts)</li>
          <li style={listItem}>Improve and develop new features for the Service</li>
          <li style={listItem}>Detect and prevent fraud, abuse, or security incidents</li>
          <li style={listItem}>Comply with legal obligations</li>
        </ul>

        <h2 style={sectionTitle}>3. End User Data</h2>
        <p style={paragraph}>
          When your mobile app users go through onboarding flows powered by Noboarding, we collect analytics data on your behalf, including screen views, completion rates, and interaction events. This data is associated with your organization account and is used to provide you with analytics and insights.
        </p>
        <p style={paragraph}>
          We do not sell end user data to third parties. We process this data solely to provide the Service to you. You are responsible for ensuring your own privacy policy informs your end users about the data collected through the Noboarding SDK.
        </p>

        <h2 style={sectionTitle}>4. Data Sharing</h2>
        <p style={paragraph}>We do not sell your personal information. We may share your data with:</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}><strong>Stripe</strong> — for payment processing</li>
          <li style={listItem}><strong>Supabase</strong> — for database and authentication services</li>
          <li style={listItem}><strong>Vercel</strong> — for hosting and deployment</li>
          <li style={listItem}><strong>Anthropic</strong> — for AI screen generation (your prompts are sent to generate screens)</li>
          <li style={listItem}><strong>Mixpanel</strong> — for product analytics</li>
          <li style={listItem}><strong>Law enforcement</strong> — when required by law, subpoena, or court order</li>
        </ul>

        <h2 style={sectionTitle}>5. Data Retention</h2>
        <p style={paragraph}>
          We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or compliance purposes. Anonymized analytics data may be retained indefinitely.
        </p>

        <h2 style={sectionTitle}>6. Data Security</h2>
        <p style={paragraph}>
          We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), encryption at rest, and secure authentication. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 style={sectionTitle}>7. Cookies</h2>
        <p style={paragraph}>
          We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings, but disabling them may affect the functionality of the Service.
        </p>

        <h2 style={sectionTitle}>8. Your Rights</h2>
        <p style={paragraph}>Depending on your jurisdiction, you may have the right to:</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>Access the personal data we hold about you</li>
          <li style={listItem}>Request correction of inaccurate data</li>
          <li style={listItem}>Request deletion of your data</li>
          <li style={listItem}>Object to or restrict processing of your data</li>
          <li style={listItem}>Data portability (receive your data in a structured format)</li>
          <li style={listItem}>Withdraw consent at any time</li>
        </ul>
        <p style={paragraph}>
          To exercise any of these rights, contact us at <a href="mailto:app@noboarding.co" style={{ color: '#f26522', textDecoration: 'none' }}>app@noboarding.co</a>.
        </p>

        <h2 style={sectionTitle}>9. Children's Privacy</h2>
        <p style={paragraph}>
          The Service is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child under 18, we will take steps to delete it promptly.
        </p>

        <h2 style={sectionTitle}>10. International Data Transfers</h2>
        <p style={paragraph}>
          Your data may be processed and stored in the United States and other countries where our service providers operate. By using the Service, you consent to the transfer of your data to these locations. We ensure appropriate safeguards are in place for international data transfers.
        </p>

        <h2 style={sectionTitle}>11. Changes to This Policy</h2>
        <p style={paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Service and updating the "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the revised policy.
        </p>

        <h2 style={sectionTitle}>12. Contact</h2>
        <p style={paragraph}>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </p>
        <p style={paragraph}>
          Odanta LLC<br />
          Email: <a href="mailto:app@noboarding.co" style={{ color: '#f26522', textDecoration: 'none' }}>app@noboarding.co</a>
        </p>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e5e0d8',
        padding: '32px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: theme.fonts.serif,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: theme.fontSizes.base,
          color: '#f26522',
        }}>
          Noboarding
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/docs" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Docs</Link>
          <Link href="/blog" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Blog</Link>
          <Link href="/terms" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Terms</Link>
          <Link href="/privacy" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666', fontWeight: 600 }}>Privacy</Link>
        </div>
      </footer>

      <style>{`
        @media (max-width: 600px) {
          nav { padding: 10px 16px !important; gap: 8px; }
          nav a { font-size: 13px !important; }
          nav > div { gap: 16px !important; }
          footer { flex-direction: column !important; gap: 16px; text-align: center; }
          footer > div { gap: 16px !important; }
        }
      `}</style>
    </div>
  )
}
