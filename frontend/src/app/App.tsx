import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { ProtectedRoute } from './router/ProtectedRoute'
import { PublicOnlyRoute } from './router/PublicOnlyRoute'
import { RoleGuard } from './router/RoleGuard'

const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const HomePage = lazy(() => import('../features/public-home/pages/HomePage').then((module) => ({ default: module.HomePage })))
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const MemberDetailPage = lazy(() => import('../features/members/pages/MemberDetailPage').then((module) => ({ default: module.MemberDetailPage })))
const MembersPage = lazy(() => import('../features/members/pages/MembersPage').then((module) => ({ default: module.MembersPage })))
const MembershipPlansPage = lazy(() => import('../features/membership-plans/pages/MembershipPlansPage').then((module) => ({ default: module.MembershipPlansPage })))
const MemberPortalPage = lazy(() => import('../features/member-portal/pages/MemberPortalPage').then((module) => ({ default: module.MemberPortalPage })))
const PaymentsPage = lazy(() => import('../features/payments/pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage })))
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const RemindersPage = lazy(() => import('../features/reminders/pages/RemindersPage').then((module) => ({ default: module.RemindersPage })))
const PtSchedulePage = lazy(() => import('../features/pt-schedule/pages/PtSchedulePage').then((module) => ({ default: module.PtSchedulePage })))
const OwnerExercisesPage = lazy(() => import('../features/exercises/pages/OwnerExercisesPage').then((module) => ({ default: module.OwnerExercisesPage })))
const PublicExerciseDetailPage = lazy(() => import('../features/exercises/pages/PublicExerciseDetailPage').then((module) => ({ default: module.PublicExerciseDetailPage })))
const PublicExercisesPage = lazy(() => import('../features/exercises/pages/PublicExercisesPage').then((module) => ({ default: module.PublicExercisesPage })))
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-[var(--text-muted)]">
      <div className="flex items-center gap-3 text-sm font-semibold">
        <span className="size-2 rounded-full bg-[var(--brand-yellow)]" />
        Đang tải giao diện...
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<PageFallback />}>
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
            <Route path="/settings" element={<RoleGuard allowedRoles={['OWNER']}><SettingsPage /></RoleGuard>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProviders>
  )
}
