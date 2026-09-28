import { apiGet, apiPost } from '../../../shared/api/apiClient'
import type { MembershipPlan, MembershipPlanPayload } from '../types/membershipPlan'

export function listMembershipPlans() {
  return apiGet<MembershipPlan[]>('/v1/membership-plans')
}

export function createMembershipPlan(payload: MembershipPlanPayload) {
  return apiPost<MembershipPlan, MembershipPlanPayload>('/v1/membership-plans', payload)
}
