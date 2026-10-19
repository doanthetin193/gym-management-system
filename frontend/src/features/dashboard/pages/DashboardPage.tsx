import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  Gift,
  RefreshCcw,
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

  // Calculate PT vs Self-training numbers for practical breakdown
  const ptCount = (memberReport?.newPtCustomers ?? 0) + (memberReport?.mainPtCustomers ?? 0)
  const rawSelf = (memberReport?.selfTrainingCustomers ?? 0) + (memberReport?.guidedCustomers ?? 0)
  const selfCount = rawSelf > 0 ? rawSelf : Math.max(0, (dashboard?.activeMembers ?? 0) - ptCount)

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12 animate-in fade-in duration-200">
      {/* ================= 1. HEADER BAR ================= */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Trung Tâm Vận Hành • Tháng {month}/{year}
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Tổng Quan Vận Hành
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            Theo dõi tài chính, ca dạy PT và công việc ưu tiên trong ngày.
          </p>
        </div>

        {/* Action Buttons (Đồng bộ chuẩn 100% với các trang khác) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface-muted)]"
            title="Làm mới dữ liệu"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <Link
            to="/payments"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface-muted)]"
          >
            <WalletCards size={16} />
            <span>Xem công nợ</span>
          </Link>

          <Link
            to="/members"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 text-sm font-black text-white shadow-md shadow-red-950/20 transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
          >
            <UserPlus size={16} />
            <span>+ Thêm hội viên</span>
          </Link>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          <AlertCircle size={18} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= 2. TOP 4 KPI CARDS (ĐỒNG BỘ TYPOGRAPHY & KHÔNG BỊ TRÀN CHỮ) ================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* 1. Tổng hội viên */}
        <Link
          to="/members"
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-blue-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tổng hội viên
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-400">
              <Users size={18} />
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
              {loading ? '...' : dashboard?.totalMembers ?? 0}
            </span>
            <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-bold text-[var(--text-muted)]">
              Toàn hệ thống
            </span>
          </div>
        </Link>

        {/* 2. Đang tập luyện */}
        <Link
          to="/members"
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Đang tập luyện
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <UserCheck size={18} />
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-emerald-400 sm:text-3xl">
              {loading ? '...' : dashboard?.activeMembers ?? 0}
            </span>
            <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {memberPercent}% tệp
            </span>
          </div>
        </Link>

        {/* 3. Sắp / Đã hết hạn */}
        <Link
          to="/reminders"
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-amber-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Sắp / Đã hết hạn
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
              <CalendarClock size={18} />
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-black text-amber-400 sm:text-3xl">
              {loading ? '...' : (dashboard?.expiringSoon ?? 0) + (dashboard?.expired ?? 0)}
            </span>
            <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
              Cần gia hạn
            </span>
          </div>
        </Link>

        {/* 4. Tổng công nợ */}
        <Link
          to="/payments"
          className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-red-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Công nợ chưa thu
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-400">
              <CreditCard size={18} />
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2 min-w-0">
            <span className="text-xl font-black text-red-400 sm:text-2xl truncate">
              {loading ? '...' : formatMoney(dashboard?.totalDebt)}
            </span>
            <span className="shrink-0 rounded-lg bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400 whitespace-nowrap">
              Cần thu
            </span>
          </div>
        </Link>
      </section>

      {/* ================= 3. TRUNG TÂM VẬN HÀNH (2 CỘT GỌN GÀNG, KHÔNG RỐI MẮT) ================= */}
      <section className="grid gap-5 lg:grid-cols-12 items-start">
        {/* ================= CỘT TRÁI (lg:col-span-7): TÀI CHÍNH & CƠ CẤU HỘI VIÊN ================= */}
        <div className="space-y-5 lg:col-span-7">
          {/* Card 1: Tài chính tháng này */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-strong)]">
                  Tài chính tháng {month}/{year}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Dòng tiền từ các gói tập và công nợ tồn đọng
                </p>
              </div>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-yellow)] hover:underline"
              >
                <span>Báo cáo chi tiết</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Thực thu */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Thực thu gói tập
                  </span>
                  <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <TrendingUp size={15} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  {loading ? '...' : formatMoney(dashboard?.monthlyIncome)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Đã thu thực tế trong tháng</p>
              </div>

              {/* Công nợ chưa thu */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Công nợ chưa thu
                  </span>
                  <span className="grid size-7 place-items-center rounded-lg bg-red-500/15 text-red-400">
                    <CreditCard size={15} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black text-red-400">
                  {loading ? '...' : formatMoney(dashboard?.totalDebt)}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Khoản thu còn thiếu</span>
                  <Link
                    to="/payments"
                    className="text-xs font-bold text-red-400 hover:underline"
                  >
                    Thu nợ ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Phân bổ hội viên (Thiết kế dạng thẻ ngắn gọn, không nhồi nhét chữ) */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-strong)]">
                  Cơ cấu hội viên
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Phân bổ dịch vụ tập luyện và xu hướng tăng trưởng
                </p>
              </div>
              <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                {dashboard?.activeMembers ?? 0} đang tập
              </span>
            </div>

            {/* 4 Thẻ chỉ số tinh gọn */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">Tự tập thường</span>
                  <Users size={15} className="text-blue-400" />
                </div>
                <p className="mt-2 text-xl font-black text-[var(--text-strong)]">
                  {selfCount} <span className="text-xs font-normal text-[var(--text-muted)]">hội viên</span>
                </p>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Khách kèm PT</span>
                  <Dumbbell size={15} className="text-amber-400" />
                </div>
                <p className="mt-2 text-xl font-black text-[var(--text-strong)]">
                  {ptCount} <span className="text-xs font-normal text-[var(--text-muted)]">học viên</span>
                </p>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Khách mới T{month}</span>
                  <UserPlus size={15} className="text-emerald-400" />
                </div>
                <p className="mt-2 text-xl font-black text-[var(--text-strong)]">
                  {dashboard?.newMembersThisMonth ?? 0}{' '}
                  <span className="text-xs font-normal text-[var(--text-muted)]">người</span>
                </p>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Gia hạn / Quay lại</span>
                  <RefreshCcw size={15} className="text-purple-400" />
                </div>
                <p className="mt-2 text-xl font-black text-[var(--text-strong)]">
                  {dashboard?.renewedMembersThisMonth ?? 0}{' '}
                  <span className="text-xs font-normal text-[var(--text-muted)]">người</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (lg:col-span-5): TRUNG TÂM HÀNH ĐỘNG HÔM NAY ================= */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-strong)]">
                  Hành động ưu tiên
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Công nợ, gia hạn gói và lịch dạy PT hôm nay
                </p>
              </div>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
                {actionStats.total} việc
              </span>
            </div>

            {/* Smart Filter Tabs (Đồng bộ cỡ chữ với các trang khác) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'ALL'
                    ? 'bg-[var(--brand-yellow)] text-slate-900 shadow-sm'
                    : 'border border-[var(--line)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Tất cả</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
                  {notifications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DEBT')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'DEBT'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'border border-[var(--line)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Công nợ</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {actionStats.debtCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EXPIRED')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'EXPIRED'
                    ? 'bg-amber-500 text-slate-900 shadow-sm'
                    : 'border border-[var(--line)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Hạn gói</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
                  {actionStats.expiringCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SCHEDULE')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'SCHEDULE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-[var(--line)] bg-[var(--surface-muted)]/60 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Lịch PT ({todaySchedules.length})</span>
              </button>
            </div>

            {/* Content Display based on Tab */}
            {activeTab === 'SCHEDULE' ? (
              /* Danh sách ca PT hôm nay */
              <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                {todaySchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] p-8 text-center">
                    <Calendar size={24} className="text-[var(--text-muted)] mb-2" />
                    <p className="text-xs font-bold text-[var(--text)]">
                      Hôm nay chưa có ca dạy PT nào
                    </p>
                    <Link
                      to="/pt-schedule"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-yellow)] px-3 py-1.5 text-xs font-bold text-slate-900"
                    >
                      + Xếp lịch ngay
                    </Link>
                  </div>
                ) : (
                  todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                          <Clock size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-strong)]">
                            {schedule.startTime?.toString().slice(0, 5)} - {schedule.endTime?.toString().slice(0, 5)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {schedule.ptFullName} ➔ <strong className="text-emerald-400">{schedule.memberName}</strong>
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/pt-schedule"
                        className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text)] hover:text-white"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Danh sách Nhắc việc cần xử lý */
              <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] p-8 text-center">
                    <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-[var(--text)]">Không có việc cần xử lý</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Tất cả hội viên trong mục này đều ở trạng thái ổn định.
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
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs font-bold text-[var(--text-muted)]">
              <Link
                to="/reminders"
                className="hover:text-[var(--brand-yellow)] transition flex items-center gap-1"
              >
                <span>Xem tất cả danh sách nhắc việc</span>
                <ArrowRight size={12} />
              </Link>
              <Link
                to="/pt-schedule"
                className="hover:text-[var(--brand-yellow)] transition flex items-center gap-1"
              >
                <span>Xem lịch PT</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function CleanNotificationItem({ notification }: { notification: OperationNotification }) {
  const isDebt = notification.type.includes('DEBT')
  const isBirthday = notification.type.includes('BIRTHDAY')
  const isExpired = notification.type.includes('EXPIRED') || notification.type.includes('EXPIRING')

  let destination = '/members'
  let actionLabel = 'Xem'
  let Icon = AlertCircle
  let toneStyles = {
    iconBg: 'bg-blue-500/15 text-blue-400',
    border: 'hover:border-blue-500/40',
  }

  if (isDebt) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/payments'
    actionLabel = 'Thu nợ'
    Icon = CreditCard
    toneStyles = {
      iconBg: 'bg-red-500/15 text-red-400',
      border: 'hover:border-red-500/40',
    }
  } else if (isBirthday) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/reminders'
    actionLabel = 'Chúc mừng'
    Icon = Gift
    toneStyles = {
      iconBg: 'bg-pink-500/15 text-pink-400',
      border: 'hover:border-pink-500/40',
    }
  } else if (isExpired) {
    destination = notification.memberId ? `/members/${notification.memberId}` : '/members'
    actionLabel = 'Gia hạn'
    Icon = CalendarClock
    toneStyles = {
      iconBg: 'bg-amber-500/15 text-amber-400',
      border: 'hover:border-amber-500/40',
    }
  }

  return (
    <Link
      to={destination}
      className={`group flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-muted)] p-3 transition ${toneStyles.border}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneStyles.iconBg}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-strong)] truncate">
              {notification.title}
            </span>
            {notification.dueDate && (
              <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                • {formatDate(notification.dueDate)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {notification.memberName && (
              <span className="font-semibold text-[var(--text)]">
                {notification.memberName}
              </span>
            )}
            {notification.amount != null && notification.amount > 0 && (
              <span className="font-bold text-red-400">
                {formatMoney(notification.amount)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-strong)] transition pl-2">
        <span className="hidden sm:inline">{actionLabel}</span>
        <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
