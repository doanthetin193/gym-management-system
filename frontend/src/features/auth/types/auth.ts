export type AuthUser = {
  id: number
  username: string
  fullName: string
  roles: string[]
}

export type LoginResponse = {
  tokenType: string
  accessToken: string
  expiresInMinutes: number
  user: AuthUser
}
