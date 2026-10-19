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
  scenario: AiAdvisorScenarioInsight | null
  providerMessage: string | null
}

export type AiAdvisorScenarioInsight = {
  overview: string
  priorityActions: string[]
  cautions: string[]
}

export type AiAdvisorScenario = {
  debtCollectionPercent: number
  ptRecoveryPercent: number
  renewalConversionPercent: number
  debtCollectionPotential: number
  ptRecoveryPotential: number
  renewalOpportunityPotential: number
  estimatedDebtCollection: number
  estimatedPtRecoveryValue: number
  estimatedRenewalValue: number
  estimatedTotalImpact: number
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
  scenario: AiAdvisorScenario | null
  insight: AiAdvisorInsight
}

export type AiAdvisorPayload = {
  year: number
  month: number
  scenario?: AiAdvisorScenarioInput
}

export type AiAdvisorScenarioInput = {
  debtCollectionPercent: number
  ptRecoveryPercent: number
  renewalConversionPercent: number
}

export function analyzeRetentionRevenue(payload: AiAdvisorPayload) {
  return apiPost<AiAdvisorResult, AiAdvisorPayload>('/v1/ai/retention-revenue-advisor', payload)
}
