import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { defaultPathForUser, hasAnyRole } from '../access'
import { useAuth } from '../../features/auth/context/authContext'

type RoleGuardProps = {
  allowedRoles: string[]
  children: ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth()

  if (!hasAnyRole(user, allowedRoles)) {
    return <Navigate to={defaultPathForUser(user)} replace />
  }

  return children
}
