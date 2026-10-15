export type PaymentMethod = 'CASH' | 'BANK_TRANSFER'

export type DebtStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'

export type RevenueCategory = 'SELF_TRAINING' | 'GUIDANCE' | 'PT_MAIN' | 'PT_NEW' | 'OTHER_INCOME'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

export const revenueCategoryLabels: Record<RevenueCategory, string> = {
  SELF_TRAINING: 'Gói tự tập',
  GUIDANCE: 'Kèm cặp / Hướng dẫn',
  PT_MAIN: 'Gói PT Chuẩn',
  PT_NEW: 'Gói PT Mới ra nghề',
  OTHER_INCOME: 'Gói tập khác',
}

export type DebtRecord = {
  id: number
  memberId: number
  memberName: string
  memberPhone: string
  membershipId: number | null
  planName: string | null
  originalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string | null
  status: DebtStatus
  note: string | null
}

export type PaymentTransaction = {
  id: number
  memberId: number
  memberName: string
  debtRecordId: number | null
  membershipId: number | null
  paymentDate: string
  amount: number
  paymentMethod: PaymentMethod
  revenueCategory: RevenueCategory
  note: string | null
}

export type PaymentPayload = {
  memberId: number
  debtRecordId?: number | null
  membershipId?: number | null
  paymentDate?: string | null
  amount: number
  paymentMethod: PaymentMethod
  note?: string | null
}

export type ListDebtsParams = {
  memberId?: number
  status?: DebtStatus | 'OPEN'
}

export type ListPaymentsParams = {
  memberId?: number
  fromDate?: string
  toDate?: string
  paymentMethod?: PaymentMethod
}
