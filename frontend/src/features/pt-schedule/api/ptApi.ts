import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type {
  BodyMeasurement,
  BodyMeasurementPayload,
  MemberActivityLog,
  MemberActivityLogPayload,
  PtAssignment,
  PtAssignmentPayload,
  PtGoal,
  PtGoalPayload,
  PtMemberDetail,
  PtProfile,
  PtProfilePayload,
  PtSchedule,
  PtSchedulePayload,
  PtSessionLog,
  PtSessionLogPayload,
  PtSessionPackage,
} from '../types/pt'

export function listPtProfiles() {
  return apiGet<PtProfile[]>('/v1/pt/profiles')
}

export function savePtProfile(payload: PtProfilePayload) {
  return apiPost<PtProfile, PtProfilePayload>('/v1/pt/profiles', payload)
}

export function listMyPtMembers(ptUserId?: number) {
  return apiGet<PtAssignment[]>('/v1/pt/my-members', {
    params: { ptUserId },
  })
}

export function assignPtMember(payload: PtAssignmentPayload) {
  return apiPost<PtAssignment, PtAssignmentPayload>('/v1/pt/assignments', payload)
}

export function reassignPtMember(assignmentId: number, payload: { ptUserId: number; note?: string | null }) {
  return apiPut<PtAssignment, { ptUserId: number; note?: string | null }>(`/v1/pt/assignments/${assignmentId}/reassign`, payload)
}

export function listPtSchedules(params: { ptUserId?: number; fromDate?: string; toDate?: string } = {}) {
  return apiGet<PtSchedule[]>('/v1/pt/schedules', { params })
}

export function createPtSchedule(payload: PtSchedulePayload) {
  return apiPost<PtSchedule, PtSchedulePayload>('/v1/pt/schedules', payload)
}

export function deletePtSchedule(scheduleId: number) {
  return apiDelete<void>(`/v1/pt/schedules/${scheduleId}`)
}

export function listPtSessionPackages(memberId?: number) {
  return apiGet<PtSessionPackage[]>('/v1/pt/session-packages', {
    params: { memberId },
  })
}

export function getPtMemberDetail(memberId: number) {
  return apiGet<PtMemberDetail>(`/v1/pt/members/${memberId}`)
}

export function createPtSessionLog(memberId: number, payload: PtSessionLogPayload) {
  return apiPost<PtSessionLog, PtSessionLogPayload>(`/v1/pt/members/${memberId}/session-logs`, payload)
}

export function createActivityLog(memberId: number, payload: MemberActivityLogPayload) {
  return apiPost<MemberActivityLog, MemberActivityLogPayload>(`/v1/pt/members/${memberId}/activity-logs`, payload)
}

export function createBodyMeasurement(memberId: number, payload: BodyMeasurementPayload) {
  return apiPost<BodyMeasurement, BodyMeasurementPayload>(`/v1/pt/members/${memberId}/body-measurements`, payload)
}

export function createPtGoal(memberId: number, payload: PtGoalPayload) {
  return apiPost<PtGoal, PtGoalPayload>(`/v1/pt/members/${memberId}/goals`, payload)
}
