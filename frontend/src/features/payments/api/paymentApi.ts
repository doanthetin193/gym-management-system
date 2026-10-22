import { apiGet, apiPost } from '../../../shared/api/apiClient'
import type { PageResponse } from '../../../shared/types/pagination'
import type {
  DebtRecord,
  FinanceSummary,
  ListDebtsParams,
  ListPaymentsParams,
  PaymentPayload,
  PaymentTransaction,
} from '../types/payment'

export function listDebts(params: ListDebtsParams = {}) {
  return apiGet<DebtRecord[]>('/v1/debts', {
    params: {
      memberId: params.memberId,
      status: params.status,
      keyword: params.keyword || undefined,
    },
  })
}

export function listDebtsPage(params: ListDebtsParams & { page?: number; size?: number } = {}) {
  return apiGet<PageResponse<DebtRecord>>('/v1/debts/page', {
    params: {
      memberId: params.memberId,
      status: params.status,
      keyword: params.keyword || undefined,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  })
}

export function listPayments(params: ListPaymentsParams = {}) {
  return apiGet<PaymentTransaction[]>('/v1/payments', {
    params: {
      memberId: params.memberId,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      paymentMethod: params.paymentMethod,
      keyword: params.keyword || undefined,
    },
  })
}

export function listPaymentsPage(params: ListPaymentsParams & { page?: number; size?: number } = {}) {
  return apiGet<PageResponse<PaymentTransaction>>('/v1/payments/page', {
    params: {
      memberId: params.memberId,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      paymentMethod: params.paymentMethod,
      keyword: params.keyword || undefined,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  })
}

export function getFinanceSummary() {
  return apiGet<FinanceSummary>('/v1/payments/summary')
}

export function createPayment(payload: PaymentPayload) {
  return apiPost<PaymentTransaction, PaymentPayload>('/v1/payments', payload)
}
