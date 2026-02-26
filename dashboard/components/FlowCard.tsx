'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingConfig } from '@/lib/types'
import { theme } from '@/lib/theme'
import { renameFlow, deleteFlow, duplicateFlow } from '@/app/actions'
import { useToast } from '@/components/Toast'

interface FlowCardProps {
  config: OnboardingConfig
}

export function FlowCard({ config }: FlowCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleRename = async () => {
    const trimmed = newName.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const result = await renameFlow(config.id, trimmed)
    setSaving(false)
    if (result.error) { toast(`Rename failed: ${result.error}`, 'error'); return }
    setShowRenameModal(false)
    toast('Flow renamed', 'success')
    router.refresh()
  }

  const handleDelete = async () => {
    if (saving) return
    setSaving(true)
    const result = await deleteFlow(config.id)
    setSaving(false)
    if (result.error) { toast(`Delete failed: ${result.error}`, 'error'); return }
    setShowDeleteConfirm(false)
    toast('Flow deleted', 'success')
    router.refresh()
  }

  const handleDuplicate = async () => {
    const trimmed = newName.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const result = await duplicateFlow(config.id, trimmed)
    setSaving(false)
    if (result.error) { toast(`Duplicate failed: ${result.error}`, 'error'); return }
    setShowDuplicateModal(false)
    toast('Flow duplicated', 'success')
    router.refresh()
  }

  return (
    <>
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.lg,
          transition: 'all 0.2s',
          cursor: 'pointer',
          position: 'relative',
        }}
        className="hover:shadow-lg"
        onClick={() => router.push(`/flows/${config.id}`)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: theme.fontSizes.lg, fontWeight: '600',
              fontFamily: theme.fonts.serif, color: theme.colors.text,
              margin: 0, marginBottom: theme.spacing.xs,
            }}>
              {config.name}
            </h3>
            <span style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textLight }}>v{config.version}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            {config.is_published && (
              <span style={{
                backgroundColor: theme.colors.success,
                color: theme.colors.successText,
                fontSize: theme.fontSizes.xs,
                fontWeight: '600',
                padding: '0.25rem 0.625rem',
                borderRadius: theme.borderRadius.sm,
                flexShrink: 0,
              }}>
                Published
              </span>
            )}
            {/* Three-dot menu button */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: theme.borderRadius.sm,
                  color: theme.colors.textMuted, fontSize: '18px',
                  lineHeight: 1, display: 'flex', alignItems: 'center',
                }}
                title="More options"
              >
                &#x22EE;
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  zIndex: 20, minWidth: '150px', overflow: 'hidden',
                  marginTop: '4px',
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      setNewName(config.name)
                      setShowRenameModal(true)
                    }}
                    style={menuItemStyle}
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      setNewName(`${config.name} (copy)`)
                      setShowDuplicateModal(true)
                    }}
                    style={menuItemStyle}
                  >
                    Duplicate
                  </button>
                  <div style={{ borderTop: `1px solid ${theme.colors.border}` }} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      setShowDeleteConfirm(true)
                    }}
                    style={{ ...menuItemStyle, color: theme.colors.errorText }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, margin: 0, marginTop: theme.spacing.sm }}>
          {config.config.screens.length} screen{config.config.screens.length !== 1 ? 's' : ''}
        </p>
        <p style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textLight, margin: 0, marginTop: theme.spacing.sm }}>
          Updated {new Date(config.updated_at).toLocaleDateString()}
        </p>
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <Modal
          title="Rename Flow"
          onClose={() => setShowRenameModal(false)}
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Flow name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <button onClick={() => setShowRenameModal(false)} style={secondaryBtnStyle}>Cancel</button>
            <button
              onClick={handleRename}
              disabled={!newName.trim() || saving}
              style={{ ...primaryBtnStyle, opacity: !newName.trim() || saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </Modal>
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <Modal
          title="Duplicate Flow"
          onClose={() => setShowDuplicateModal(false)}
        >
          <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, margin: 0, marginBottom: theme.spacing.md }}>
            This will create a copy of &ldquo;{config.name}&rdquo; with all its screens and settings.
          </p>
          <label style={{ fontSize: theme.fontSizes.sm, fontWeight: '500', color: theme.colors.text, display: 'block', marginBottom: theme.spacing.xs }}>
            Name for the duplicate
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Flow name"
            onKeyDown={(e) => e.key === 'Enter' && handleDuplicate()}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <button onClick={() => setShowDuplicateModal(false)} style={secondaryBtnStyle}>Cancel</button>
            <button
              onClick={handleDuplicate}
              disabled={!newName.trim() || saving}
              style={{ ...primaryBtnStyle, opacity: !newName.trim() || saving ? 0.5 : 1 }}
            >
              {saving ? 'Duplicating...' : 'Duplicate'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          title="Delete Flow"
          onClose={() => setShowDeleteConfirm(false)}
        >
          <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, margin: 0, marginBottom: theme.spacing.md }}>
            Are you sure you want to delete &ldquo;{config.name}&rdquo;? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <button onClick={() => setShowDeleteConfirm(false)} style={secondaryBtnStyle}>Cancel</button>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                ...primaryBtnStyle,
                backgroundColor: theme.colors.errorText,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ─── Modal wrapper ───

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          width: '100%', maxWidth: '420px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: theme.fontSizes.xl, fontWeight: '600',
          fontFamily: theme.fonts.serif, color: theme.colors.text,
          margin: 0, marginBottom: theme.spacing.lg,
        }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ─── Shared styles ───

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 14px', border: 'none',
  backgroundColor: 'transparent', cursor: 'pointer',
  fontSize: theme.fontSizes.sm, color: theme.colors.text,
  fontFamily: theme.fonts.sans,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  fontSize: theme.fontSizes.base,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontFamily: theme.fonts.sans,
  color: theme.colors.text,
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  fontSize: theme.fontSizes.sm, fontWeight: '600',
  backgroundColor: theme.colors.primary, color: '#fff',
  border: 'none', borderRadius: theme.borderRadius.md,
  cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  fontSize: theme.fontSizes.sm, fontWeight: '500',
  backgroundColor: 'transparent', color: theme.colors.text,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md, cursor: 'pointer',
}
