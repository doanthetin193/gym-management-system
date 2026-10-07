import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Goal,
  KeyRound,
  LineChart,
  Phone,
  Scale,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import { changePassword } from '../../auth/api/authApi'
import { memberStatusLabels, membershipStatusLabels } from '../../members/types/member'
import type { MemberMembership } from '../../members/types/member'
import { paymentMethodLabels } from '../../payments/types/payment'
import type { BodyMeasurement } from '../../pt-schedule/types/pt'
import { getMyMemberPortal } from '../api/memberPortalApi'
import type { MemberPortal } from '../types/memberPortal'

type MeasurementMetric = 'weight' | 'waist' | 'chest' | 'hip'

const gymZaloUrl = 'https://zalo.me/0965193907'

const scheduleStatusLabels: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  MISSED: 'Vắng mặt',
  RESCHEDULED: 'Dời lịch',
}

const goalTypeLabels: Record<string, string> = {
  FAT_LOSS: 'Giảm mỡ',
  MUSCLE_GAIN: 'Tăng cơ',
  STRENGTH: 'Sức mạnh',
  FITNESS: 'Thể lực',
  HEALTH: 'Sức khỏe',
  OTHER: 'Mục tiêu khác',
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function daysUntil(value: string | null | undefined) {
  if (!value) {
    return null
  }
  const today = new Date()
  const target = new Date(`${value}T00:00:00`)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

function latestMembership(activeMemberships: MemberMembership[], membershipHistory: MemberMembership[]) {
  return [...activeMemberships, ...membershipHistory]
    .sort((left, right) => right.endDate.localeCompare(left.endDate))[0] ?? null
}

export function MemberPortalPage() {
  const [portal, setPortal] = useState<MemberPortal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Self change password states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }

    setPasswordSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setIsChangePasswordOpen(false)
        setPasswordSuccess(null)
      }, 2000)
    } catch (err) {
      setPasswordError(err instanceof ApiClientError ? err.message : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadPortal() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMyMemberPortal()
        if (!cancelled) {
          setPortal(data)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof ApiClientError ? caughtError.message : 'Không thể tải hồ sơ hội viên.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPortal()

    return () => {
      cancelled = true
    }
  }, [])

  const memberships = portal ? latestMembership(portal.activeMemberships, portal.membershipHistory) : null
  const daysLeft = daysUntil(memberships?.endDate)
  const activePtPackage = portal?.ptSessionPackages.find((item) => item.status === 'ACTIVE') ?? portal?.ptSessionPackages[0] ?? null
  const latestMeasurement = portal?.bodyMeasurements[0] ?? null
  const previousMeasurement = portal?.bodyMeasurements[1] ?? null
  const activeGoal = portal?.goals.find((goal) => goal.status === 'ACTIVE') ?? portal?.goals[0] ?? null
  const measurementTrend = useMemo(() => [...(portal?.bodyMeasurements ?? [])].reverse().slice(-8), [portal])

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-sm font-bold text-[var(--text-muted)]">
          Đang tải tiến trình cá nhân...
        </div>
      </div>
    )
  }

  if (error || !portal) {
    return (
      <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] p-5 text-sm font-bold text-[var(--danger-text)]">
        {error ?? 'Chưa có hồ sơ hội viên được liên kết với tài khoản này.'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[8px] bg-[#05070d] text-white shadow-[0_20px_70px_rgba(2,6,23,0.22)]">
        <div className="relative p-5 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(8,126,193,0.25),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(223,39,27,0.18),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-[8px] bg-[var(--brand-yellow)] text-3xl font-black text-black">
                {portal.profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-yellow-300">Hồ sơ hội viên</p>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">{portal.profile.fullName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="inline-flex items-center gap-1"><Phone size={15} /> {portal.profile.phone}</span>
                  <span>Ngày sinh: {formatDate(portal.profile.dateOfBirth)}</span>
                  <span>Trạng thái: {memberStatusLabels[portal.profile.status] ?? portal.profile.status}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null)
                  setPasswordSuccess(null)
                  setIsChangePasswordOpen(true)
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                <KeyRound size={16} />
                <span>Đổi mật khẩu</span>
              </button>
              <a
                href={gymZaloUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
              >
                Nhắn Zalo phòng gym
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Dumbbell} label="Gói hiện tại" value={memberships?.planName ?? 'Chưa có gói'} detail={memberships ? `${formatDate(memberships.startDate)} - ${formatDate(memberships.endDate)}` : 'Liên hệ quầy để kích hoạt'} tone="blue" />
        <MetricCard icon={CalendarClock} label="Thời hạn còn lại" value={daysLeft === null ? '-' : daysLeft >= 0 ? `Còn ${daysLeft} ngày` : `Quá hạn ${Math.abs(daysLeft)} ngày`} detail={daysLeft !== null && daysLeft <= 7 ? 'Nên liên hệ gia hạn sớm' : 'Theo dõi hạn gói tập'} tone={daysLeft !== null && daysLeft < 0 ? 'red' : 'yellow'} />
        <MetricCard icon={CreditCard} label="Công nợ" value={formatMoney(portal.totalDebt)} detail={portal.totalDebt > 0 ? 'Cần thanh toán tại quầy hoặc chuyển khoản' : 'Không còn nợ'} tone={portal.totalDebt > 0 ? 'red' : 'green'} />
        <MetricCard icon={Activity} label="Buổi PT còn lại" value={activePtPackage ? `${activePtPackage.remainingPtSessions}/${activePtPackage.totalPtSessions}` : 'Không có'} detail={activePtPackage ? `Ôn tập còn ${activePtPackage.remainingPracticeSessions}/${activePtPackage.totalPracticeSessions}` : 'Chỉ áp dụng khách PT'} tone="green" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Biểu đồ chỉ số cơ thể" icon={LineChart} action={latestMeasurement ? `Cập nhật gần nhất ${formatDate(latestMeasurement.recordedAt)}` : undefined}>
          {measurementTrend.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <MetricLineChart title="Cân nặng" unit="kg" metric="weight" data={measurementTrend} color="#087ec1" />
              <MetricLineChart title="Vòng eo" unit="cm" metric="waist" data={measurementTrend} color="#df271b" />
              <MetricLineChart title="Vòng ngực" unit="cm" metric="chest" data={measurementTrend} color="#facc15" />
              <MetricLineChart title="Vòng mông" unit="cm" metric="hip" data={measurementTrend} color="#10b981" />
            </div>
          ) : (
            <EmptyState text="Chưa có chỉ số cơ thể. Chỉ số sẽ được PT cập nhật khi bạn dùng gói PT." />
          )}
        </Panel>

        <Panel title="Mục tiêu hiện tại" icon={Goal}>
          {activeGoal ? (
            <div className="space-y-4">
              <div className="rounded-[8px] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-black uppercase text-[var(--text-muted)]">{goalTypeLabels[activeGoal.goalType] ?? activeGoal.goalType}</p>
                <p className="mt-2 text-lg font-black text-[var(--text-strong)]">{activeGoal.goalDescription ?? 'Mục tiêu PT cá nhân'}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                  {formatDate(activeGoal.startDate)} - {formatDate(activeGoal.targetDate)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallStat label="Cân nặng mục tiêu" value={activeGoal.targetWeight ? `${activeGoal.targetWeight} kg` : '-'} />
                <SmallStat label="Mỡ mục tiêu" value={activeGoal.targetBodyFat ? `${activeGoal.targetBodyFat}%` : '-'} />
                <SmallStat label="Eo mục tiêu" value={activeGoal.targetWaist ? `${activeGoal.targetWaist} cm` : '-'} />
              </div>
              {latestMeasurement ? (
                <GoalProgressBoard
                  baselineMeasurement={measurementTrend[0] ?? latestMeasurement}
                  latestMeasurement={latestMeasurement}
                  targetWeight={activeGoal.targetWeight}
                  targetWaist={activeGoal.targetWaist}
                />
              ) : null}
            </div>
          ) : (
            <EmptyState text="Chưa có mục tiêu PT được ghi nhận." />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Chỉ số mới nhất" icon={Scale}>
          {latestMeasurement ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <BodyStat label="Cân nặng" value={latestMeasurement.weight} previous={previousMeasurement?.weight ?? null} unit="kg" />
              <BodyStat label="Vòng eo" value={latestMeasurement.waist} previous={previousMeasurement?.waist ?? null} unit="cm" reverse />
              <BodyStat label="Vòng ngực" value={latestMeasurement.chest} previous={previousMeasurement?.chest ?? null} unit="cm" />
              <BodyStat label="Vòng mông" value={latestMeasurement.hip} previous={previousMeasurement?.hip ?? null} unit="cm" />
              <BodyStat label="Vòng đùi" value={latestMeasurement.thigh} previous={previousMeasurement?.thigh ?? null} unit="cm" />
              <BodyStat label="Vòng tay" value={latestMeasurement.arm} previous={previousMeasurement?.arm ?? null} unit="cm" />
            </div>
          ) : (
            <EmptyState text="Chưa có dữ liệu đo." />
          )}
        </Panel>

        <Panel title="Lịch PT sắp tới" icon={CalendarClock}>
          {portal.schedules.length > 0 ? (
            <div className="space-y-3">
              {portal.schedules.slice(0, 5).map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                  <div>
                    <p className="font-black text-[var(--text-strong)]">{formatDate(schedule.scheduleDate)} · {schedule.startTime.slice(0, 5)}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{schedule.ptFullName} · {schedule.note ?? 'Buổi tập PT'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--text-strong)] shadow-sm dark:bg-slate-900">
                    {scheduleStatusLabels[schedule.status] ?? schedule.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Chưa có lịch PT được xếp." />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Lịch sử gói tập" icon={Dumbbell} action={`${portal.activeMemberships.length + portal.membershipHistory.length} gói`}>
          <HistoryList
            rows={[...portal.activeMemberships, ...portal.membershipHistory].map((membership) => ({
              id: membership.id,
              title: membership.planName,
              meta: `${formatDate(membership.startDate)} - ${formatDate(membership.endDate)}`,
              value: formatMoney(membership.actualPrice),
              status: membershipStatusLabels[membership.status] ?? membership.status,
            }))}
            empty="Chưa có lịch sử gói tập."
          />
        </Panel>

        <Panel title="Thanh toán & công nợ" icon={CreditCard}>
          <div className="space-y-4">
            {portal.totalDebt > 0 ? (
              <div className="flex gap-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                Bạn còn {formatMoney(portal.totalDebt)} công nợ. Vui lòng thanh toán tại quầy hoặc chuyển khoản theo hướng dẫn của phòng gym.
              </div>
            ) : null}
            <HistoryList
              rows={portal.payments.slice(0, 6).map((payment) => ({
                id: payment.id,
                title: formatMoney(payment.amount),
                meta: `${formatDate(payment.paymentDate)} · ${paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}`,
                value: payment.note ?? 'Thanh toán',
                status: 'Đã ghi nhận',
              }))}
              empty="Chưa có giao dịch thanh toán."
            />
          </div>
        </Panel>
      </section>

      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-[var(--brand-blue)]">Gia hạn hoặc đăng ký thêm</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--text-strong)]">Gửi yêu cầu qua Zalo, chủ phòng hoặc PT sẽ xác nhận thủ công</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--text-muted)]">
              Tài khoản hội viên chỉ dùng để xem tiến trình cá nhân. Việc kích hoạt gói, đổi gói và xác nhận thanh toán vẫn do chủ phòng hoặc PT xử lý.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[var(--line)] px-4 text-sm font-black text-[var(--text-strong)]">
              Xem bảng giá
            </Link>
            <a href={gymZaloUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[var(--brand-red)] px-4 text-sm font-black text-white">
              Liên hệ Zalo
            </a>
          </div>
        </div>
      </section>

      {/* MODAL ĐỔI MẬT KHẨU TÀI KHOẢN HỌC VIÊN */}
      {isChangePasswordOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-strong)]">Đổi Mật Khẩu Cá Nhân</h3>
                  <p className="text-xs text-[var(--text-muted)]">Cập nhật mật khẩu bảo vệ tài khoản của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-strong)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                {passwordError}
              </div>
            ) : null}

            {passwordSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            ) : null}

            <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Mật khẩu hiện tại <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Xác nhận lại mật khẩu mới <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="h-10 rounded-xl bg-[var(--brand-yellow)] px-5 text-xs font-black text-black hover:brightness-95 disabled:opacity-50"
                >
                  {passwordSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: 'blue' | 'green' | 'yellow' | 'red' }) {
  const toneClass = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-200',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-200',
    yellow: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-200',
    red: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-200',
  }[tone]

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
      <div className={`inline-flex size-11 items-center justify-center rounded-[8px] ${toneClass}`}>
        <Icon size={21} />
      </div>
      <p className="mt-4 text-xs font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-black text-[var(--text-strong)]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: LucideIcon; action?: string; children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-[8px] bg-blue-50 text-[var(--brand-blue)] dark:bg-blue-950/30">
            <Icon size={21} />
          </div>
          <h2 className="text-lg font-black text-[var(--text-strong)]">{title}</h2>
        </div>
        {action ? <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--text-muted)]">{action}</span> : null}
      </div>
      {children}
    </div>
  )
}

