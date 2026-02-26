import { theme } from '@/lib/theme'
import Link from 'next/link'

interface CardProps {
  children: React.ReactNode
  href?: string
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
  hover?: boolean
  style?: React.CSSProperties
}

export function Card({
  children,
  href,
  className = '',
  padding = 'md',
  hover = false,
  style,
}: CardProps) {
  const paddingStyles: Record<string, string | undefined> = {
    sm: theme.spacing.md,
    md: theme.spacing.lg,
    lg: theme.spacing.xl,
    none: '0',
  }

  const baseStyles: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
    padding: paddingStyles[padding],
    transition: 'all 0.2s',
    ...style,
  }

  const hoverClass = hover ? 'hover:shadow-lg' : ''

  if (href) {
    return (
      <Link
        href={href}
        style={baseStyles}
        className={`block ${hoverClass} ${className}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <div style={baseStyles} className={`${hoverClass} ${className}`}>
      {children}
    </div>
  )
}
