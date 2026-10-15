import { apiGet } from '../../../shared/api/apiClient'
import type {
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

export function getFinanceReport(params: PeriodParams = {}) {
  return apiGet<FinanceReport>('/v1/reports/finance', { params })
}

export function getMemberReport(params: PeriodParams = {}) {
  return apiGet<MemberReport>('/v1/reports/members', { params })
}

export function listNotifications() {
  return apiGet<OperationNotification[]>('/v1/notifications')
}
