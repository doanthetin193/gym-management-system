import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { MembersPage } from '../features/members/pages/MembersPage'
import { MembershipPlansPage } from '../features/membership-plans/pages/MembershipPlansPage'
import { PaymentsPage } from '../features/payments/pages/PaymentsPage'
import { PtSchedulePage } from '../features/pt-schedule/pages/PtSchedulePage'
import { GoalsPage } from '../features/goals/pages/GoalsPage'

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute />}>
          <Route index element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/membership-plans" element={<MembershipPlansPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/pt-schedule" element={<PtSchedulePage />} />
          <Route path="/goals" element={<GoalsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  )
}
