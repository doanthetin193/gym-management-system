import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type MemberSource = 'WALK_IN' | 'FACEBOOK' | 'ZALO' | 'REFERRAL' | 'OTHER'

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT'

export type SessionPackageStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export type MemberListFilter = 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'

export type MemberSummary = {
  id: number
  fullName: string
  phone: string
  dateOfBirth: string | null
  status: MemberStatus
  currentMembershipId: number | null
  currentPlanName: string | null
  currentMembershipStatus: MembershipStatus | null
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
