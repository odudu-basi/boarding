import { theme } from '@/lib/theme'

interface HeadingProps {
  children: React.ReactNode
  level: 1 | 2 | 3 | 4 | 5 | 6
  serif?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Heading({ children, level, serif = false, className = '', style }: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements

  const sizes = {
    1: theme.fontSizes['5xl'],
    2: theme.fontSizes['4xl'],
    3: theme.fontSizes['3xl'],
    4: theme.fontSizes['2xl'],
    5: theme.fontSizes.xl,
    6: theme.fontSizes.lg,
  }

  const baseStyles: React.CSSProperties = {
    fontWeight: '600',
    color: theme.colors.text,
    fontSize: sizes[level],
    fontFamily: serif ? theme.fonts.serif : theme.fonts.sans,
    fontStyle: serif ? 'italic' : 'normal',
    ...style,
  }

  return (
    <Tag style={baseStyles} className={className}>
      {children}
    </Tag>
  )
}
