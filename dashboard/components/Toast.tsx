'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { theme } from '@/lib/theme'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [fadingOut, setFadingOut] = useState<Set<number>>(new Set())

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setFadingOut(prev => new Set(prev).add(id))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      setFadingOut(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — centered */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999,
          gap: '12px',
        }}>
          {toasts.map(t => (
            <ToastItem
              key={t.id}
              toast={t}
              fadingOut={fadingOut.has(t.id)}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, fadingOut, onDismiss }: { toast: Toast; fadingOut: boolean; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const icon = toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'
  const accentColor =
    toast.type === 'success' ? '#22c55e' :
    toast.type === 'error' ? '#ef4444' :
    theme.colors.primary

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        color: '#f5f5f5',
        padding: '14px 24px',
        borderRadius: theme.borderRadius.lg,
        fontFamily: theme.fonts.sans,
        fontSize: theme.fontSizes.sm,
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(0.95) translateY(-8px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        animation: fadingOut ? 'none' : 'toastIn 0.3s ease',
        maxWidth: '400px',
      }}
      onClick={onDismiss}
    >
      <span style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: accentColor,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        flexShrink: 0,
      }}>
        {icon}
      </span>
      {toast.message}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
