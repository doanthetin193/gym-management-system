import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/authContext'
import { AppShell } from '../../layouts/AppShell'

export function ProtectedRoute() {
  const { bootstrapping, user } = useAuth()

  if (bootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-[var(--text-muted)]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="size-2 rounded-full bg-[var(--brand-yellow)]" />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <AppShell />
}
