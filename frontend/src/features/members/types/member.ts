import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'
import type { PaymentMethod } from '../../payments/types/payment'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type MemberSource = 'WALK_IN' | 'FACEBOOK' | 'ZALO' | 'REFERRAL' | 'OTHER'

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT'

export type SessionPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export const memberSourceLabels: Record<MemberSource, string> = {
  WALK_IN: 'Đến trực tiếp (Khách vãng lai)',
  FACEBOOK: 'Facebook / Mạng xã hội',
  ZALO: 'Zalo',
  REFERRAL: 'Người quen giới thiệu',
  OTHER: 'Nguồn khác',
}

export const membershipStatusLabels: Record<MembershipStatus, string> = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
  PENDING_PAYMENT: 'Chờ thanh toán',
}

export const sessionPackageStatusLabels: Record<SessionPackageStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}

export const memberStatusLabels: Record<MemberStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  ARCHIVED: 'Lưu trữ',
}

export type MemberListFilter = 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'

export type MemberSummary = {
  id: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  status: MemberStatus
  currentMembershipId: number | null
  currentPlanName: string | null
  currentPlanType: MembershipPlan['planType'] | null
  currentMembershipStatus: MembershipStatus | null
  startDate: string | null
  endDate: string | null
  daysUntilExpiration: number | null
}

export type MemberProfile = {
  id: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  gender: Gender | null
  address: string | null
  zaloPhone: string | null
  source: MemberSource | null
  status: MemberStatus
  note: string | null
  userId?: number | null
  userEmail?: string | null
  userStatus?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | null
}

export type MemberPayload = {
  fullName: string
  phone: string
  dateOfBirth?: string | null
  gender?: Gender | null
  address?: string | null
  zaloPhone?: string | null
  source?: MemberSource | null
  status?: MemberStatus | null
  note?: string | null
}

export type MemberMembership = {
  id: number
  memberId: number
  memberName: string
  planId: number
  planName: string
  startDate: string
  endDate: string
  actualPrice: number
  paidAmount: number
  discountAmount: number
  debtAmount: number
  status: MembershipStatus
  note: string | null
}

export type MemberMembershipPayload = {
  planId: number
  soldByUserId?: number | null
  ptUserId?: number | null
  startDate: string
  endDate?: string | null
  actualPrice?: number | null
  discountAmount?: number | null
  initialPaidAmount?: number | null
  initialPaymentMethod?: PaymentMethod | null
  initialPaymentDate?: string | null
  initialPaymentNote?: string | null
  note?: string | null
}

export type PtSessionPackage = {
  id: number
  membershipId: number
  ptUserId: number | null
  ptFullName: string | null
  totalPtSessions: number
  usedPtSessions: number
  remainingPtSessions: number
  totalPracticeSessions: number
  usedPracticeSessions: number
  remainingPracticeSessions: number
  startDate: string
  endDate: string
  status: SessionPackageStatus
}

export type MemberDetail = {
  profile: MemberProfile
  activeMemberships: MemberMembership[]
  membershipHistory: MemberMembership[]
  ptSessionPackages: PtSessionPackage[]
  totalDebt: number
}

export type MemberPlanOption = Pick<MembershipPlan, 'id' | 'name' | 'planType' | 'defaultPrice'>
