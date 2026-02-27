'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/lib/theme'
import { blogPosts } from '@/lib/blog-posts'
import { createClient } from '@/lib/supabase/client'

export default function BlogPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
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
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f5f0',
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
          <a href="/#features" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>Features</a>
          <a href="/pricing" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>Pricing</a>
          <a href="/docs" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>Docs</a>
          <a href="/blog" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 600,
            color: '#f26522',
          }}>Blog</a>
          {isLoggedIn ? (
            <a href="/home" style={{
              textDecoration: 'none',
              fontSize: theme.fontSizes.sm,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: '#f26522',
              padding: '8px 22px',
              borderRadius: 10,
            }}>Dashboard</a>
          ) : (
            <>
              <a href="/login" style={{
                textDecoration: 'none',
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
                color: '#1a1a1a',
              }}>Log in</a>
              <a href="/signup" style={{
                textDecoration: 'none',
                fontSize: theme.fontSizes.sm,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: '#f26522',
                padding: '8px 22px',
                borderRadius: 10,
              }}>Sign up</a>
            </>
          )}
        </div>
      </nav>

      {/* ── Header ── */}
      <section style={{
        padding: '140px 24px 48px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 600,
          color: '#1a1a1a',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
        }}>
          The{' '}
          <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>Noboarding</span>{' '}
          Blog
        </h1>
        <p style={{
          fontSize: theme.fontSizes.lg,
          color: '#666',
          maxWidth: 520,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Insights on onboarding, experimentation, and building apps that convert.
        </p>
      </section>

      {/* ── Post Cards ── */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {blogPosts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <article style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: '36px 36px',
              border: '1px solid #e5e0d8',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 12,
              }}>
                <span style={{
                  fontSize: theme.fontSizes.xs,
                  color: '#999',
                }}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span style={{
                  fontSize: theme.fontSizes.xs,
                  color: '#ccc',
                }}>
                  |
                </span>
                <span style={{
                  fontSize: theme.fontSizes.xs,
                  color: '#999',
                }}>
                  {post.readingTime}
                </span>
              </div>

              <h2 style={{
                fontSize: theme.fontSizes['2xl'],
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 10px',
                letterSpacing: '-0.01em',
              }}>
                {post.title}
              </h2>

              <p style={{
                fontSize: theme.fontSizes.base,
                color: '#666',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {post.description}
              </p>
            </article>
          </a>
        ))}
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
    </div>
  )
}
