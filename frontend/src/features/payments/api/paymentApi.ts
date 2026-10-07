import { apiGet, apiPost } from '../../../shared/api/apiClient'
import type {
  DebtRecord,
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
    },
  })
}

export function createPayment(payload: PaymentPayload) {
  return apiPost<PaymentTransaction, PaymentPayload>('/v1/payments', payload)
}
