'use client'

import { theme } from '@/lib/theme'
import Link from 'next/link'

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: theme.fontSizes.sm, color: '#999', marginBottom: 48, fontFamily: theme.fonts.sans }}>
          Last updated: February 28, 2026
        </p>

        <p style={paragraph}>
          These Terms of Service ("Terms") govern your access to and use of the Noboarding platform, including the dashboard, API, SDK, and all related services (collectively, the "Service"), operated by Odanta LLC ("Company", "we", "us", or "our").
        </p>
        <p style={paragraph}>
          By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 style={sectionTitle}>1. Eligibility</h2>
        <p style={paragraph}>
          You must be at least 18 years old and have the legal capacity to enter into a binding agreement. If you are using the Service on behalf of a company or organization, you represent that you have authority to bind that entity to these Terms.
        </p>

        <h2 style={sectionTitle}>2. Account Registration</h2>
        <p style={paragraph}>
          To use the Service, you must create an account. You agree to provide accurate, current, and complete information and to keep your account credentials secure. You are responsible for all activity that occurs under your account.
        </p>

        <h2 style={sectionTitle}>3. Use of the Service</h2>
        <p style={paragraph}>You agree to use the Service only for lawful purposes. You shall not:</p>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={listItem}>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li style={listItem}>Use the Service to build a competing product</li>
          <li style={listItem}>Transmit malicious code, viruses, or harmful data</li>
          <li style={listItem}>Attempt to gain unauthorized access to the Service or its systems</li>
          <li style={listItem}>Violate any applicable laws or regulations</li>
          <li style={listItem}>Abuse the AI screen generation system to produce harmful, illegal, or offensive content</li>
        </ul>

        <h2 style={sectionTitle}>4. Subscriptions and Payments</h2>
        <p style={paragraph}>
          Certain features of the Service require a paid subscription. By subscribing, you agree to pay the applicable fees as described on our pricing page. Subscriptions are billed on a recurring monthly basis unless canceled. All fees are non-refundable except as required by law.
        </p>
        <p style={paragraph}>
          We reserve the right to change pricing at any time with 30 days' notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
        </p>

        <h2 style={sectionTitle}>5. Credits</h2>
        <p style={paragraph}>
          The Service uses a credit-based system for AI screen generation. Credits are allocated based on your subscription plan. Unused credits do not roll over between billing cycles unless otherwise stated. Credits have no monetary value and cannot be transferred or sold.
        </p>

        <h2 style={sectionTitle}>6. Intellectual Property</h2>
        <p style={paragraph}>
          The Service, including its design, code, features, and documentation, is owned by Odanta LLC and protected by intellectual property laws. You retain ownership of the content you create using the Service, including onboarding flows, screen designs, and configurations.
        </p>
        <p style={paragraph}>
          We grant you a limited, non-exclusive, non-transferable license to use the SDK solely for the purpose of integrating the Service into your mobile applications.
        </p>

        <h2 style={sectionTitle}>7. Data and Privacy</h2>
        <p style={paragraph}>
          Your use of the Service is also governed by our <Link href="/privacy" style={{ color: '#f26522', textDecoration: 'none' }}>Privacy Policy</Link>. By using the Service, you consent to the collection and use of your data as described therein.
        </p>

        <h2 style={sectionTitle}>8. Availability and Uptime</h2>
        <p style={paragraph}>
          We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any downtime or loss of data resulting from such interruptions.
        </p>

        <h2 style={sectionTitle}>9. Termination</h2>
        <p style={paragraph}>
          You may cancel your account at any time. We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that is harmful to the Service or other users. Upon termination, your right to access the Service ceases immediately.
        </p>

        <h2 style={sectionTitle}>10. Limitation of Liability</h2>
        <p style={paragraph}>
          To the fullest extent permitted by law, Odanta LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of the Service.
        </p>
        <p style={paragraph}>
          Our total liability for any claim arising from or related to the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
        </p>

        <h2 style={sectionTitle}>11. Disclaimer of Warranties</h2>
        <p style={paragraph}>
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h2 style={sectionTitle}>12. Governing Law</h2>
        <p style={paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts located in Delaware.
        </p>

        <h2 style={sectionTitle}>13. Changes to These Terms</h2>
        <p style={paragraph}>
          We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on the Service and updating the "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the revised Terms.
        </p>

        <h2 style={sectionTitle}>14. Contact</h2>
        <p style={paragraph}>
          If you have any questions about these Terms, please contact us at <a href="mailto:app@noboarding.co" style={{ color: '#f26522', textDecoration: 'none' }}>app@noboarding.co</a>.
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
          <Link href="/terms" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666', fontWeight: 600 }}>Terms</Link>
          <Link href="/privacy" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Privacy</Link>
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
