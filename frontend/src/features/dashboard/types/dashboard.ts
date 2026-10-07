export type BusinessGoalCategory =
  | 'FINANCE'
  | 'SELF_TRAINING_MEMBER'
  | 'GUIDED_CUSTOMER'
  | 'NEW_PT_CUSTOMER'
  | 'MAIN_PT_CUSTOMER'
  | 'OTHER'

export type BusinessGoalMetric =
  | 'REVENUE'
  | 'PROFIT'
  | 'CUSTOMER_COUNT'
  | 'NEW_CUSTOMER_COUNT'
  | 'PT_CUSTOMER_COUNT'

export type OwnerDashboard = {
  totalMembers: number
  activeMembers: number
  expiringSoon: number
  expired: number
  newMembersThisMonth: number
  renewedMembersThisMonth: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyProfit: number
  totalDebt: number
  unreadNotifications: number
}

export type BusinessGoal = {
  id: number
  year: number
  month: number
  category: BusinessGoalCategory
  metricName: BusinessGoalMetric
  targetValue: number
  actualValueOverride: number | null
  unit: string | null
  note: string | null
}

export type BusinessGoalPayload = {
  year: number
  month: number
  category: BusinessGoalCategory
  metricName: BusinessGoalMetric
  targetValue: number
  actualValueOverride?: number | null
  unit?: string | null
  note?: string | null
}

export type BusinessGoalProgressItem = {
  goalId: number
  category: BusinessGoalCategory
  metricName: BusinessGoalMetric
  targetValue: number
  actualValue: number
  progressPercent: number
  unit: string | null
  note: string | null
  manualActual: boolean
}

export type BusinessGoalProgress = {
  year: number
  month: number
  items: BusinessGoalProgressItem[]
}

export type FinanceReportRow = {
  month: number
  income: number
  expense: number
  profit: number
}

export type FinanceReport = {
  year: number
  month: number | null
  totalIncome: number
  totalExpense: number
  profit: number
  rows: FinanceReportRow[]
}

export type MemberReport = {
  year: number
  month: number
  newMembers: number
  renewedMembers: number
  selfTrainingCustomers: number
  guidedCustomers: number
  newPtCustomers: number
  mainPtCustomers: number
  expiringSoon: number
  expired: number
}

export type OperationNotification = {
  id: string
  type: string
  title: string
  message: string
  memberId: number | null
  memberName: string | null
  dueDate: string | null
  amount: number | null
  read: boolean
}
