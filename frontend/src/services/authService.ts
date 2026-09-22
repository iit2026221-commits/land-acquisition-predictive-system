export type Permission =
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'prediction:read'
  | 'prediction:create'
  | 'prediction:explain'
  | 'risk:read'
  | 'decision_support:read'
  | 'decision_support:generate'
  | 'recommendation:read'
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'audit:read'
  | 'analytics:read'
  | 'analytics:export'

export type AuthSession = {
  id: number
  email: string
  role: string
  accessToken: string
}

const sessionKey = 'lai-auth-session'

export function getAuthSession(): AuthSession | null {
  const value = localStorage.getItem(sessionKey)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as AuthSession
  } catch {
    localStorage.removeItem(sessionKey)
    return null
  }
}

export function setAuthSession(
  session: AuthSession,
) {
  localStorage.setItem(
    sessionKey,
    JSON.stringify(session),
  )
}

export function clearAuthSession() {
  localStorage.removeItem(sessionKey)
}


/*
 * Frontend permission map.
 *
 * This mirrors the backend authorization rules.
 *
 * IMPORTANT:
 * prediction:create is intentionally available only
 * to administrator roles.
 */
const permissions: Record<
  string,
  Permission[]
> = {
  system_administrator: [
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'prediction:read',
    'prediction:create',
    'prediction:explain',
    'risk:read',
    'decision_support:read',
    'decision_support:generate',
    'recommendation:read',
    'user:read',
    'user:create',
    'user:update',
    'audit:read',
    'analytics:read',
    'analytics:export',
  ],

  project_administrator: [
    'project:create',
    'project:read',
    'project:update',
    'prediction:read',
    'prediction:create',
    'prediction:explain',
    'risk:read',
    'decision_support:read',
    'decision_support:generate',
    'recommendation:read',
    'analytics:read',
  ],

  project_manager: [
    'project:read',
    'project:update',
    'prediction:read',
    'prediction:explain',
    'risk:read',
    'decision_support:read',
    'recommendation:read',
    'analytics:read',
  ],

  land_acquisition_officer: [
    'project:read',
    'project:update',
    'risk:read',
    'decision_support:read',
    'recommendation:read',
  ],

  legal_officer: [
    'project:read',
    'risk:read',
    'recommendation:read',
  ],

  compensation_officer: [
    'project:read',
    'risk:read',
    'recommendation:read',
  ],

  rr_officer: [
    'project:read',
    'risk:read',
    'recommendation:read',
  ],

  senior_decision_maker: [
    'project:read',
    'prediction:read',
    'risk:read',
    'decision_support:read',
    'recommendation:read',
    'analytics:read',
    'analytics:export',
  ],

  analyst: [
    'project:read',
    'prediction:read',
    'prediction:explain',
    'risk:read',
    'decision_support:read',
    'recommendation:read',
    'analytics:read',
  ],

  viewer: [
    'project:read',
    'risk:read',
    'decision_support:read',
  ],
}


export function can(
  permission: Permission,
  session = getAuthSession(),
): boolean {
  return Boolean(
    session &&
    permissions[session.role]?.includes(permission),
  )
}