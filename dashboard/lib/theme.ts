// Noboarding Theme Configuration
// Colors resolve via CSS custom properties defined in globals.css
// Change the CSS variables to update the entire app's design

export const theme = {
  colors: {
    // Background colors
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',

    // Brand colors
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    primaryTint: 'var(--color-primary-tint)',
    primaryTintStrong: 'var(--color-primary-tint-strong)',
    primaryMuted: 'var(--color-primary-muted)',

    // Text colors
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    textLight: 'var(--color-text-light)',

    // Border colors
    border: 'var(--color-border)',
    borderDashed: 'var(--color-border-dashed)',

    // Status colors
    success: 'var(--color-success)',
    successText: 'var(--color-success-text)',
    error: 'var(--color-error)',
    errorText: 'var(--color-error-text)',
  },

  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "'Newsreader', serif",
    mono: "'Consolas', 'Monaco', monospace",
  },

  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },

  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    full: '9999px',
  },
}

// Helper function to generate inline styles
export const styles = {
  background: { backgroundColor: theme.colors.background },
  surface: { backgroundColor: theme.colors.surface },
  primary: { backgroundColor: theme.colors.primary, color: '#ffffff' },
  border: { borderColor: theme.colors.border },
  text: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
}
