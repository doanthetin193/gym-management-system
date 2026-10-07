import { Navigate, Outlet } from 'react-router-dom'
import { defaultPathForUser } from '../access'
import { useAuth } from '../../features/auth/context/authContext'

export function PublicOnlyRoute() {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) {
    return null
  }

  if (user) {
    return <Navigate to={defaultPathForUser(user)} replace />
  }

  return <Outlet />
}
