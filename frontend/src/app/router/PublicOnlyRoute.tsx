import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/authContext'

export function PublicOnlyRoute() {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
