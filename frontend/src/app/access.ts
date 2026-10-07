import type { AuthUser } from '../features/auth/types/auth'

const ADMIN_ROLES = ['OWNER', 'PT']

export function hasAnyRole(user: AuthUser | null, allowedRoles: string[]) {
  if (!user) {
    return false
  }
  return user.roles.some((role) => allowedRoles.includes(role))
}

export function isMemberOnly(user: AuthUser | null) {
  if (!user) {
    return false
  }
  return user.roles.includes('MEMBER') && !user.roles.some((role) => ADMIN_ROLES.includes(role))
}

export function defaultPathForUser(user: AuthUser | null) {
  if (!user) {
    return '/login'
  }
  if (isMemberOnly(user)) {
    return '/my-progress'
  }
  if (user.roles.includes('PT') && !user.roles.includes('OWNER')) {
    return '/pt-schedule'
  }
  return '/dashboard'
}
