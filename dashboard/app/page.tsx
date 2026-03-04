'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { theme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'

/* ── Scroll reveal hook ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { setIsVisible(entry.isIntersecting) },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

/* ── Animated card wrapper ── */
function AnimatedCard({ children, delay = 0, style, dark = false }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
  dark?: boolean
}) {
  const { ref, isVisible } = useScrollReveal()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: dark ? '#1a1a1a' : '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        border: dark ? 'none' : '1px solid #e5e0d8',
        position: 'relative',
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? hovered ? 'translateY(-4px)' : 'translateY(0)'
          : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
        boxShadow: hovered
          ? dark ? '0 12px 40px rgba(0,0,0,0.3)' : '0 12px 40px rgba(0,0,0,0.08)'
          : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    // Trigger hero entrance animations
    requestAnimationFrame(() => {
      setNavVisible(true)
      setTimeout(() => setHeroLoaded(true), 150)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Scroll reveal refs for each section
  const featuresHeader = useScrollReveal()
  const howItWorksHeader = useScrollReveal()
  const ctaSection = useScrollReveal()
  const footerSection = useScrollReveal(0.3)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f5f0',
      position: 'relative',
      fontFamily: theme.fonts.sans,
      overflowX: 'hidden',
    }}>

      {/* ── Glassmorphic Navbar ── */}
      <nav style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: navVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-80px)',
        opacity: navVisible ? 1 : 0,
        width: 'calc(100% - 32px)',
        maxWidth: 1100,
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '12px 28px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
        transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease-out',
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: theme.fonts.serif,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '1.35rem',
            color: '#f26522',
          }}>
            Noboarding
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[
            { href: '#features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/docs', label: 'Docs' },
            { href: '/blog', label: 'Blog' },
          ].map((link) => (
            <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
          ))}
          {isLoggedIn ? (
            <NavButton href="/home">Dashboard</NavButton>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <NavButton href="/signup">Sign up</NavButton>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 80px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Animated background orbs */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242,101,34,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          opacity: heroLoaded ? 1 : 0,
          transition: 'opacity 1.5s ease-out',
        }} />

        {/* Eyebrow label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          borderRadius: 9999,
          backgroundColor: 'rgba(242,101,34,0.08)',
          border: '1px solid rgba(242,101,34,0.15)',
          marginBottom: 28,
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#f26522',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#f26522',
            fontFamily: theme.fonts.sans,
          }}>
            Server-driven onboarding for React Native
          </span>
        </div>

        {/* Main heading — the problem */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
          fontWeight: 600,
          lineHeight: 1.12,
          color: '#1a1a1a',
          maxWidth: 820,
          margin: '0 0 24px',
          fontFamily: theme.fonts.sans,
          letterSpacing: '-0.03em',
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s ease-out 0.1s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        }}>
          Your onboarding is your{' '}
          <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>sales pitch.</span>
          <br />
          Are you testing it?
        </h1>

        {/* Subheading — why it matters */}
        <p style={{
          fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: '#666',
          maxWidth: 600,
          lineHeight: 1.65,
          margin: '0 0 20px',
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
        }}>
          Two different onboarding flows on the same paywall can produce dramatically different conversion rates. Most founders never test this.
        </p>

        {/* How we solve it — short line */}
        <p style={{
          fontSize: theme.fontSizes.base,
          color: '#999',
          maxWidth: 520,
          lineHeight: 1.6,
          margin: '0 0 44px',
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
        }}>
          Build, A/B test, and iterate on your onboarding — without shipping an app update.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
        }}>
          <a
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '15px 36px',
              backgroundColor: '#f26522',
              color: '#fff',
              fontSize: theme.fontSizes.base,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 12,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 16px rgba(242, 101, 34, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(242, 101, 34, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(242, 101, 34, 0.3)'
            }}
          >
            Start building for free
          </a>
          <a
            href="/docs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '15px 36px',
              backgroundColor: 'transparent',
              color: '#1a1a1a',
              fontSize: theme.fontSizes.base,
              fontWeight: 500,
              textDecoration: 'none',
              borderRadius: 12,
              border: '1px solid #d5d0c8',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = '#f26522'
              e.currentTarget.style.color = '#f26522'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = '#d5d0c8'
              e.currentTarget.style.color = '#1a1a1a'
            }}
          >
            Read the docs
          </a>
        </div>

        {/* Social proof */}
        <p style={{
          marginTop: 20,
          fontSize: theme.fontSizes.xs,
          color: '#999',
          opacity: heroLoaded ? 1 : 0,
          transition: 'opacity 0.6s ease-out 0.6s',
        }}>
          No credit card required · 5 min setup
        </p>
      </section>

      {/* ── Features Section ── */}
      <section id="features" style={{
        padding: '80px 24px 100px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {/* Section header */}
        <div ref={featuresHeader.ref} style={{
          textAlign: 'center',
          marginBottom: 64,
          opacity: featuresHeader.isVisible ? 1 : 0,
          transform: featuresHeader.isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}>
          <p style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#f26522',
            margin: '0 0 12px',
          }}>
            Platform
          </p>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: '0 0 16px',
            fontFamily: theme.fonts.sans,
            letterSpacing: '-0.02em',
          }}>
            Everything you need to{' '}
            <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>optimize</span>
          </h2>
          <p style={{
            fontSize: theme.fontSizes.base,
            color: '#666',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            From building flows to measuring results — all in one platform.
          </p>
        </div>

        {/* Feature cards — top row: 2col + 1col */}
        <div className="features-grid-top" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}>
          {/* Card 1: OTA Updates — spans 2 columns */}
          <AnimatedCard delay={0} style={{ gridColumn: 'span 2' }}>
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(242,101,34,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <p style={{
              fontSize: theme.fontSizes.xs,
              fontWeight: 600,
              color: '#f26522',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}>
              Over-the-air updates
            </p>
            <h3 style={{
              fontSize: theme.fontSizes['2xl'],
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 12px',
              fontFamily: theme.fonts.sans,
            }}>
              Change flows{' '}
              <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>without</span> an app review
            </h3>
            <p style={{
              fontSize: theme.fontSizes.sm,
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 420,
              margin: 0,
            }}>
              Edit screens, reorder steps, update copy, or swap images — all from the dashboard. Your users see changes instantly, no app store submission needed.
            </p>
          </AnimatedCard>

          {/* Card 2: A/B Testing — dark card */}
          <AnimatedCard delay={0.1} dark style={{
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontSize: theme.fontSizes.xs,
                fontWeight: 600,
                color: '#f26522',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 12px',
              }}>
                A/B Testing
              </p>
              <h3 style={{
                fontSize: theme.fontSizes['2xl'],
                fontWeight: 600,
                margin: '0 0 12px',
                fontFamily: theme.fonts.sans,
                color: '#fff',
              }}>
                Test{' '}
                <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>everything</span>
              </h3>
              <p style={{
                fontSize: theme.fontSizes.sm,
                color: '#a0a0a0',
                lineHeight: 1.7,
                margin: 0,
              }}>
                Split traffic between flow variants. Measure completion rates, conversions, and revenue. Find what works, then ship the winner to everyone.
              </p>
            </div>
          </AnimatedCard>
        </div>

        {/* Bottom row — 3 equal cards */}
        <div className="features-grid-bottom" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {[
            {
              label: 'Analytics',
              title: <>Track{' '}<span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>every</span> step</>,
              desc: 'Screen-by-screen funnel, drop-off analysis, completion rates, and revenue attribution — all in real time.',
            },
            {
              label: 'Custom Screens',
              title: <>Your code,{' '}<span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>our flow</span></>,
              desc: 'Register your own React Native components — paywalls, surveys, permission prompts — alongside built-in screens.',
            },
            {
              label: 'Monetization',
              title: <><span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>RevenueCat</span> built in</>,
              desc: 'Paywall screens, purchase tracking, and revenue attribution. See exactly how your onboarding drives conversions.',
            },
          ].map((card, i) => (
            <AnimatedCard key={i} delay={0.05 * i} style={{ padding: '36px 32px' }}>
              <p style={{
                fontSize: theme.fontSizes.xs,
                fontWeight: 600,
                color: '#f26522',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 12px',
              }}>
                {card.label}
              </p>
              <h3 style={{
                fontSize: theme.fontSizes.xl,
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 10px',
                fontFamily: theme.fonts.sans,
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: theme.fontSizes.sm,
                color: '#666',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {card.desc}
              </p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{
        padding: '80px 24px 100px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div ref={howItWorksHeader.ref} style={{
          textAlign: 'center',
          marginBottom: 56,
          opacity: howItWorksHeader.isVisible ? 1 : 0,
          transform: howItWorksHeader.isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}>
          <p style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#f26522',
            margin: '0 0 12px',
          }}>
            Getting started
          </p>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: '0 0 16px',
            fontFamily: theme.fonts.sans,
            letterSpacing: '-0.02em',
          }}>
            Three steps to{' '}
            <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>better</span> onboarding
          </h2>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          position: 'relative',
        }}>
          {/* Vertical connector line */}
          <div style={{
            position: 'absolute',
            left: 23,
            top: 48,
            bottom: 48,
            width: 2,
            backgroundColor: '#e5e0d8',
          }} />

          {[
            {
              num: '1',
              title: 'Install the SDK',
              desc: 'One package, one peer dependency. Add your API keys and wrap your app.',
            },
            {
              num: '2',
              title: 'Design in the dashboard',
              desc: 'Build screens visually, add custom components, configure your flow order.',
            },
            {
              num: '3',
              title: 'Publish and iterate',
              desc: 'Push changes over the air. Run A/B tests. Measure everything. Repeat.',
            },
          ].map((step, i) => (
            <StepItem key={step.num} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── Value of Onboarding Section ── */}
      <ValueSection />

      {/* ── CTA Section ── */}
      <div ref={ctaSection.ref}>
        <section style={{
          padding: '80px 24px 120px',
          textAlign: 'center',
          opacity: ctaSection.isVisible ? 1 : 0,
          transform: ctaSection.isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: '0 0 16px',
            fontFamily: theme.fonts.sans,
            letterSpacing: '-0.02em',
          }}>
            Ready to{' '}
            <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>ship faster?</span>
          </h2>
          <p style={{
            fontSize: theme.fontSizes.base,
            color: '#666',
            maxWidth: 400,
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            Set up in minutes. Start iterating today.
          </p>
          <a href="/signup" style={{
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: theme.fontSizes.base,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#f26522',
            padding: '14px 36px',
            borderRadius: 14,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: theme.fonts.sans,
            boxShadow: '0 4px 12px rgba(242, 101, 34, 0.25)',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(242, 101, 34, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 101, 34, 0.25)'
            }}
          >
            Get started free
          </a>
        </section>
      </div>

      {/* ── Footer ── */}
      <div ref={footerSection.ref}>
        <footer style={{
          borderTop: '1px solid #e5e0d8',
          padding: '32px 24px',
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: footerSection.isVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
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
            {[
              { href: '/docs', label: 'Docs' },
              { href: '/blog', label: 'Blog' },
              { href: '/login', label: 'Log in' },
              { href: '/signup', label: 'Sign up' },
            ].map((link) => (
              <a key={link.href} href={link.href} style={{
                textDecoration: 'none',
                fontSize: theme.fontSizes.sm,
                color: '#666',
                transition: 'color 0.2s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              >
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </div>

      {/* ── Global animations + Mobile ── */}
      <style jsx>{`
        input::placeholder {
          color: #999;
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 768px) {
          nav { padding: 10px 16px !important; }
          nav > div:last-child { gap: 12px !important; }
          nav > div:last-child a { font-size: 13px !important; }
        }
        @media (max-width: 600px) {
          nav > div:last-child a:not([href="/signup"]):not([href="/login"]):not([href="/home"]) {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

/* ── Nav link components ── */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        fontWeight: 500,
        color: hovered ? '#f26522' : '#1a1a1a',
        transition: 'color 0.2s',
      }}
    >
      {children}
    </a>
  )
}

function NavButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: '#f26522',
        padding: '8px 22px',
        borderRadius: 10,
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(242, 101, 34, 0.3)' : 'none',
      }}
    >
      {children}
    </a>
  )
}

/* ── Step item with scroll animation ── */
function StepItem({ step, index }: { step: { num: string; title: string; desc: string }; index: number }) {
  const { ref, isVisible } = useScrollReveal()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24,
        padding: '24px 0',
        position: 'relative',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: `opacity 0.5s ease-out ${index * 0.15}s, transform 0.5s ease-out ${index * 0.15}s`,
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        minWidth: 48,
        borderRadius: '50%',
        backgroundColor: '#f26522',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.serif,
        fontStyle: 'italic',
        position: 'relative',
        zIndex: 1,
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hovered ? '0 4px 16px rgba(242, 101, 34, 0.3)' : 'none',
      }}>
        {step.num}
      </div>
      <div style={{ paddingTop: 4 }}>
        <h3 style={{
          fontSize: theme.fontSizes.xl,
          fontWeight: 600,
          color: '#1a1a1a',
          margin: '0 0 6px',
          fontFamily: theme.fonts.sans,
        }}>
          {step.title}
        </h3>
        <p style={{
          fontSize: theme.fontSizes.base,
          color: '#666',
          margin: 0,
          lineHeight: 1.6,
        }}>
          {step.desc}
        </p>
      </div>
    </div>
  )
}

/* ── Value Section — narrative-driven scroll experience ── */
function ValueSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = entry.target.getAttribute('data-v')
          if (!idx) return
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(idx))
          } else {
            setVisibleItems((prev) => {
              const next = new Set(prev)
              next.delete(idx)
              return next
            })
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    const section = sectionRef.current
    if (section) {
      section.querySelectorAll('[data-v]').forEach((el) => observer.observe(el))
    }
    return () => observer.disconnect()
  }, [])

  const v = (id: string) => visibleItems.has(id)

  const serifItalic: React.CSSProperties = {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontWeight: 400,
  }

  return (
    <section ref={sectionRef} style={{
      padding: '120px 24px 100px',
      maxWidth: 900,
      margin: '0 auto',
    }}>
      {/* ── Header ── */}
      <div
        data-v="header"
        style={{
          textAlign: 'center',
          marginBottom: 80,
          opacity: v('header') ? 1 : 0,
          transform: v('header') ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
        }}
      >
        <p style={{
          fontSize: theme.fontSizes.sm,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          color: '#f26522',
          margin: '0 0 16px',
        }}>
          Why this matters
        </p>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
          fontWeight: 600,
          color: '#1a1a1a',
          margin: '0 0 20px',
          fontFamily: theme.fonts.sans,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          Your onboarding is your app's{' '}
          <span style={serifItalic}>sales pitch</span>
        </h2>
        <p style={{
          fontSize: theme.fontSizes.lg,
          color: '#666',
          maxWidth: 600,
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          It's the one moment before your core product where you get to convince a new user that your app is worth their time — and their money.
        </p>
      </div>

      {/* ── Narrative blocks ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>

        {/* Block 1: The problem */}
        <div
          data-v="b1"
          style={{
            display: 'flex',
            gap: 48,
            alignItems: 'flex-start',
            opacity: v('b1') ? 1 : 0,
            transform: v('b1') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
          className="value-narrative-block"
        >
          <div style={{
            minWidth: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(242,101,34,0.08) 0%, rgba(242,101,34,0.15) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 36 }}>?</span>
          </div>
          <div>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 12px',
              fontFamily: theme.fonts.sans,
              lineHeight: 1.3,
            }}>
              They don't know what your app does for{' '}
              <span style={serifItalic}>them</span> yet
            </h3>
            <p style={{
              fontSize: theme.fontSizes.base,
              color: '#555',
              margin: 0,
              lineHeight: 1.8,
            }}>
              When someone opens your app for the first time, they don't understand your value yet. The onboarding is where you bridge that gap — asking personal questions that surface their specific pain points, then showing them how your app solves those exact problems.
            </p>
          </div>
        </div>

        {/* Block 2: The insight */}
        <div
          data-v="b2"
          style={{
            display: 'flex',
            gap: 48,
            alignItems: 'flex-start',
            opacity: v('b2') ? 1 : 0,
            transform: v('b2') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s',
          }}
          className="value-narrative-block"
        >
          <div style={{
            minWidth: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(242,101,34,0.08) 0%, rgba(242,101,34,0.15) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 36 }}>$</span>
          </div>
          <div>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 12px',
              fontFamily: theme.fonts.sans,
              lineHeight: 1.3,
            }}>
              By the paywall, they should already feel like the app was{' '}
              <span style={serifItalic}>built for them</span>
            </h3>
            <p style={{
              fontSize: theme.fontSizes.base,
              color: '#555',
              margin: 0,
              lineHeight: 1.8,
            }}>
              Done well, users arrive at the paywall invested — they've told your app their goals, seen how it helps, and feel understood. Done poorly, they hit that paywall cold — no emotional investment, no understanding of value — and they bounce. Two different onboarding flows can lead to dramatically different conversion rates on the exact same paywall.
            </p>
          </div>
        </div>

        {/* Block 3: The missed opportunity */}
        <div
          data-v="b3"
          style={{
            display: 'flex',
            gap: 48,
            alignItems: 'flex-start',
            opacity: v('b3') ? 1 : 0,
            transform: v('b3') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
          }}
          className="value-narrative-block"
        >
          <div style={{
            minWidth: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(242,101,34,0.1) 0%, rgba(242,101,34,0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 36 }}>%</span>
          </div>
          <div>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 12px',
              fontFamily: theme.fonts.sans,
              lineHeight: 1.3,
            }}>
              You're A/B testing the wrong thing
            </h3>
            <p style={{
              fontSize: theme.fontSizes.base,
              color: '#555',
              margin: 0,
              lineHeight: 1.8,
            }}>
              Most founders A/B test their paywall — button colors, pricing tiers, copy — but that's optimizing the last step while ignoring everything that led up to it. If a user arrives at your paywall unconvinced, no amount of button color optimization is going to save that conversion. The onboarding is where the real leverage is.
            </p>
          </div>
        </div>

        {/* Block 4: The solution */}
        <div
          data-v="b4"
          style={{
            opacity: v('b4') ? 1 : 0,
            transform: v('b4') ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s',
          }}
        >
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 24,
            padding: '48px 48px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative orb */}
            <div style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(242,101,34,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <p style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              color: '#f26522',
              margin: '0 0 16px',
            }}>
              The deeper optimization
            </p>
            <h3 style={{
              fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
              fontWeight: 600,
              color: '#fff',
              margin: '0 0 16px',
              fontFamily: theme.fonts.sans,
              lineHeight: 1.3,
            }}>
              Test the{' '}
              <span style={serifItalic}>pitch</span>, not just the{' '}
              <span style={serifItalic}>price tag</span>
            </h3>
            <p style={{
              fontSize: theme.fontSizes.base,
              color: '#a0a0a0',
              margin: '0 0 28px',
              lineHeight: 1.8,
              maxWidth: 700,
            }}>
              A/B testing your onboarding lets you see how changes in your flow — different questions, different sequences, more or less depth — actually impact user behavior at the paywall. You stop guessing what users need to hear and start measuring it.
            </p>
            <a href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 28px',
              backgroundColor: '#f26522',
              color: '#fff',
              fontSize: theme.fontSizes.sm,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 12,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 12px rgba(242, 101, 34, 0.3)',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(242, 101, 34, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 101, 34, 0.3)'
              }}
            >
              Start testing your onboarding →
            </a>
          </div>
        </div>
      </div>

      {/* Mobile: stack icon + text */}
      <style jsx>{`
        @media (max-width: 640px) {
          .value-narrative-block {
            flex-direction: column !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </section>
  )
}
