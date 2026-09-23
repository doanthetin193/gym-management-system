import { apiGet, apiPost } from '../../../shared/api/apiClient'
import type { AuthUser, LoginResponse } from '../types/auth'

export function login(username: string, password: string) {
  return apiPost<LoginResponse>('/v1/auth/login', { username, password })
}

export function getCurrentUser() {
  return apiGet<AuthUser>('/v1/auth/me')
}
