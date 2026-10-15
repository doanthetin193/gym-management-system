import {
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppNavItem = {
  label: string
  path: string
  icon: LucideIcon
  status?: 'ready' | 'soon'
  roles: string[]
}

export const appNavItems: AppNavItem[] = [
  { icon: LineChart, label: 'Tiến trình của tôi', path: '/my-progress', status: 'ready', roles: ['MEMBER'] },
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard', status: 'ready', roles: ['OWNER'] },
  { icon: Users, label: 'Hội viên', path: '/members', status: 'ready', roles: ['OWNER', 'PT'] },
  { icon: Dumbbell, label: 'Gói tập', path: '/membership-plans', status: 'ready', roles: ['OWNER', 'PT'] },
  { icon: CalendarDays, label: 'Nhắc việc', path: '/reminders', status: 'ready', roles: ['OWNER', 'PT'] },
  { icon: CreditCard, label: 'Thanh toán', path: '/payments', status: 'ready', roles: ['OWNER', 'PT'] },
  { icon: ChartNoAxesCombined, label: 'Báo cáo', path: '/reports', status: 'ready', roles: ['OWNER'] },
  { icon: CalendarClock, label: 'Lịch PT', path: '/pt-schedule', status: 'ready', roles: ['OWNER', 'PT'] },
  { icon: LibraryBig, label: 'Thư viện', path: '/owner/exercises', status: 'ready', roles: ['OWNER'] },
  { icon: Settings, label: 'Cài đặt', path: '/settings', status: 'ready', roles: ['OWNER'] },
]
