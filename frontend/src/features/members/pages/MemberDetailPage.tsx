import { ArrowLeft, CreditCard, Dumbbell, KeyRound, Lock, MessageCircle, Pencil, Phone, RefreshCcw, Unlock, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import { buildZaloUrl } from '../../../shared/lib/zalo'
import { listMembershipPlans } from '../../membership-plans/api/planApi'
import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'
import { createPayment, listDebts, listPayments } from '../../payments/api/paymentApi'
import { PaymentFormModal } from '../../payments/components/PaymentFormModal'
import { paymentMethodLabels, revenueCategoryLabels } from '../../payments/types/payment'
import type { DebtRecord, PaymentPayload, PaymentTransaction } from '../../payments/types/payment'
import { getVietQrSetting } from '../../settings/api/settingsApi'
import { buildTransferContent, buildVietQrImageUrl } from '../../settings/lib/vietQr'
import type { VietQrSetting } from '../../settings/types/settings'
import {
  createMemberMembership,
  createPortalAccount,
  deletePortalAccount,
  getMemberDetail,
  resetPortalAccountPassword,
  updateMember,
  updatePortalAccountStatus,
} from '../api/memberApi'
import { MemberFormModal } from '../components/MemberFormModal'
import { MembershipAssignmentModal } from '../components/MembershipAssignmentModal'
import type { MembershipAssignmentSubmitPayload } from '../components/MembershipAssignmentModal'
import { memberSourceLabels, membershipStatusLabels, sessionPackageStatusLabels } from '../types/member'
import type { MemberDetail, MemberMembership, MemberPayload } from '../types/member'

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$'
  const bytes = new Uint32Array(10)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => chars[value % chars.length]).join('')
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

