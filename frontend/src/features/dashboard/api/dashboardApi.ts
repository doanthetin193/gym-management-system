import { apiGet, apiPost, apiPut } from '../../../shared/api/apiClient'
import type {
  BusinessGoal,
  BusinessGoalPayload,
  BusinessGoalProgress,
  FinanceReport,
  MemberReport,
  OperationNotification,
  OwnerDashboard,
} from '../types/dashboard'

type PeriodParams = {
  year?: number
  month?: number
}

export function getOwnerDashboard(params: PeriodParams = {}) {
  return apiGet<OwnerDashboard>('/v1/dashboard/owner', { params })
}

export function listBusinessGoals(params: PeriodParams = {}) {
  return apiGet<BusinessGoal[]>('/v1/business-goals', { params })
}

export function createBusinessGoal(payload: BusinessGoalPayload) {
  return apiPost<BusinessGoal, BusinessGoalPayload>('/v1/business-goals', payload)
}

export function updateBusinessGoal(id: number, payload: BusinessGoalPayload) {
  return apiPut<BusinessGoal, BusinessGoalPayload>(`/v1/business-goals/${id}`, payload)
}

export function getBusinessGoalProgress(params: PeriodParams = {}) {
  return apiGet<BusinessGoalProgress>('/v1/business-goals/progress', { params })
}

export function getFinanceReport(params: PeriodParams = {}) {
  return apiGet<FinanceReport>('/v1/reports/finance', { params })
}

export function getMemberReport(params: PeriodParams = {}) {
  return apiGet<MemberReport>('/v1/reports/members', { params })
}

export function listNotifications() {
  return apiGet<OperationNotification[]>('/v1/notifications')
}
