import { theme } from '@/lib/theme'
import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  style,
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-block',
    fontWeight: '600',
    borderRadius: theme.borderRadius.lg,
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    textDecoration: 'none',
  }

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.colors.border,
      color: theme.colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    },
  }

  const sizeStyles = {
    sm: { padding: '0.5rem 1rem', fontSize: theme.fontSizes.sm },
    md: { padding: '0.75rem 1.5rem', fontSize: theme.fontSizes.base },
    lg: { padding: '1rem 2rem', fontSize: theme.fontSizes.lg },
  }

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  if (href) {
    return (
      <Link
        href={href}
        style={combinedStyles}
        className={`hover:opacity-90 ${className}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={combinedStyles}
      className={`hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  )
}
