import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  Gift,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import { listPtSchedules } from '../../pt-schedule/api/ptApi'
import type { PtSchedule } from '../../pt-schedule/types/pt'
import { getMemberReport, getOwnerDashboard, listNotifications } from '../api/dashboardApi'
import type { MemberReport, OperationNotification, OwnerDashboard } from '../types/dashboard'

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value ?? 0,
  )
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể tải dashboard. Vui lòng thử lại.'
}

type ActionFilterTab = 'ALL' | 'DEBT' | 'EXPIRED' | 'SCHEDULE'

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null)
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null)
  const [todaySchedules, setTodaySchedules] = useState<PtSchedule[]>([])
  const [notifications, setNotifications] = useState<OperationNotification[]>([])
  const [activeTab, setActiveTab] = useState<ActionFilterTab>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardData, notiData, memberReportData, scheduleData] = await Promise.all([
        getOwnerDashboard({ year, month }),
        listNotifications(),
        getMemberReport({ year, month }).catch(() => null),
        listPtSchedules({ fromDate: todayStr, toDate: todayStr }).catch(() => []),
      ])
      setDashboard(dashboardData)
      setNotifications(notiData)
      setMemberReport(memberReportData)
      setTodaySchedules(scheduleData)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [year, month, todayStr])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void loadData()
  }, [loadData])

  const actionStats = useMemo(() => {
    const debtCount = notifications.filter((item) => item.type.includes('DEBT')).length
    const expiringCount = notifications.filter(
      (item) => item.type.includes('EXPIRED') || item.type.includes('EXPIRING'),
    ).length

    return {
      debtCount,
      expiringCount,
      scheduleCount: todaySchedules.length,
      total: notifications.length + todaySchedules.length,
    }
  }, [notifications, todaySchedules.length])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'DEBT') {
      return notifications.filter((item) => item.type.includes('DEBT'))
    }
    if (activeTab === 'EXPIRED') {
      return notifications.filter((item) => item.type.includes('EXPIRED') || item.type.includes('EXPIRING'))
    }
    return notifications
  }, [activeTab, notifications])

  const memberPercent = dashboard?.totalMembers
    ? Math.round(((dashboard.activeMembers ?? 0) / dashboard.totalMembers) * 100)
    : 0

  const profitPositive = (dashboard?.monthlyProfit ?? 0) >= 0

  // Calculate PT vs Self-training numbers for practical breakdown
  const ptCount = (memberReport?.newPtCustomers ?? 0) + (memberReport?.mainPtCustomers ?? 0)
  const rawSelf = (memberReport?.selfTrainingCustomers ?? 0) + (memberReport?.guidedCustomers ?? 0)
  const selfCount = rawSelf > 0 ? rawSelf : Math.max(0, (dashboard?.activeMembers ?? 0) - ptCount)

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ================= 1. HEADER BAR ================= */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-5 dark:border-white/[0.08]">
        {/* Title & Date Badge */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-[#ffcc08] animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Tổng Quan Vận Hành
              </h1>
            </div>

            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs md:text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              Tháng {month}/{year}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={15} />
              <span>Thu T{month}: {loading ? '...' : formatMoney(dashboard?.monthlyIncome)}</span>
            </span>
          </div>
          <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-gray-400">
            Trung tâm kiểm soát tài chính, ca dạy PT và công việc cần xử lý trong ngày.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/members"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#df271b] to-[#b91c1c] px-4 md:px-5 text-sm font-black text-white shadow-sm hover:brightness-110 active:scale-98 transition"
          >
            <UserPlus size={17} />
            <span>+ Thêm hội viên</span>
          </Link>

          <Link
            to="/payments"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm hover:border-[#ffcc08] hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/25 transition"
          >
            <WalletCards size={17} />
            <span>Xem công nợ</span>
          </Link>

          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white transition"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= 2. TOP 4 KPI CARDS (CHỮ TO RÕ RÀNG) ================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng hội viên */}
        <Link
          to="/members"
          className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-[#087ec1] hover:shadow-md dark:border-white/[0.08] dark:bg-[#0c1017] dark:hover:border-[#087ec1]/60 overflow-hidden"
        >
          <div className="pointer-events-none absolute right-0 top-0 size-28 rounded-full bg-[#087ec1]/10 blur-xl transition group-hover:scale-125" />

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Tổng hội viên
            </span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#087ec1] dark:bg-[#087ec1]/15">
              <Users size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {loading ? '...' : dashboard?.totalMembers ?? 0}
            </p>
            <span className="text-xs font-bold text-[#087ec1]">Hồ sơ lưu</span>
          </div>
        </Link>

        {/* 2. Đang hoạt động */}
        <Link
          to="/members"
          className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md dark:border-white/[0.08] dark:bg-[#0c1017] dark:hover:border-emerald-500/60 overflow-hidden"
        >
          <div className="pointer-events-none absolute right-0 top-0 size-28 rounded-full bg-emerald-500/10 blur-xl transition group-hover:scale-125" />

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Đang tập luyện
            </span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <UserCheck size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl md:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : dashboard?.activeMembers ?? 0}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {memberPercent}% tệp
            </span>
          </div>
        </Link>

        {/* 3. Sắp / Đã hết hạn */}
        <Link
          to="/reminders"
          className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-white/[0.08] dark:bg-[#0c1017] dark:hover:border-amber-400/60 overflow-hidden"
        >
          <div className="pointer-events-none absolute right-0 top-0 size-28 rounded-full bg-amber-400/10 blur-xl transition group-hover:scale-125" />

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Sắp / Đã hết hạn
            </span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <CalendarClock size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl md:text-4xl font-black tracking-tight text-amber-500">
              {loading ? '...' : (dashboard?.expiringSoon ?? 0) + (dashboard?.expired ?? 0)}
            </p>
            <span className="inline-flex rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              Cần gia hạn
            </span>
          </div>
        </Link>

        {/* 4. Tổng công nợ */}
        <Link
          to="/payments"
          className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-red-500 hover:shadow-md dark:border-white/[0.08] dark:bg-[#0c1017] dark:hover:border-red-500/60 overflow-hidden"
        >
          <div className="pointer-events-none absolute right-0 top-0 size-28 rounded-full bg-red-500/10 blur-xl transition group-hover:scale-125" />

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Công nợ chưa thu
            </span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <CreditCard size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl md:text-3xl font-black tracking-tight text-red-600 dark:text-red-400">
              {loading ? '...' : formatMoney(dashboard?.totalDebt)}
            </p>
            <span className="inline-flex rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-700 dark:bg-red-500/15 dark:text-red-300">
              Cần thu hồi
            </span>
          </div>
        </Link>
      </section>

      {/* ================= 3. TRUNG TÂM VẬN HÀNH THIẾT THỰC (2 CỘT) ================= */}
      <section className="grid gap-6 lg:grid-cols-12 items-start">
        {/* ================= CỘT TRÁI (lg:col-span-7): TÀI CHÍNH & CƠ CẤU HỌC VIÊN ================= */}
        <div className="space-y-5 lg:col-span-7">
          {/* Card 1: Tài chính & Thu chi */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c1017] space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-white/[0.06]">
              <div>
                <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                  Tài chính & Hiệu suất T{month}/{year}
                </p>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                  Doanh thu, Chi phí & Lợi nhuận
                </h2>
              </div>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#087ec1] hover:underline dark:text-[#ffcc08]"
              >
                <span>Báo cáo chi tiết</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 3 Hộp số liệu to, rõ ràng */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <FinanceBlock label="Tổng thu" value={formatMoney(dashboard?.monthlyIncome)} tone="green" />
              <FinanceBlock label="Tổng chi" value={formatMoney(dashboard?.monthlyExpense)} tone="red" />
              <FinanceBlock
                label="Lợi nhuận"
                value={formatMoney(dashboard?.monthlyProfit)}
                tone={profitPositive ? 'green' : 'red'}
              />
            </div>

            {/* Cảnh báo công nợ trực quan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 dark:border-red-500/20">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-gray-300">
                  Công nợ học phí chưa thu:
                </span>
                <strong className="text-sm md:text-base font-black text-red-600 dark:text-red-400">
                  {formatMoney(dashboard?.totalDebt)}
                </strong>
              </div>
              <Link
                to="/payments"
                className="inline-flex items-center gap-1 text-xs md:text-sm font-black text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                <span>Thu nợ & Sổ quỹ</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 2: Phân bổ học viên theo nhóm (Thay thế thanh 63% rối mắt) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c1017] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-white/[0.06]">
              <div>
                <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                  Hiện trạng học viên phòng gym
                </p>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                  Cơ cấu học viên theo dịch vụ
                </h3>
              </div>
              <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-gray-400">
                Đang tập: <strong className="text-emerald-500">{dashboard?.activeMembers ?? 0} người</strong>
              </span>
            </div>

            {/* 4 Nhóm dịch vụ thiết thực */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 dark:border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
                    Khách kèm PT (VIP)
                  </span>
                  <Dumbbell size={16} className="text-amber-500" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {ptCount}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">học viên</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">
                  Gói dạy kèm 1-1 & giáo án
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 dark:border-blue-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-blue-600 dark:text-[#087ec1]">
                    Khách tự tập thường
                  </span>
                  <Users size={16} className="text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {selfCount}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">hội viên</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">
                  Gói tháng tự do theo buổi
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 dark:border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Khách mới tháng {month}
                  </span>
                  <UserPlus size={16} className="text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {dashboard?.newMembersThisMonth ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">người</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">Đăng ký mới trong tháng</p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 dark:border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-purple-600 dark:text-purple-400">
                    Lượt gia hạn / quay lại
                  </span>
                  <TrendingUp size={16} className="text-purple-500" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {dashboard?.renewedMembersThisMonth ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-gray-400">lượt</span>
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-gray-400">Tái đăng ký duy trì</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (lg:col-span-5): TRUNG TÂM HÀNH ĐỘNG HÔM NAY ================= */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c1017] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-white/[0.06]">
              <div>
                <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                  Hành động ngay
                </p>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                  Nhắc việc & Lịch PT hôm nay
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs md:text-sm font-bold text-[#087ec1] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                <Bell size={13} />
                <span>{actionStats.total} mục</span>
              </span>
            </div>

            {/* Smart Filter Tabs (To rõ, dễ bấm) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs md:text-sm font-black transition ${
                  activeTab === 'ALL'
                    ? 'bg-[#087ec1] text-white shadow-sm dark:bg-[#ffcc08] dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                <span>Tất cả</span>
                <span className="rounded-full bg-black/10 dark:bg-black/20 px-1.5 py-0.2 text-xs">
                  {notifications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DEBT')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs md:text-sm font-black transition ${
                  activeTab === 'DEBT'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                <span>Công nợ</span>
                <span className="rounded-full bg-black/10 dark:bg-black/20 px-1.5 py-0.2 text-xs">
                  {actionStats.debtCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EXPIRED')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs md:text-sm font-black transition ${
                  activeTab === 'EXPIRED'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                <span>Hạn gói</span>
                <span className="rounded-full bg-black/10 dark:bg-black/20 px-1.5 py-0.2 text-xs">
                  {actionStats.expiringCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SCHEDULE')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs md:text-sm font-black transition ${
                  activeTab === 'SCHEDULE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                <span>Lịch PT ({todaySchedules.length})</span>
              </button>
            </div>

            {/* Content Display based on Tab */}
            {activeTab === 'SCHEDULE' ? (
              /* Danh sách ca PT hôm nay */
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                {todaySchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
                    <Calendar size={28} className="text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-300">
                      Hôm nay chưa có ca dạy PT nào được xếp
                    </p>
                    <Link
                      to="/pt-schedule"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-yellow)] px-3 py-1.5 text-xs font-black text-black"
                    >
                      + Xếp lịch PT ngay
                    </Link>
                  </div>
                ) : (
                  todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 dark:border-emerald-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 font-black">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {schedule.startTime?.toString().slice(0, 5)} - {schedule.endTime?.toString().slice(0, 5)}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            {schedule.ptFullName} ➔ <strong className="text-emerald-400">{schedule.memberName}</strong>
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/pt-schedule"
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text)] hover:text-white"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Danh sách Nhắc việc cần xử lý */
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
                    <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Không có việc cần xử lý</p>
                    <p className="text-xs text-slate-400 dark:text-gray-400 mt-1">
                      Mọi học viên trong mục này đều ở trạng thái tốt.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <CleanNotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            )}

            {/* Footer Links */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs md:text-sm font-bold dark:border-white/[0.06]">
              <Link
                to="/reminders"
                className="text-slate-600 hover:text-[#087ec1] dark:text-gray-400 dark:hover:text-[#ffcc08] transition flex items-center gap-1"
              >
                <span>Xem tất cả danh sách nhắc việc</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/pt-schedule"
                className="text-slate-600 hover:text-[#087ec1] dark:text-gray-400 dark:hover:text-[#ffcc08] transition flex items-center gap-1"
              >
                <span>Xem lịch PT</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FinanceBlock({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' }) {
  const isGreen = tone === 'green'
  const Icon = isGreen ? TrendingUp : TrendingDown

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 md:p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">{label}</span>
        <div
          className={`flex size-7 items-center justify-center rounded-lg ${
            isGreen
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
          }`}
        >
          <Icon size={15} />
        </div>
      </div>
      <p className="mt-2 text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  )
}

function CleanNotificationItem({ notification }: { notification: OperationNotification }) {
  const isDebt = notification.type.includes('DEBT')
  const isBirthday = notification.type.includes('BIRTHDAY')
  const isExpired = notification.type.includes('EXPIRED') || notification.type.includes('EXPIRING')

  let destination = '/members'
  let actionLabel = 'Xem hồ sơ'
  let Icon = AlertCircle
  let toneStyles = {
    iconBg: 'bg-blue-50 text-[#087ec1] dark:bg-blue-500/15 dark:text-blue-400',
    border: 'hover:border-[#087ec1]/50',
    titleColor: 'text-[#087ec1]',
  }

  if (isDebt) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/payments'
    actionLabel = 'Thu nợ ngay'
    Icon = CreditCard
    toneStyles = {
      iconBg: 'bg-red-50 text-[#df271b] dark:bg-red-500/15 dark:text-red-400',
      border: 'hover:border-[#df271b]/50',
      titleColor: 'text-red-600 dark:text-red-400',
    }
  } else if (isBirthday) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/reminders'
    actionLabel = 'Chúc mừng'
    Icon = Gift
    toneStyles = {
      iconBg: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
      border: 'hover:border-pink-500/50',
      titleColor: 'text-pink-600 dark:text-pink-400',
    }
  } else if (isExpired) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/members'
    actionLabel = 'Gia hạn gói'
    Icon = CalendarClock
    toneStyles = {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-[#ffcc08]/15 dark:text-[#ffcc08]',
      border: 'hover:border-[#ffcc08]/50',
      titleColor: 'text-amber-600 dark:text-amber-400',
    }
  }

  return (
    <Link
      to={destination}
      className={`group flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] ${toneStyles.border}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles.iconBg}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs md:text-sm font-black ${toneStyles.titleColor}`}>
              {notification.title}
            </span>
            {notification.dueDate && (
              <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-gray-400">
                • {formatDate(notification.dueDate)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {notification.memberName && (
              <span className="inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-black text-slate-800 dark:bg-white/10 dark:text-white">
                {notification.memberName}
              </span>
            )}
            {notification.amount != null && notification.amount > 0 && (
              <span className="text-xs md:text-sm font-black text-red-600 dark:text-red-400">
                {formatMoney(notification.amount)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2">
        <span className="hidden sm:inline-block text-xs font-bold text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition">
          {actionLabel}
        </span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:border-[#087ec1] group-hover:text-[#087ec1] dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:group-hover:text-white transition">
          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
