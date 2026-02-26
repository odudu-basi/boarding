import { theme } from '@/lib/theme'

interface TextProps {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg'
  variant?: 'default' | 'muted' | 'light'
  className?: string
  style?: React.CSSProperties
}

export function Text({
  children,
  size = 'base',
  variant = 'default',
  className = '',
  style,
}: TextProps) {
  const colors = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    light: theme.colors.textLight,
  }

  return (
    <p
      style={{
        fontSize: theme.fontSizes[size],
        color: colors[variant],
        ...style,
      }}
      className={className}
    >
      {children}
    </p>
  )
}
