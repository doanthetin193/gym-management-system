import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { RoleGuard } from './router/RoleGuard'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { HomePage } from '../features/public-home/pages/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { MemberDetailPage } from '../features/members/pages/MemberDetailPage'
import { MembersPage } from '../features/members/pages/MembersPage'
import { MembershipPlansPage } from '../features/membership-plans/pages/MembershipPlansPage'
import { MemberPortalPage } from '../features/member-portal/pages/MemberPortalPage'
import { PaymentsPage } from '../features/payments/pages/PaymentsPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { RemindersPage } from '../features/reminders/pages/RemindersPage'
import { PtSchedulePage } from '../features/pt-schedule/pages/PtSchedulePage'
import { GoalsPage } from '../features/goals/pages/GoalsPage'
import { OwnerExercisesPage } from '../features/exercises/pages/OwnerExercisesPage'
import { PublicExerciseDetailPage } from '../features/exercises/pages/PublicExerciseDetailPage'
import { PublicExercisesPage } from '../features/exercises/pages/PublicExercisesPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/exercises" element={<PublicExercisesPage />} />
        <Route path="/exercises/:slug" element={<PublicExerciseDetailPage />} />

        <Route path="/login" element={<PublicOnlyRoute />}>
          <Route index element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/my-progress" element={<RoleGuard allowedRoles={['MEMBER']}><MemberPortalPage /></RoleGuard>} />
          <Route path="/dashboard" element={<RoleGuard allowedRoles={['OWNER']}><DashboardPage /></RoleGuard>} />
          <Route path="/members" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><MembersPage /></RoleGuard>} />
          <Route path="/members/:memberId" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><MemberDetailPage /></RoleGuard>} />
          <Route path="/membership-plans" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><MembershipPlansPage /></RoleGuard>} />
          <Route path="/payments" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><PaymentsPage /></RoleGuard>} />
          <Route path="/reminders" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><RemindersPage /></RoleGuard>} />
          <Route path="/reminders/:type" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><RemindersPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={['OWNER']}><ReportsPage /></RoleGuard>} />
          <Route path="/pt-schedule" element={<RoleGuard allowedRoles={['OWNER', 'PT']}><PtSchedulePage /></RoleGuard>} />
          <Route path="/owner/exercises" element={<RoleGuard allowedRoles={['OWNER']}><OwnerExercisesPage /></RoleGuard>} />
          <Route path="/goals" element={<RoleGuard allowedRoles={['OWNER']}><GoalsPage /></RoleGuard>} />
          <Route path="/settings" element={<RoleGuard allowedRoles={['OWNER']}><SettingsPage /></RoleGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  )
}
