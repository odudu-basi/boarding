import type { FlowTheme } from './types';

/**
 * Resolves a single theme token path like "theme.colors.primary" to its value.
 * Returns the original token string if the path doesn't exist.
 */
export function resolveTokenPath(token: string, theme: FlowTheme): any {
  const path = token.slice(6); // strip "theme." prefix
  const parts = path.split('.');

  let current: any = theme;
  for (const part of parts) {
    if (current === undefined || current === null) return token;
    current = current[part];
  }

  return current !== undefined ? current : token;
}

/**
 * Checks if a value is a theme token string (starts with "theme.").
 */
export function isThemeToken(value: any): value is string {
  return typeof value === 'string' && value.startsWith('theme.');
}

/**
 * Resolves all theme token references in a style object.
 * Only string values starting with "theme." are resolved.
 * Non-token values pass through unchanged.
 * Recurses into nested objects (e.g., backgroundGradient).
 */
export function resolveThemeTokens(
  style: Record<string, any>,
  theme: FlowTheme | undefined
): Record<string, any> {
  if (!theme || !style) return style || {};

  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (isThemeToken(value)) {
      resolved[key] = resolveTokenPath(value, theme);
    } else if (Array.isArray(value)) {
      // Handle arrays (e.g., gradient colors array)
      resolved[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? resolveThemeTokens(item, theme)
          : isThemeToken(item) ? resolveTokenPath(item, theme) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested objects (e.g., backgroundGradient)
      resolved[key] = resolveThemeTokens(value, theme);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