function MetricLineChart({ title, unit, metric, data, color }: { title: string; unit: string; metric: MeasurementMetric; data: BodyMeasurement[]; color: string }) {
  const points = data.filter((item) => item[metric] !== null)
  const values = points.map((item) => item[metric] as number)

  if (values.length === 0) {
    return <EmptyState text={`${title} chưa có dữ liệu.`} />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const polyline = points.map((item, index) => {
    const x = values.length === 1 ? 160 : 28 + (index * 264) / (values.length - 1)
    const y = 128 - (((item[metric] as number) - min) / range) * 92
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-[var(--text-strong)]">{title}</p>
        <p className="text-sm font-black" style={{ color }}>{values.at(-1)} {unit}</p>
      </div>
      <svg viewBox="0 0 320 150" className="mt-3 h-40 w-full overflow-visible">
        <line x1="28" y1="128" x2="292" y2="128" stroke="currentColor" className="text-[var(--line)]" strokeWidth="2" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((item, index) => {
          const x = values.length === 1 ? 160 : 28 + (index * 264) / (values.length - 1)
          const y = 128 - (((item[metric] as number) - min) / range) * 92
          return <circle key={`${item.id}-${metric}`} cx={x} cy={y} r="5" fill={color} />
        })}
      </svg>
    </div>
  )
}

function BodyStat({ label, value, previous, unit, reverse = false }: { label: string; value: number | null; previous: number | null; unit: string; reverse?: boolean }) {
  const diff = value !== null && previous !== null ? value - previous : null
  const good = diff === null ? null : reverse ? diff <= 0 : diff >= 0

  return (
    <div className="rounded-[8px] bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--text-strong)]">{value ?? '-'} {value !== null ? unit : ''}</p>
      {diff !== null ? (
        <p className={`mt-1 text-sm font-black ${good ? 'text-emerald-600' : 'text-red-600'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)} {unit} so với lần trước
        </p>
      ) : (
        <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">Chưa đủ dữ liệu so sánh</p>
      )}
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
      <p className="text-xs font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-black text-[var(--text-strong)]">{value}</p>
    </div>
  )
}

function GoalProgressBoard({
  baselineMeasurement,
  latestMeasurement,
  targetWeight,
  targetWaist,
}: {
  baselineMeasurement: BodyMeasurement
  latestMeasurement: BodyMeasurement
  targetWeight: number | null
  targetWaist: number | null
}) {
  const rows = [
    {
      label: 'Tiến độ cân nặng',
      start: baselineMeasurement.weight,
      current: latestMeasurement.weight,
      target: targetWeight,
      unit: 'kg',
      lowerIsBetter: true,
      colorClass: 'bg-[var(--brand-blue)]',
    },
    {
      label: 'Tiến độ vòng eo',
      start: baselineMeasurement.waist,
      current: latestMeasurement.waist,
      target: targetWaist,
      unit: 'cm',
      lowerIsBetter: true,
      colorClass: 'bg-[var(--brand-red)]',
    },
  ].filter((row) => row.start !== null && row.current !== null && row.target !== null)

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="mb-3">
        <p className="text-sm font-black text-[var(--text-strong)]">Tiến độ so với mục tiêu</p>
        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
          Tính từ lần đo đầu trong chuỗi hiện tại đến chỉ số mới nhất.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <GoalProgressBar
            key={row.label}
            label={row.label}
            start={row.start as number}
            current={row.current as number}
            target={row.target as number}
            unit={row.unit}
            lowerIsBetter={row.lowerIsBetter}
            colorClass={row.colorClass}
          />
        ))}
      </div>
    </div>
  )
}

function GoalProgressBar({
  label,
  start,
  current,
  target,
  unit,
  lowerIsBetter,
  colorClass,
}: {
  label: string
  start: number
  current: number
  target: number
  unit: string
  lowerIsBetter: boolean
  colorClass: string
}) {
  const totalChangeNeeded = Math.abs(start - target)
  const changed = lowerIsBetter ? start - current : current - start
  const rawProgress = totalChangeNeeded === 0 ? 0 : (changed / totalChangeNeeded) * 100
  const progress = Math.max(0, Math.min(100, rawProgress))
  const remaining = lowerIsBetter ? current - target : target - current
  const achieved = lowerIsBetter ? current <= target : current >= target

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--text-strong)]">{label}</p>
          <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
            Bắt đầu {start} {unit} · Hiện tại {current} {unit} · Mục tiêu {target} {unit}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-[var(--text-strong)]">{Math.round(progress)}%</p>
          <p className={`text-xs font-black ${achieved ? 'text-emerald-600' : 'text-amber-600'}`}>
            {achieved ? 'Đã đạt' : `Còn ${Math.max(0, remaining).toFixed(1)} ${unit}`}
          </p>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner dark:bg-slate-900">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function HistoryList({ rows, empty }: { rows: Array<{ id: number; title: string; meta: string; value: string; status: string }>; empty: string }) {
  if (rows.length === 0) {
    return <EmptyState text={empty} />
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
          <div className="min-w-0">
            <p className="truncate font-black text-[var(--text-strong)]">{row.title}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{row.meta}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-[var(--text-strong)]">{row.value}</p>
            <p className="mt-1 text-xs font-black text-[var(--brand-blue)]">{row.status}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-5 text-center text-sm font-semibold text-[var(--text-muted)]">
      {text}
    </div>
  )
}
