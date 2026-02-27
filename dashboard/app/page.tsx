'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [inputValue, setInputValue] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f5f0',
      position: 'relative',
      fontFamily: theme.fonts.sans,
    }}>

      {/* ── Glassmorphic Navbar ── */}
      <nav style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
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
          <a href="#features" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Features
          </a>
          <a href="/pricing" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Pricing
          </a>
          <a href="/docs" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Docs
          </a>
          <a href="/blog" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Blog
          </a>
          {isLoggedIn ? (
            <a href="/home" style={{
              textDecoration: 'none',
              fontSize: theme.fontSizes.sm,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: '#f26522',
              padding: '8px 22px',
              borderRadius: 10,
              transition: 'opacity 0.15s',
            }}>
              Dashboard
            </a>
          ) : (
            <>
              <a href="/login" style={{
                textDecoration: 'none',
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
                color: '#1a1a1a',
              }}>
                Log in
              </a>
              <a href="/signup" style={{
                textDecoration: 'none',
                fontSize: theme.fontSizes.sm,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: '#f26522',
                padding: '8px 22px',
                borderRadius: 10,
                transition: 'opacity 0.15s',
              }}>
                Sign up
              </a>
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
        {/* Subtle background gradient orb */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242,101,34,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Main heading — mixed italic serif + straight sans */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 600,
          lineHeight: 1.15,
          color: '#1a1a1a',
          maxWidth: 800,
          margin: '0 0 24px',
          fontFamily: theme.fonts.sans,
          letterSpacing: '-0.02em',
        }}>
          <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>A/B test</span> your onboarding.{' '}
          <br />
          Ship changes{' '}
          <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>without</span> an app{' '}
          <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>review.</span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: theme.fontSizes.lg,
          color: '#666',
          maxWidth: 540,
          lineHeight: 1.6,
          margin: '0 0 48px',
        }}>
          Design onboarding flows in the dashboard, render them natively in your app, and iterate over the air — no app store review required.
        </p>

        {/* Tall Prompt Box */}
        <div style={{
          width: '100%',
          maxWidth: 680,
          minHeight: 220,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Noboarding to create a prototype..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: theme.fontSizes.base,
              color: '#1a1a1a',
              padding: 0,
              fontFamily: theme.fonts.sans,
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <a href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: 9999,
              backgroundColor: 'rgba(242,101,34,0.08)',
              color: '#f26522',
              fontSize: theme.fontSizes.sm,
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid rgba(242,101,34,0.15)',
              transition: 'background-color 0.15s',
            }}>
              Figma to screen
            </a>
            <a href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: 9999,
              backgroundColor: 'rgba(242,101,34,0.08)',
              color: '#f26522',
              fontSize: theme.fontSizes.sm,
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid rgba(242,101,34,0.15)',
              transition: 'background-color 0.15s',
            }}>
              A/B tests
            </a>
          </div>

          {/* Submit Arrow - shown when user types */}
          {inputValue.trim() && (
            <a
              href="/signup"
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#f26522',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(242, 101, 34, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 101, 34, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(242, 101, 34, 0.3)'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3L8 13M8 3L4 7M8 3L12 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Get Started Button */}
        <a
          href="/signup"
          style={{
            marginTop: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 32px',
            backgroundColor: '#f26522',
            color: '#fff',
            fontSize: theme.fontSizes.base,
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: 12,
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(242, 101, 34, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(242, 101, 34, 0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 101, 34, 0.25)'
          }}
        >
          Get Started for Free
        </a>

        {/* Social proof */}
        <p style={{
          marginTop: 16,
          fontSize: theme.fontSizes.xs,
          color: '#999',
        }}>
          Free to start · No credit card required
        </p>
      </section>

      {/* ── Features Section ── */}
      <section id="features" style={{
        padding: '80px 24px 100px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}>
          {/* Card 1: OTA Updates — spans 2 columns */}
          <div style={{
            gridColumn: 'span 2',
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: '40px 36px',
            border: '1px solid #e5e0d8',
            position: 'relative',
            overflow: 'hidden',
          }}>
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
          </div>

          {/* Card 2: A/B Testing — dark card */}
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            padding: '40px 32px',
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
          </div>
        </div>

        {/* Bottom row — 3 equal cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {/* Card 3: Analytics */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid #e5e0d8',
          }}>
            <p style={{
              fontSize: theme.fontSizes.xs,
              fontWeight: 600,
              color: '#f26522',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}>
              Analytics
            </p>
            <h3 style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 10px',
              fontFamily: theme.fonts.sans,
            }}>
              Track{' '}
              <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>every</span> step
            </h3>
            <p style={{
              fontSize: theme.fontSizes.sm,
              color: '#666',
              lineHeight: 1.7,
              margin: 0,
            }}>
              Screen-by-screen funnel, drop-off analysis, completion rates, and revenue attribution — all in real time.
            </p>
          </div>

          {/* Card 4: Custom Screens */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid #e5e0d8',
          }}>
            <p style={{
              fontSize: theme.fontSizes.xs,
              fontWeight: 600,
              color: '#f26522',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}>
              Custom Screens
            </p>
            <h3 style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 10px',
              fontFamily: theme.fonts.sans,
            }}>
              Your code,{' '}
              <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>our flow</span>
            </h3>
            <p style={{
              fontSize: theme.fontSizes.sm,
              color: '#666',
              lineHeight: 1.7,
              margin: 0,
            }}>
              Register your own React Native components — paywalls, surveys, permission prompts — alongside built-in screens.
            </p>
          </div>

          {/* Card 5: RevenueCat */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid #e5e0d8',
          }}>
            <p style={{
              fontSize: theme.fontSizes.xs,
              fontWeight: 600,
              color: '#f26522',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 12px',
            }}>
              Monetization
            </p>
            <h3 style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 10px',
              fontFamily: theme.fonts.sans,
            }}>
              <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>RevenueCat</span> built in
            </h3>
            <p style={{
              fontSize: theme.fontSizes.sm,
              color: '#666',
              lineHeight: 1.7,
              margin: 0,
            }}>
              Paywall screens, purchase tracking, and revenue attribution. See exactly how your onboarding drives conversions.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{
        padding: '80px 24px 100px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
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
          ].map((step) => (
            <div key={step.num} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              padding: '24px 0',
              position: 'relative',
            }}>
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
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{
        padding: '80px 24px 120px',
        textAlign: 'center',
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
          transition: 'opacity 0.15s',
          fontFamily: theme.fonts.sans,
        }}>
          Get started free
        </a>
      </section>

      {/* ── Footer ── */}
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
          <a href="/docs" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Docs</a>
          <a href="/blog" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Blog</a>
          <a href="/login" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Log in</a>
          <a href="/signup" style={{ textDecoration: 'none', fontSize: theme.fontSizes.sm, color: '#666' }}>Sign up</a>
        </div>
      </footer>

      {/* ── Placeholder styling ── */}
      <style jsx>{`
        input::placeholder {
          color: #999;
        }
      `}</style>
    </div>
  )
}
