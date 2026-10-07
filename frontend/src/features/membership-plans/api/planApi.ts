import { apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type { MembershipPlan, MembershipPlanPayload } from '../types/membershipPlan'

export function listMembershipPlans() {
  return apiGet<MembershipPlan[]>('/v1/membership-plans')
}

export function listAllMembershipPlans() {
  return apiGet<MembershipPlan[]>('/v1/membership-plans/all')
}

export function createMembershipPlan(payload: MembershipPlanPayload) {
  return apiPost<MembershipPlan, MembershipPlanPayload>('/v1/membership-plans', payload)
}

export function updateMembershipPlanActive(id: number, active: boolean) {
  return apiPut<MembershipPlan, { active: boolean }>(`/v1/membership-plans/${id}/active`, { active })
}