function daysLeftLabel(detail: MemberDetail) {
  const active = detail.activeMemberships[0]
  if (!active) {
    return 'Chưa có gói'
  }
  const diff = Math.ceil((new Date(`${active.endDate}T00:00:00`).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) {
    return `Quá hạn ${Math.abs(diff)} ngày`
  }
  if (diff === 0) {
    return 'Hết hạn hôm nay'
  }
  return `Còn ${diff} ngày`
}

export function MemberDetailPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const parsedMemberId = Number(memberId)
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [membershipModalOpen, setMembershipModalOpen] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [membershipSubmitting, setMembershipSubmitting] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [vietQrSetting, setVietQrSetting] = useState<VietQrSetting | null>(null)
  const [portalModalOpen, setPortalModalOpen] = useState<'create' | 'reset-password' | null>(null)
  const [portalPassword, setPortalPassword] = useState(generateTemporaryPassword)
  const [portalSubmitting, setPortalSubmitting] = useState(false)
  const [portalActionMessage, setPortalActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const openDebts = useMemo(
    () => debts.filter((debt) => debt.status === 'OPEN' || debt.status === 'PARTIALLY_PAID'),
    [debts],
  )

  const allMemberships = useMemo(() => {
    if (!detail) return []
    const map = new Map<number, MemberMembership>()
    for (const m of detail.activeMemberships ?? []) {
      map.set(m.id, m)
    }
    for (const m of detail.membershipHistory ?? []) {
      map.set(m.id, m)
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime()
    )
  }, [detail])

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(parsedMemberId)) {
      setError('Mã hội viên không hợp lệ.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [detailData, debtData, paymentData, vietQrData] = await Promise.all([
        getMemberDetail(parsedMemberId),
        listDebts({ memberId: parsedMemberId }),
        listPayments({ memberId: parsedMemberId }),
        getVietQrSetting().catch(() => null),
      ])
      setDetail(detailData)
      setDebts(debtData)
      setPayments(paymentData)
      setVietQrSetting(vietQrData)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [parsedMemberId])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void loadDetail()
  }, [loadDetail])

  async function openMembershipModal() {
    setMembershipError(null)
    try {
      if (plans.length === 0) {
        setPlans(await listMembershipPlans())
      }
      setMembershipModalOpen(true)
    } catch (caughtError) {
      setMembershipError(errorMessage(caughtError))
    }
  }

  async function handleUpdateMember(payload: MemberPayload) {
    if (!detail) {
      return
    }

    setEditSubmitting(true)
    setEditError(null)
    try {
      await updateMember(detail.profile.id, payload)
      setEditOpen(false)
      await loadDetail()
    } catch (caughtError) {
      setEditError(errorMessage(caughtError))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleCreateMembership(payload: MembershipAssignmentSubmitPayload) {
    if (!detail) {
      return
    }

    setMembershipSubmitting(true)
    setMembershipError(null)
    try {
      await createMemberMembership(detail.profile.id, {
        ...payload.membership,
        initialPaidAmount: payload.paidAmount,
        initialPaymentMethod: payload.paidAmount > 0 ? payload.paymentMethod : null,
        initialPaymentDate: payload.membership.startDate,
        initialPaymentNote: payload.membership.note,
      })
      setMembershipModalOpen(false)
      await loadDetail()
    } catch (caughtError) {
      setMembershipError(errorMessage(caughtError))
    } finally {
      setMembershipSubmitting(false)
    }
  }

  async function handleCreatePayment(payload: PaymentPayload) {
    setPaymentSubmitting(true)
    setPaymentError(null)
    try {
      await createPayment(payload)
      setPaymentModalOpen(false)
      await loadDetail()
    } catch (caughtError) {
      setPaymentError(errorMessage(caughtError))
    } finally {
      setPaymentSubmitting(false)
    }
  }

  async function handleCreatePortal() {
    if (!detail) return
    setPortalSubmitting(true)
    setPortalActionMessage(null)
    try {
      const updated = await createPortalAccount(detail.profile.id, portalPassword)
      setDetail(updated)
      setPortalModalOpen(null)
      setPortalActionMessage({
        text: 'Đã cấp tài khoản Portal thành công! Học viên có thể đăng nhập bằng Số điện thoại.',
        type: 'success',
      })
      setTimeout(() => setPortalActionMessage(null), 5000)
    } catch (err) {
      setPortalActionMessage({ text: errorMessage(err), type: 'error' })
    } finally {
      setPortalSubmitting(false)
    }
  }

  async function handleTogglePortalStatus(status: 'ACTIVE' | 'LOCKED') {
    if (!detail) return
    const confirmText =
      status === 'LOCKED'
        ? 'Bạn có chắc muốn TẮT QUYỀN ĐĂNG NHẬP của học viên này? Khách không thể vào app nữa, nhưng hồ sơ, hóa đơn tiền, số đo cũ vẫn được bảo lưu 100%!'
        : 'KÍCH HOẠT LẠI quyền đăng nhập cho học viên này?'
    if (!window.confirm(confirmText)) return

    setPortalSubmitting(true)
    setPortalActionMessage(null)
    try {
      const updated = await updatePortalAccountStatus(detail.profile.id, status)
      setDetail(updated)
      setPortalActionMessage({
        text: status === 'ACTIVE' ? 'Đã kích hoạt lại quyền đăng nhập!' : 'Đã tắt quyền đăng nhập thành công!',
        type: 'success',
      })
      setTimeout(() => setPortalActionMessage(null), 4000)
    } catch (err) {
      setPortalActionMessage({ text: errorMessage(err), type: 'error' })
    } finally {
      setPortalSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (!detail) return
    setPortalSubmitting(true)
    setPortalActionMessage(null)
    try {
      const updated = await resetPortalAccountPassword(detail.profile.id, portalPassword)
      setDetail(updated)
      setPortalModalOpen(null)
      setPortalActionMessage({
        text: `Đã đổi mật khẩu mới cho học viên thành công: "${portalPassword}"`,
        type: 'success',
      })
      setTimeout(() => setPortalActionMessage(null), 5000)
    } catch (err) {
      setPortalActionMessage({ text: errorMessage(err), type: 'error' })
    } finally {
      setPortalSubmitting(false)
    }
  }

  async function handleDeletePortal() {
    if (!detail) return
    if (
      !window.confirm(
        'Xóa tài khoản đăng nhập của học viên này? (Dữ liệu hồ sơ hội viên, hóa đơn tiền, số đo cũ của khách vẫn nằm nguyên trong hệ thống)',
      )
    ) {
      return
    }
    setPortalSubmitting(true)
    setPortalActionMessage(null)
    try {
      const updated = await deletePortalAccount(detail.profile.id)
      setDetail(updated)
      setPortalActionMessage({ text: 'Đã xóa tài khoản đăng nhập Portal.', type: 'success' })
      setTimeout(() => setPortalActionMessage(null), 4000)
    } catch (err) {
      setPortalActionMessage({ text: errorMessage(err), type: 'error' })
    } finally {
      setPortalSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 text-sm font-semibold text-[var(--text-muted)]">
        Đang tải hồ sơ hội viên...
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Link to="/members" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]">
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>
        <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger-text)]">
          {error ?? 'Không tìm thấy hội viên.'}
        </div>
      </div>
    )
  }

  const currentMembership = detail.activeMemberships?.[0] ?? null
  const latestMembership = detail.membershipHistory?.[0] ?? currentMembership
  const zaloUrl = buildZaloUrl(detail.profile.zaloPhone ?? detail.profile.phone)

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách hội viên
        </button>
        <button
          type="button"
          onClick={() => void loadDetail()}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-sm font-bold text-[var(--text)]"
        >
          <RefreshCcw size={16} />
          Tải lại
        </button>
      </div>

      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-[8px] bg-metric-blue text-2xl font-black text-[var(--brand-blue)]">
              {(detail.profile?.fullName || 'H').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-[var(--text-strong)]">{detail.profile?.fullName || 'Hội viên'}</h1>
                <span className="rounded-full bg-metric-green px-2.5 py-1 text-xs font-black">Đang theo dõi</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-muted)]">
                <span>{detail.profile.phone || '-'}</span>
                <span>Zalo: {detail.profile.zaloPhone ?? detail.profile.phone ?? '-'}</span>
                <span>Sinh: {formatDate(detail.profile.dateOfBirth)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {zaloUrl ? (
              <a
                href={zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-blue-600 px-3 text-sm font-black text-white transition hover:brightness-95"
              >
                <MessageCircle size={16} />
                Nhắn tin Zalo
              </a>
            ) : null}
            <a
              href={`tel:${detail.profile.phone}`}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-sm font-bold text-[var(--text)]"
            >
              <Phone size={16} />
              Gọi điện
            </a>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-sm font-bold text-[var(--text)]"
            >
              <Pencil size={16} />
              Sửa thông tin
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="Gói hiện tại" value={currentMembership?.planName ?? 'Chưa có gói'} />
          <Metric label="Ngày hết hạn" value={formatDate(currentMembership?.endDate)} />
          <Metric label="Thời hạn còn lại" value={daysLeftLabel(detail)} tone={currentMembership ? 'success' : 'muted'} />
          <Metric label="Công nợ học phí" value={formatMoney(detail.totalDebt)} tone={detail.totalDebt > 0 ? 'danger' : 'success'} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.75fr]">
        <div className="space-y-5">
          <HistoryCard title="Lịch sử đăng ký gói tập" count={`${allMemberships.length} gói`}>
            <MembershipRows memberships={allMemberships} />
          </HistoryCard>

          <HistoryCard title="Lịch sử thu tiền & giao dịch" count={`${payments.length} giao dịch`}>
            {payments.length === 0 ? (
              <EmptyText>Chưa có giao dịch thanh toán.</EmptyText>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-1 rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-[var(--success)]">+{formatMoney(payment.amount)}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                        {formatDate(payment.paymentDate)} · {payment.note ?? (revenueCategoryLabels[payment.revenueCategory] ?? payment.revenueCategory)}
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-400">
                      {paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </HistoryCard>

          <HistoryCard title="Gói buổi PT" count={`${detail.ptSessionPackages.length} gói`}>
            {detail.ptSessionPackages.length === 0 ? (
              <EmptyText>Chưa có gói buổi PT.</EmptyText>
            ) : (
              <div className="space-y-2">
                {detail.ptSessionPackages.map((item) => (
                  <div key={item.id} className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                    <p className="font-bold text-[var(--text-strong)]">
                      PT còn {item.remainingPtSessions}/{item.totalPtSessions} buổi, ôn tập còn {item.remainingPracticeSessions}/{item.totalPracticeSessions}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                      <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                      <span>·</span>
                      <span className={item.status === 'ACTIVE' ? 'font-bold text-emerald-400' : 'font-bold text-[var(--text-muted)]'}>
                        {sessionPackageStatusLabels[item.status] ?? item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HistoryCard>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void openMembershipModal()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95"
              >
                <Dumbbell size={17} />
                Đăng ký / Gia hạn gói
              </button>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                disabled={openDebts.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-red)] px-4 text-sm font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CreditCard size={17} />
                Thu nợ / Nộp tiền
              </button>
            </div>

            <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Tình trạng thanh toán</p>
              <p className={['mt-1 text-lg font-black', detail.totalDebt > 0 ? 'text-[var(--brand-red)]' : 'text-[var(--success)]'].join(' ')}>
                {detail.totalDebt > 0 ? `Còn nợ ${formatMoney(detail.totalDebt)}` : 'Không còn nợ'}
              </p>
            </div>

            <MemberVietQrCard
              setting={vietQrSetting}
              memberName={detail.profile.fullName}
              debt={openDebts[0] ?? null}
              totalDebt={detail.totalDebt}
              onCollect={() => setPaymentModalOpen(true)}
            />

            <div className="mt-4 grid gap-3">
              <Info label="Nguồn khách" value={detail.profile.source ? (memberSourceLabels[detail.profile.source] ?? detail.profile.source) : '-'} />
              <Info label="Gói gần nhất" value={latestMembership?.planName ?? '-'} />
              <Info label="Đã thu gói gần nhất" value={formatMoney(latestMembership?.paidAmount)} />
            </div>
          </div>

          {/* QUẢN LÝ QUYỀN PORTAL HỌC VIÊN PT */}
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-[6px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
                    Tài khoản Portal Học Viên
                  </h3>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Theo dõi lịch tập & chỉ số PT
                  </p>
                </div>
              </div>

              {detail.profile.userId ? (
                detail.profile.userStatus === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang mở
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-black text-red-400">
                    <Lock size={10} />
                    Đã tắt quyền
                  </span>
                )
              ) : (
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-muted)]">
                  Chưa cấp
                </span>
              )}
            </div>

            {portalActionMessage ? (
              <div
                className={`rounded-[6px] p-2 text-xs font-bold ${
                  portalActionMessage.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {portalActionMessage.text}
              </div>
            ) : null}

            {!detail.profile.userId ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                  Hội viên chưa có tài khoản. Chỉ cấp khi khách mua gói tập PT để xem số đo và lịch hẹn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPortalPassword(generateTemporaryPassword())
                    setPortalModalOpen('create')
                  }}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] bg-[var(--brand-yellow)] px-3 text-xs font-black text-black hover:brightness-95 transition"
                >
                  <KeyRound size={14} />
                  + Cấp tài khoản Portal
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="rounded-[6px] bg-[var(--surface-muted)] p-2.5 text-xs space-y-1 border border-[var(--line)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Tài khoản đăng nhập:</span>
                    <span className="font-bold text-[var(--text-strong)]">{detail.profile.phone}</span>
                  </div>
                  {detail.profile.userEmail ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Email hệ thống:</span>
                      <span className="text-[var(--text-muted)] truncate max-w-[170px]">{detail.profile.userEmail}</span>
                    </div>
                  ) : null}
                </div>

                {detail.profile.userStatus === 'ACTIVE' ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={portalSubmitting}
                      onClick={() => void handleTogglePortalStatus('LOCKED')}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-black text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                    >
                      <Lock size={13} />
                      Tắt / Hủy quyền đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalPassword(generateTemporaryPassword())
                        setPortalModalOpen('reset-password')
                      }}
                      className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition"
                    >
                      <RefreshCcw size={12} />
                      Đổi / Đặt lại mật khẩu giúp khách
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[11px] text-amber-400/90 font-medium bg-amber-500/5 border border-amber-500/20 rounded-[6px] p-2 leading-relaxed">
                      Tài khoản đang tạm khóa. Dữ liệu tập, số đo và hóa đơn vẫn bảo lưu 100%. Bấm kích hoạt lại khi khách tiếp tục tập.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={portalSubmitting}
                        onClick={() => void handleTogglePortalStatus('ACTIVE')}
                        className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-500 transition disabled:opacity-50"
                      >
                        <Unlock size={13} />
                        Kích hoạt lại
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortalPassword(generateTemporaryPassword())
                          setPortalModalOpen('reset-password')
                        }}
                        className="inline-flex h-8.5 items-center justify-center gap-1 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface)] transition"
                      >
                        Đổi MK
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={portalSubmitting}
                      onClick={() => void handleDeletePortal()}
                      className="text-[11px] text-red-400/80 hover:text-red-300 transition text-center pt-1"
                    >
                      Xóa tài khoản đăng nhập này
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {detail.profile.note ? (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Ghi chú</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text)]">{detail.profile.note}</p>
            </div>
          ) : null}

          {membershipError && !membershipModalOpen ? (
            <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
              {membershipError}
            </div>
          ) : null}
        </aside>
      </section>

      {editOpen ? (
        <MemberFormModal
          mode="edit"
          member={detail.profile}
          submitting={editSubmitting}
          error={editError}
          onClose={() => {
            setEditOpen(false)
            setEditError(null)
          }}
          onSubmit={handleUpdateMember}
        />
      ) : null}

      {membershipModalOpen ? (
        <MembershipAssignmentModal
          memberName={detail.profile.fullName}
          plans={plans}
          submitting={membershipSubmitting}
          error={membershipError}
          onClose={() => {
            setMembershipModalOpen(false)
            setMembershipError(null)
          }}
          onSubmit={handleCreateMembership}
        />
      ) : null}

      {paymentModalOpen ? (
        <PaymentFormModal
          debts={openDebts}
          selectedDebt={openDebts[0] ?? null}
          submitting={paymentSubmitting}
          error={paymentError}
          vietQrSetting={vietQrSetting}
          onClose={() => {
            setPaymentModalOpen(false)
            setPaymentError(null)
          }}
          onSubmit={handleCreatePayment}
        />
      ) : null}

      {portalModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-strong)]">
                    {portalModalOpen === 'create' ? 'Cấp tài khoản Portal Học Viên' : 'Đặt lại mật khẩu cho Học Viên'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {detail?.profile.fullName} ({detail?.profile.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPortalModalOpen(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-strong)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-[var(--surface-muted)] p-3 text-xs space-y-1.5 border border-[var(--line)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Tài khoản đăng nhập:</span>
                  <span className="font-bold text-[var(--text-strong)]">{detail?.profile.phone}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Khách hàng có thể đăng nhập bằng Số điện thoại này tại trang Đăng nhập.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--text-strong)]">
                    Mật khẩu {portalModalOpen === 'create' ? 'khởi tạo' : 'mới'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPortalPassword(generateTemporaryPassword())}
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Tạo số ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400"
                />
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Hệ thống tạo mật khẩu tạm ngẫu nhiên. Sau khi vào app, học viên có thể tự đổi mật khẩu.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setPortalModalOpen(null)}
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={portalSubmitting || !portalPassword.trim()}
                onClick={() => {
                  if (portalModalOpen === 'create') {
                    void handleCreatePortal()
                  } else {
                    void handleResetPassword()
                  }
                }}
                className="h-10 rounded-xl bg-[var(--brand-yellow)] px-5 text-xs font-black text-black hover:brightness-95 disabled:opacity-50"
              >
                {portalSubmitting ? 'Đang lưu...' : portalModalOpen === 'create' ? 'Xác nhận cấp tài khoản' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'danger' | 'muted' }) {
  const toneClass = {
    default: 'text-[var(--text-strong)]',
    success: 'text-[var(--success)]',
    danger: 'text-[var(--brand-red)]',
    muted: 'text-[var(--text-muted)]',
  }[tone]

  return (
    <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 text-sm font-black ${toneClass}`}>{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--text-strong)]">{value}</p>
    </div>
  )
}

function MemberVietQrCard({
  setting,
  memberName,
  debt,
  totalDebt,
  onCollect,
}: {
  setting: VietQrSetting | null
  memberName: string
  debt: DebtRecord | null
  totalDebt: number
  onCollect: () => void
}) {
  if (!setting?.enabled || totalDebt <= 0) {
    return null
  }

  const amount = debt?.remainingAmount ?? totalDebt
  const transferContent = buildTransferContent(setting, memberName, debt?.id ?? null)
  const imageUrl = buildVietQrImageUrl({ setting, amount, addInfo: transferContent })

  return (
    <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">VietQR công nợ</p>
          <p className="mt-1 text-sm font-black text-[var(--text-strong)]">{formatMoney(amount)}</p>
        </div>
        <button
          type="button"
          onClick={onCollect}
          className="h-9 rounded-[8px] bg-[var(--brand-yellow)] px-3 text-xs font-black text-black"
        >
          Thu khoản này
        </button>
      </div>

      {imageUrl ? (
        <button
          type="button"
          onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
          className="mt-3 grid w-full place-items-center rounded-[8px] bg-white p-2 transition hover:brightness-95"
        >
          <img src={imageUrl} alt="Mã VietQR công nợ hội viên" className="h-36 w-36 object-contain" />
        </button>
      ) : null}

      <p className="mt-2 truncate text-xs font-semibold text-[var(--text-muted)]">{transferContent}</p>
    </div>
  )
}

function HistoryCard({ title, count, children }: { title: string; count: string; children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-[8px] bg-metric-blue">
            <UserRound size={18} />
          </span>
          <div>
            <h3 className="font-black text-[var(--text-strong)]">{title}</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Toàn bộ dữ liệu liên quan đến hội viên này.</p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--text)]">{count}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function MembershipRows({ memberships }: { memberships: MemberMembership[] }) {
  if (memberships.length === 0) {
    return <EmptyText>Chưa có lịch sử đăng ký gói.</EmptyText>
  }

  return (
    <div className="space-y-2">
      {memberships.map((membership) => (
        <div key={membership.id} className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-black text-[var(--text-strong)]">{membership.planName}</p>
            <p className="font-black text-[var(--text-strong)]">{formatMoney(membership.actualPrice)}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--text-muted)]">
            <span>{formatDate(membership.startDate)} - {formatDate(membership.endDate)}</span>
            <span>Đã thu {formatMoney(membership.paidAmount)}</span>
            <span>
              Nợ {formatMoney(membership.debtAmount)} ·{' '}
              <span className={membership.status === 'ACTIVE' ? 'font-bold text-emerald-400' : 'font-bold text-[var(--text-muted)]'}>
                {membershipStatusLabels[membership.status] ?? membership.status}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
      {children}
    </p>
  )
}
