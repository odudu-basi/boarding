'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ToastProvider } from '@/components/Toast'

type ThemeMode = 'light' | 'dark'

const ThemeContext = createContext<{
  themeMode: ThemeMode
  setThemeMode: (t: ThemeMode) => void
}>({
  themeMode: 'light',
  setThemeMode: () => {},
})

export function useThemeMode() {
  return useContext(ThemeContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = localStorage.getItem('noboarding-theme') as ThemeMode | null
    if (stored && (stored === 'light' || stored === 'dark')) {
      setThemeMode(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  const handleSetTheme = (t: ThemeMode) => {
    setThemeMode(t)
    localStorage.setItem('noboarding-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode: handleSetTheme }}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeContext.Provider>
  )
}
