export type OwnerDashboard = {
  totalMembers: number
  activeMembers: number
  expiringSoon: number
  expired: number
  newMembersThisMonth: number
  renewedMembersThisMonth: number
  monthlyIncome: number
  totalDebt: number
  unreadNotifications: number
}

export type FinanceReportRow = {
  month: number
  income: number
}

export type FinanceReport = {
  year: number
  month: number | null
  totalIncome: number
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
