'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { useToast } from '@/components/Toast'

interface ExperimentCardActionsProps {
  experimentId: string
  experimentName: string
}

export function ExperimentCardActions({ experimentId, experimentName }: ExperimentCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)
    setIsOpen(false)

    try {
      const response = await fetch(`/api/experiments/${experimentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast('A/B test deleted successfully', 'success')
        router.refresh()
      } else {
        toast('Failed to delete A/B test', 'error')
      }
    } catch (error) {
      console.error('Error deleting experiment:', error)
      toast('Failed to delete A/B test', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleMenu}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.borderRadius.sm,
          transition: 'background-color 0.2s',
          color: theme.colors.textMuted,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.background
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="4" r="1.5" fill="currentColor" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="10" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 50,
            minWidth: '160px',
          }}
        >
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontSize: theme.fontSizes.sm,
              color: '#dc2626',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              borderRadius: theme.borderRadius.md,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = '#fef2f2'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 2V3H2V4H3V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V4H14V3H10V2H6ZM5 4H11V12H5V4ZM7 6V10H8V6H7ZM9 6V10H10V6H9Z"
                fill="currentColor"
              />
            </svg>
            {isDeleting ? 'Deleting...' : 'Delete Test'}
          </button>
        </div>
      )}
    </div>
  )
}
