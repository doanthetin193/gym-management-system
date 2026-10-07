export type TeamUserRole = 'OWNER' | 'PT'

export type TeamUser = {
  id: number
  email: string
  phone: string | null
  fullName: string
  roleCode: TeamUserRole
  roleName: string
  status: 'ACTIVE' | 'LOCKED'
  lastLoginAt: string | null
  createdAt: string
}

export type CreateTeamUserPayload = {
  email: string
  phone?: string | null
  fullName: string
  password?: string
  roleCode?: TeamUserRole
}
