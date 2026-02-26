'use client'

import { useState, useRef, useEffect } from 'react'
import { theme } from '@/lib/theme'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useThemeMode } from '@/components/Providers'
import {
  HiOutlineHome,
  HiOutlineRectangleStack,
  HiOutlineBeaker,
  HiOutlineChartBar,
  HiOutlineBookOpen,
  HiOutlineCog6Tooth,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChevronUpDown,
  HiOutlinePlusCircle,
  HiOutlineCheck,
} from 'react-icons/hi2'

interface ProjectInfo {
  id: string
  name: string
  platform: string
}

interface LayoutProps {
  children: React.ReactNode
  organizationName?: string
  plan?: string
  projects?: ProjectInfo[]
  currentProjectId?: string
}

const NAV_ITEMS: Array<{ label: string; href: string; icon: any; match?: (p: string) => boolean; external?: boolean }> = [
  { label: 'Overview', href: '/', icon: HiOutlineHome, match: (p: string) => p === '/' },
  { label: 'Onboarding Flows', href: '/flows', icon: HiOutlineRectangleStack, match: (p: string) => p.startsWith('/flows') },
  { label: 'A/B Tests', href: '/ab-tests', icon: HiOutlineBeaker, match: (p: string) => p.startsWith('/ab-tests') },
  { label: 'Analytics', href: '/analytics', icon: HiOutlineChartBar, match: (p: string) => p === '/analytics' },
  { label: 'Documentation', href: '/docs', icon: HiOutlineBookOpen, external: true },
  { label: 'Settings', href: '/settings', icon: HiOutlineCog6Tooth, match: (p: string) => p === '/settings' },
]

const PLATFORM_LABELS: Record<string, string> = {
  ios: 'iOS',
  android: 'Android',
  cross_platform: 'Cross-platform',
}

export function Layout({ children, organizationName, plan, projects, currentProjectId }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { themeMode } = useThemeMode()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentProject = projects?.find(p => p.id === currentProjectId) || projects?.[0]

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const switchProject = (projectId: string) => {
    document.cookie = `selected_project=${projectId}; path=/; max-age=${60 * 60 * 24 * 365}`
    setDropdownOpen(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.colors.background }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          backgroundColor: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: `${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.sm}` }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing.xs }}>
            <Image
              src={themeMode === 'dark' ? '/noboarding-logo-dark.png' : '/noboarding-logo-light.png'}
              alt="Noboarding"
              width={44}
              height={44}
              style={{ objectFit: 'contain' }}
              priority
            />
            <span style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: '700',
              color: theme.colors.primary,
              fontFamily: theme.fonts.serif,
              fontStyle: 'italic',
            }}>
              Noboarding
            </span>
          </Link>
        </div>

        {/* Project Switcher */}
        {projects && projects.length > 0 && (
          <div style={{ padding: `0 ${theme.spacing.lg} ${theme.spacing.md}` }} ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                backgroundColor: dropdownOpen ? theme.colors.background : 'transparent',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!dropdownOpen) e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
              onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '600',
                  color: theme.colors.text,
                  fontFamily: theme.fonts.sans,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {currentProject?.name || 'Select project'}
                </div>
                {currentProject && (
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.sans,
                  }}>
                    {PLATFORM_LABELS[currentProject.platform] || currentProject.platform}
                  </div>
                )}
              </div>
              <HiOutlineChevronUpDown size={16} style={{ color: theme.colors.textMuted, flexShrink: 0 }} />
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                zIndex: 50,
                marginTop: 4,
                width: 'calc(240px - 2 * 24px)',
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                {projects.map(project => {
                  const isCurrent = project.id === currentProject?.id
                  return (
                    <div
                      key={project.id}
                      onClick={() => switchProject(project.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? theme.colors.primaryTintStrong : 'transparent',
                        fontSize: theme.fontSizes.sm,
                        fontFamily: theme.fonts.sans,
                        color: isCurrent ? theme.colors.primary : theme.colors.text,
                        fontWeight: isCurrent ? '600' : '400',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = isCurrent ? theme.colors.primaryTintStrong : 'transparent' }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.name}
                        </div>
                        <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>
                          {PLATFORM_LABELS[project.platform] || project.platform}
                        </div>
                      </div>
                      {isCurrent && <HiOutlineCheck size={16} style={{ flexShrink: 0 }} />}
                    </div>
                  )
                })}
                <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      textDecoration: 'none',
                      fontSize: theme.fontSizes.sm,
                      fontFamily: theme.fonts.sans,
                      color: theme.colors.textMuted,
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <HiOutlinePlusCircle size={16} />
                    <span>New Project</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Org name + plan below the switcher */}
            <div style={{ marginTop: theme.spacing.xs, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              {organizationName && (
                <span style={{ fontSize: '10px', color: theme.colors.textMuted, fontFamily: theme.fonts.sans }}>
                  {organizationName}
                </span>
              )}
              {plan && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.primaryTintStrong,
                  padding: `1px ${theme.spacing.xs}`,
                  borderRadius: theme.borderRadius.full,
                  fontFamily: theme.fonts.sans,
                }}>
                  {plan}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fallback: show org name if no projects */}
        {(!projects || projects.length === 0) && (
          <div style={{ padding: `0 ${theme.spacing.lg} ${theme.spacing.md}` }}>
            {organizationName && (
              <p style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, margin: 0 }}>
                {organizationName}
              </p>
            )}
            {plan && (
              <span style={{
                display: 'inline-block',
                marginTop: theme.spacing.xs,
                fontSize: theme.fontSizes.xs,
                fontWeight: '600',
                textTransform: 'capitalize',
                color: theme.colors.primary,
                backgroundColor: theme.colors.primaryTintStrong,
                padding: `2px ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.full,
              }}>
                {plan}
              </span>
            )}
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: `${theme.spacing.sm} ${theme.spacing.sm}`, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = !item.external && item.match?.(pathname)
            const Icon = item.icon

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    textDecoration: 'none',
                    color: theme.colors.textMuted,
                    fontSize: theme.fontSizes.sm,
                    fontFamily: theme.fonts.sans,
                    transition: 'background-color 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <HiOutlineArrowTopRightOnSquare size={14} style={{ opacity: 0.5 }} />
                </a>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borderRadius.md,
                  textDecoration: 'none',
                  color: isActive ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: isActive ? '600' : '400',
                  fontSize: theme.fontSizes.sm,
                  fontFamily: theme.fonts.sans,
                  backgroundColor: isActive ? theme.colors.primaryTintStrong : 'transparent',
                  borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                  transition: 'background-color 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: Sign Out */}
        <div style={{
          padding: theme.spacing.md,
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <form action="/auth/signout" method="post">
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.sans,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.primaryTint }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: theme.colors.background,
      }}>
        {children}
      </main>
    </div>
  )
}
