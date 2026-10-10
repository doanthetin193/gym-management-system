import { apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type { CreateTeamUserPayload, TeamUser, TeamUserRole } from '../types/teamUser'

export function listTeamUsers() {
  return apiGet<TeamUser[]>('/v1/settings/team-users')
}

export function createTeamUser(payload: CreateTeamUserPayload) {
  return apiPost<TeamUser, CreateTeamUserPayload>('/v1/settings/team-users', payload)
}

export function updateTeamRole(userId: number, roleCode: TeamUserRole) {
  return apiPut<TeamUser>(`/v1/settings/team-users/${userId}/role`, { roleCode })
}

export function updateTeamStatus(userId: number, status: 'ACTIVE' | 'LOCKED') {
  return apiPut<TeamUser>(`/v1/settings/team-users/${userId}/status`, { status })
}

export function resetTeamPassword(userId: number, newPassword?: string) {
  return apiPost<TeamUser>(`/v1/settings/team-users/${userId}/reset-password`, { newPassword })
}
