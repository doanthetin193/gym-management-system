import { apiGet, apiPost } from '../../../shared/api/apiClient'
import type { AuthUser, LoginResponse } from '../types/auth'

export function login(email: string, password: string, rememberMe?: boolean) {
  return apiPost<LoginResponse>('/v1/auth/login', { email, password, rememberMe })
}

export function getCurrentUser() {
  return apiGet<AuthUser>('/v1/auth/me')
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiPost<void>('/v1/auth/change-password', { currentPassword, newPassword })
}
