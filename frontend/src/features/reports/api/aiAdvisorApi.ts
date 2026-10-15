import { apiPost } from '../../../shared/api/apiClient'

export type AiAdvisorSummary = {
  totalMembers: number
  activeMembers: number
  expiredMembers: number
  nearExpiryMembers: number
  highRiskChurn: number
  mediumRiskChurn: number
  openDebtCount: number
  newMembersThisMonth: number
  renewalsThisMonth: number
  currentMonthRevenue: number
  previousMonthRevenue: number
  renewalOpportunityValue: number
  openDebtAmount: number
}

export type AiAdvisorSegment = {
  code: string
  label: string
  count: number
  estimatedRevenueAtRisk: number
  recommendation: string
}

export type AiAdvisorInsight = {
  healthStatus: 'GOOD' | 'WATCH' | 'RISK' | string
  overview: string
  topRisks: string[]
  revenueOpportunities: string[]
  actionPlan7Days: string[]
  trackingMetrics: string[]
  revenueRiskNote: string
  providerMessage: string | null
}

export type AiAdvisorResult = {
  year: number
  month: number
  aiGenerated: boolean
  model: string
  generatedAt: string
  summary: AiAdvisorSummary
  riskSegments: AiAdvisorSegment[]
  opportunitySegments: AiAdvisorSegment[]
  insight: AiAdvisorInsight
}

export type AiAdvisorPayload = {
  year: number
  month: number
}

export function analyzeRetentionRevenue(payload: AiAdvisorPayload) {
  return apiPost<AiAdvisorResult, AiAdvisorPayload>('/v1/ai/retention-revenue-advisor', payload)
}
