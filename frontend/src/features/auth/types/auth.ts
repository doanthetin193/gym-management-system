export type AuthUser = {
  id: number
  email: string
  fullName: string
  roles: string[]
}

export type LoginResponse = {
  tokenType: string
  accessToken: string
  expiresInMinutes: number
  user: AuthUser
}
