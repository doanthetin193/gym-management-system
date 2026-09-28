export type PlanType = 'SELF_TRAINING' | 'PT' | 'GUIDANCE' | 'OTHER'

export type PtLevel = 'MAIN' | 'NEW'

export type ContentAccessLevel = 'NONE' | 'BASIC' | 'PREMIUM'

export type MembershipPlan = {
  id: number
  name: string
  planType: PlanType
  ptLevel: PtLevel | null
  durationDays: number | null
  defaultPrice: number | null
  ptSessionCount: number | null
  practiceSessionCount: number | null
  guidanceSessionCount: number | null
  contentAccessLevel: ContentAccessLevel
  priceRatio: number | null
  description: string | null
  active: boolean
}

export type MembershipPlanPayload = {
  name: string
  planType: PlanType
  ptLevel?: PtLevel | null
  durationDays?: number | null
  defaultPrice?: number | null
  ptSessionCount?: number | null
  practiceSessionCount?: number | null
  guidanceSessionCount?: number | null
  contentAccessLevel?: ContentAccessLevel | null
  priceRatio?: number | null
  description?: string | null
  active?: boolean | null
}
