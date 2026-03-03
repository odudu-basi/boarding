import type { FlowTheme } from './types'

export const DEFAULT_FLOW_THEME: FlowTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    textMuted: '#8E8E93',
    accent: '#FF9500',
    success: '#34C759',
    error: '#FF3B30',
  },
  typography: {
    heading: { fontSize: 32, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
  },
  button: {
    backgroundColor: '#007AFF',
    textColor: '#FFFFFF',
    borderRadius: 14,
    minHeight: 52,
  },
  input: {
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  general: {
    borderRadius: 12,
    spacing: 16,
  },
}

const DARK_THEME: FlowTheme = {
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textMuted: '#98989D',
    accent: '#FF9F0A',
    success: '#30D158',
    error: '#FF453A',
  },
  typography: {
    heading: { fontSize: 32, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
  },
  button: {
    backgroundColor: '#0A84FF',
    textColor: '#FFFFFF',
    borderRadius: 14,
    minHeight: 52,
  },
  input: {
    borderColor: '#38383A',
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
  },
  general: {
    borderRadius: 12,
    spacing: 16,
  },
}

const WARM_THEME: FlowTheme = {
  colors: {
    primary: '#F26522',
    secondary: '#E85D75',
    background: '#FFF8F0',
    surface: '#FFF0E5',
    text: '#2D1B0E',
    textMuted: '#8B6F5A',
    accent: '#F5A623',
    success: '#4CAF50',
    error: '#E53935',
  },
  typography: {
    heading: { fontSize: 32, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
  },
  button: {
    backgroundColor: '#F26522',
    textColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 52,
  },
  input: {
    borderColor: '#E8D5C4',
    borderRadius: 12,
    backgroundColor: '#FFF5ED',
  },
  general: {
    borderRadius: 14,
    spacing: 16,
  },
}

const OCEAN_THEME: FlowTheme = {
  colors: {
    primary: '#0077B6',
    secondary: '#00B4D8',
    background: '#F0F8FF',
    surface: '#E0F0FF',
    text: '#023E58',
    textMuted: '#5A8EA6',
    accent: '#48CAE4',
    success: '#06D6A0',
    error: '#EF476F',
  },
  typography: {
    heading: { fontSize: 32, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
  },
  button: {
    backgroundColor: '#0077B6',
    textColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 52,
  },
  input: {
    borderColor: '#B8D8E8',
    borderRadius: 10,
    backgroundColor: '#F0F8FF',
  },
  general: {
    borderRadius: 12,
    spacing: 16,
  },
}

const MINIMAL_THEME: FlowTheme = {
  colors: {
    primary: '#333333',
    secondary: '#666666',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#111111',
    textMuted: '#999999',
    accent: '#333333',
    success: '#2E7D32',
    error: '#C62828',
  },
  typography: {
    heading: { fontSize: 30, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
  },
  button: {
    backgroundColor: '#111111',
    textColor: '#FFFFFF',
    borderRadius: 8,
    minHeight: 50,
  },
  input: {
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  general: {
    borderRadius: 8,
    spacing: 16,
  },
}

export const THEME_PRESETS: { name: string; theme: FlowTheme }[] = [
  { name: 'Default', theme: DEFAULT_FLOW_THEME },
  { name: 'Dark', theme: DARK_THEME },
  { name: 'Warm', theme: WARM_THEME },
  { name: 'Ocean', theme: OCEAN_THEME },
  { name: 'Minimal', theme: MINIMAL_THEME },
]

export interface ThemeColorEntry {
  token: string
  label: string
  value: string
}

export function getThemeColorEntries(flowTheme: FlowTheme): ThemeColorEntry[] {
  return Object.entries(flowTheme.colors).map(([key, value]) => ({
    token: `theme.colors.${key}`,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
    value,
  }))
}
