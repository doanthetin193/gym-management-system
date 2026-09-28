import {
  CalendarClock,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Target,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppNavItem = {
  label: string
  path: string
  icon: LucideIcon
  status?: 'ready' | 'soon'
}

export const appNavItems: AppNavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/', status: 'ready' },
  { icon: Users, label: 'Khách hàng', path: '/members', status: 'ready' },
  { icon: Dumbbell, label: 'Gói tập', path: '/membership-plans', status: 'ready' },
  { icon: CreditCard, label: 'Thanh toán', path: '/payments', status: 'soon' },
  { icon: CalendarClock, label: 'Lịch PT', path: '/pt-schedule', status: 'soon' },
  { icon: Target, label: 'Mục tiêu', path: '/goals', status: 'soon' },
]
