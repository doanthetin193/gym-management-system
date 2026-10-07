import type { MemberMembership, MemberProfile, PtSessionPackage } from '../../members/types/member'
import type { DebtRecord, PaymentTransaction } from '../../payments/types/payment'
import type { BodyMeasurement, PtGoal, PtSchedule, PtSessionLog } from '../../pt-schedule/types/pt'

export type MemberPortal = {
  profile: MemberProfile
  activeMemberships: MemberMembership[]
  membershipHistory: MemberMembership[]
  ptSessionPackages: PtSessionPackage[]
  debts: DebtRecord[]
  payments: PaymentTransaction[]
  schedules: PtSchedule[]
  sessionLogs: PtSessionLog[]
  bodyMeasurements: BodyMeasurement[]
  goals: PtGoal[]
  totalDebt: number
}
