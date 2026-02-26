import { Condition, ComparisonOperator, ConditionalDestination, ConditionalRoutes } from './types'

/**
 * Resolve {variable_name} placeholders in a template string.
 * Unknown variables resolve to empty string.
 */
export function resolveTemplate(
  template: string,
  variables: Record<string, any>
): string {
  if (!template || !template.includes('{')) return template
  return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (_match, varName) => {
    // Support dot notation: "user.name" → variables["user.name"] or variables.user?.name
    let value = variables[varName]
    if (value === undefined && varName.includes('.')) {
      const parts = varName.split('.')
      value = variables[parts[0]]
      for (let i = 1; i < parts.length && value != null; i++) {
        value = value[parts[i]]
      }
    }
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

/**
 * Evaluate a single comparison against the variable store.
 */
function evaluateComparison(
  variableName: string,
  operator: ComparisonOperator,
  conditionValue: any,
  variables: Record<string, any>
): boolean {
  const actual = variables[variableName]

  switch (operator) {
    case 'equals':
      return actual === conditionValue
    case 'not_equals':
      return actual !== conditionValue
    case 'greater_than':
      return typeof actual === 'number' && actual > conditionValue
    case 'less_than':
      return typeof actual === 'number' && actual < conditionValue
    case 'contains':
      if (typeof actual === 'string') return actual.includes(conditionValue)
      if (Array.isArray(actual)) return actual.includes(conditionValue)
      return false
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(actual)
    case 'is_empty':
      return actual === undefined || actual === null || actual === '' ||
        (Array.isArray(actual) && actual.length === 0)
    case 'is_not_empty':
      return actual !== undefined && actual !== null && actual !== '' &&
        !(Array.isArray(actual) && actual.length === 0)
    default:
      return false
  }
}

/**
 * Recursively evaluate a Condition tree against the variable store.
 * Supports: single comparison, all (AND), any (OR), not (negation).
 * Returns true if no valid condition structure (default: show element).
 */
export function evaluateCondition(
  condition: Condition,
  variables: Record<string, any>
): boolean {
  if (!condition) return true

  // AND logic
  if (condition.all) {
    return condition.all.every(c => evaluateCondition(c, variables))
  }

  // OR logic
  if (condition.any) {
    return condition.any.some(c => evaluateCondition(c, variables))
  }

  // Negation
  if (condition.not) {
    return !evaluateCondition(condition.not, variables)
  }

  // Single comparison
  if (condition.variable && condition.operator) {
    return evaluateComparison(condition.variable, condition.operator, condition.value, variables)
  }

  // No valid condition structure — default to true
  return true
}

/**
 * Resolve a destination (plain string or conditional) to a concrete screen ID.
 * Returns the string destination or undefined.
 */
export function resolveDestination(
  destination: string | ConditionalDestination | ConditionalRoutes | undefined,
  variables: Record<string, any>
): string | undefined {
  if (!destination) return undefined

  // Plain string — backward compatible
  if (typeof destination === 'string') return destination

  // Routes array (multi-path)
  if ('routes' in destination) {
    const routes = destination as ConditionalRoutes
    for (const route of routes.routes) {
      if (evaluateCondition(route.condition, variables)) {
        return route.destination
      }
    }
    return routes.default
  }

  // If/then/else
  const cond = destination as ConditionalDestination
  if (evaluateCondition(cond.if, variables)) {
    return cond.then
  }
  if (cond.else) {
    if (typeof cond.else === 'string') return cond.else
    return resolveDestination(cond.else, variables)
  }
  return 'next' // fallback
}
