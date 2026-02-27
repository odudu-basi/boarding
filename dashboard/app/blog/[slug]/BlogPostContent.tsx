'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/lib/theme'
import { BlogPost } from '@/lib/blog-posts'
import { createClient } from '@/lib/supabase/client'

export function BlogPostContent({ post }: { post: BlogPost }) {
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

      {/* ── Article ── */}
      <article style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '140px 24px 64px',
      }}>
        {/* Back link */}
        <a href="/blog" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
          fontSize: theme.fontSizes.sm,
          color: '#999',
          marginBottom: 32,
        }}>
          &larr; All posts
        </a>

        {/* Post header */}
        <header style={{ marginBottom: 48 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: theme.fontSizes.sm, color: '#999' }}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span style={{ fontSize: theme.fontSizes.sm, color: '#ccc' }}>|</span>
            <span style={{ fontSize: theme.fontSizes.sm, color: '#999' }}>
              {post.readingTime}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 600,
            color: '#1a1a1a',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {post.title}
          </h1>
        </header>

        {/* Post body */}
        <div>
          {post.content}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 64,
          padding: '40px 36px',
          backgroundColor: '#fff',
          borderRadius: 20,
          border: '1px solid #e5e0d8',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: theme.fontSizes['2xl'],
            fontWeight: 600,
            color: '#1a1a1a',
            margin: '0 0 12px',
          }}>
            Ready to{' '}
            <span style={{ fontFamily: theme.fonts.serif, fontStyle: 'italic', fontWeight: 400 }}>optimize</span>{' '}
            your onboarding?
          </h3>
          <p style={{
            fontSize: theme.fontSizes.base,
            color: '#666',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}>
            Build, A/B test, and update your onboarding flow over the air. No app review required.
          </p>
          <a href="/signup" style={{
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: theme.fontSizes.base,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#f26522',
            padding: '12px 28px',
            borderRadius: 12,
            transition: 'opacity 0.15s',
          }}>
            Get started free
          </a>
        </div>
      </article>

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
