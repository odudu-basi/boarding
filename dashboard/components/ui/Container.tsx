import { theme } from '@/lib/theme'

interface ContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

export function Container({
  children,
  maxWidth = 'xl',
  padding = true,
  className = ''
}: ContainerProps) {
  const maxWidths = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    full: '100%',
  }

  return (
    <div
      style={{
        maxWidth: maxWidths[maxWidth],
        margin: '0 auto',
        padding: padding ? `0 ${theme.spacing.xl}` : '0',
      }}
      className={className}
    >
      {children}
    </div>
  )
}
