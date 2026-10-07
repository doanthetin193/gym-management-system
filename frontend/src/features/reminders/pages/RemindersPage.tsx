import {
  AlertTriangle,
  Cake,
  Check,
  ClipboardCopy,
  Clock,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { copyText, buildZaloUrl } from '../../../shared/lib/zalo'
import { getMemberDetail, listMembers } from '../../members/api/memberApi'
import type { MemberDetail, MemberSummary } from '../../members/types/member'
import { listDebts } from '../../payments/api/paymentApi'
import type { DebtRecord } from '../../payments/types/payment'

type ReminderType = 'expiring' | 'expired' | 'debt' | 'birthday'

type ReminderItem = {
  id: string
  type: ReminderType
  memberId: number
  memberName: string
  phone: string
  zaloPhone: string
  detail: string
  planName?: string | null
  statusLabel: string
  statusTone: 'yellow' | 'red' | 'purple' | 'pink'
  message: string
  sortDate: string
}

interface ReminderTabConfig {
  type: ReminderType
  label: string
  icon: LucideIcon
  tone: 'amber' | 'red' | 'purple' | 'pink'
  description: string
}

const REMINDER_TABS: ReminderTabConfig[] = [
  {
    type: 'expiring',
    label: 'Sắp hết hạn',
    icon: Clock,
    tone: 'amber',
    description: 'Gói còn hạn dưới 7 ngày',
  },
  {
    type: 'expired',
    label: 'Đã hết hạn',
    icon: AlertTriangle,
    tone: 'red',
    description: 'Cần mời hội viên gia hạn lại',
  },
  {
    type: 'debt',
    label: 'Còn nợ học phí',
    icon: CreditCard,
    tone: 'purple',
    description: 'Khoản thu chưa thanh toán đủ',
  },
  {
    type: 'birthday',
    label: 'Sinh nhật 7 ngày tới',
    icon: Cake,
    tone: 'pink',
    description: 'Chăm sóc tri ân khách hàng',
  },
]

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(fromIso: string, toIso: string) {
  const from = new Date(`${fromIso}T00:00:00`).getTime()
  const to = new Date(`${toIso}T00:00:00`).getTime()
  return Math.ceil((to - from) / 86_400_000)
}

function nextBirthdayIso(dateOfBirth: string) {
  const today = new Date()
  const birthday = new Date(`${dateOfBirth}T00:00:00`)
  let next = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (next < todayStart) {
    next = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate())
  }

  return next.toISOString().slice(0, 10)
}

function memberContact(detail: MemberDetail | undefined, summary: MemberSummary) {
  return {
    phone: detail?.profile.phone ?? summary.phone,
    zaloPhone: detail?.profile.zaloPhone ?? detail?.profile.phone ?? summary.phone,
  }
}

function buildReminderItems(members: MemberSummary[], details: Map<number, MemberDetail>, debts: DebtRecord[]) {
  const today = todayIso()
  const items: ReminderItem[] = []

  for (const member of members) {
    const detail = details.get(member.id)
    const contact = memberContact(detail, member)
    const planName = member.currentPlanName ?? 'gói tập'

    if (member.endDate) {
      const daysLeft = daysBetween(today, member.endDate)
      if (daysLeft >= 0 && daysLeft <= 7) {
        items.push({
          id: `expiring-${member.id}-${member.endDate}`,
          type: 'expiring',
          memberId: member.id,
          memberName: member.fullName,
          phone: contact.phone,
          zaloPhone: contact.zaloPhone,
          planName,
          detail: `${planName} • hết hạn ${formatDate(member.endDate)}`,
          statusLabel: daysLeft === 0 ? 'Hôm nay hết hạn' : `Còn ${daysLeft} ngày`,
          statusTone: 'yellow',
          sortDate: member.endDate,
          message: `Chào anh/chị ${member.fullName}, gói tập ${planName} của mình tại GYM DUONG DOUBLE sẽ hết hạn vào ngày ${formatDate(member.endDate)}. Anh/chị có thể gia hạn sớm để duy trì lịch tập ổn định nhé.`,
        })
      } else if (daysLeft < 0) {
        items.push({
          id: `expired-${member.id}-${member.endDate}`,
          type: 'expired',
          memberId: member.id,
          memberName: member.fullName,
          phone: contact.phone,
          zaloPhone: contact.zaloPhone,
          planName,
          detail: `${planName} • đã hết hạn ${formatDate(member.endDate)}`,
          statusLabel: `Quá hạn ${Math.abs(daysLeft)} ngày`,
          statusTone: 'red',
          sortDate: member.endDate,
          message: `Chào anh/chị ${member.fullName}, gói tập ${planName} của mình tại GYM DUONG DOUBLE đã hết hạn từ ngày ${formatDate(member.endDate)}. Anh/chị có thể gia hạn lại bất cứ lúc nào để tiếp tục lịch tập ổn định nhé.`,
        })
      }
    }

    const dateOfBirth = detail?.profile.dateOfBirth ?? member.dateOfBirth
    if (dateOfBirth) {
      const nextBirthday = nextBirthdayIso(dateOfBirth)
      const daysUntilBirthday = daysBetween(today, nextBirthday)
      if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
        items.push({
          id: `birthday-${member.id}-${nextBirthday}`,
          type: 'birthday',
          memberId: member.id,
          memberName: member.fullName,
          phone: contact.phone,
          zaloPhone: contact.zaloPhone,
          planName,
          detail: `Sinh nhật ngày ${formatDate(nextBirthday)}`,
          statusLabel: daysUntilBirthday === 0 ? '🎂 Sinh nhật hôm nay' : `Còn ${daysUntilBirthday} ngày`,
          statusTone: 'pink',
          sortDate: nextBirthday,
          message: `GYM DUONG DOUBLE chúc mừng sinh nhật anh/chị ${member.fullName}! Chúc anh/chị luôn tràn đầy năng lượng, sức khỏe dồi dào, tập luyện vui vẻ và chinh phục vóc dáng mục tiêu của mình nhé.`,
        })
      }
    }
  }

  for (const debt of debts) {
    if (debt.status !== 'OPEN' && debt.status !== 'PARTIALLY_PAID') {
      continue
    }

    const detail = details.get(debt.memberId)
    const contact = {
      phone: detail?.profile.phone ?? debt.memberPhone,
      zaloPhone: detail?.profile.zaloPhone ?? detail?.profile.phone ?? debt.memberPhone,
    }

    items.push({
      id: `debt-${debt.id}`,
      type: 'debt',
      memberId: debt.memberId,
      memberName: debt.memberName,
      phone: contact.phone,
      zaloPhone: contact.zaloPhone,
      planName: debt.planName,
      detail: `${debt.planName ?? 'Khoản thu'} • nợ ${formatMoney(debt.remainingAmount)}`,
      statusLabel: `Còn nợ ${formatMoney(debt.remainingAmount)}`,
      statusTone: 'purple',
      sortDate: debt.dueDate ?? today,
      message: `Chào anh/chị ${debt.memberName}, hiện gói ${debt.planName ?? 'tập'} tại GYM DUONG DOUBLE còn khoản cần thanh toán là ${formatMoney(debt.remainingAmount)}. Anh/chị sắp xếp thanh toán giúp phòng để hệ thống cập nhật đầy đủ nhé.`,
    })
  }

  return items.sort((a, b) => a.sortDate.localeCompare(b.sortDate))
}

export function RemindersPage() {
  const params = useParams()
  const navigate = useNavigate()
  const routeType = REMINDER_TABS.some((tab) => tab.type === params.type)
    ? (params.type as ReminderType)
    : 'expiring'

  const [items, setItems] = useState<ReminderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [memberList, debtList] = await Promise.all([listMembers(), listDebts()])
      const detailList = await Promise.all(memberList.map((member) => getMemberDetail(member.id)))
      const detailMap = new Map(detailList.map((detail) => [detail.profile.id, detail]))
      setItems(buildReminderItems(memberList, detailMap, debtList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách nhắc việc.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReminders()
  }, [loadReminders])

  const counts = useMemo(() => {
    return REMINDER_TABS.reduce<Record<ReminderType, number>>(
      (result, tab) => {
        result[tab.type] = items.filter((item) => item.type === tab.type).length
        return result
      },
      { expiring: 0, expired: 0, debt: 0, birthday: 0 },
    )
  }, [items])

  const activeItems = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return items
      .filter((item) => item.type === routeType)
      .filter((item) => {
        if (!normalized) return true
        const nameMatches = item.memberName.toLowerCase().includes(normalized)
        const phoneMatches = item.zaloPhone.includes(normalized) || item.phone.includes(normalized)
        return nameMatches || phoneMatches
      })
  }, [items, routeType, keyword])

  async function copyMessage(item: ReminderItem, openZalo: boolean) {
    await copyText(item.message)
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId(null), 1800)

    if (openZalo) {
      const zaloUrl = buildZaloUrl(item.zaloPhone)
      if (zaloUrl) {
        window.open(zaloUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const currentTab = REMINDER_TABS.find((tab) => tab.type === routeType) ?? REMINDER_TABS[0]

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* 1. Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            Hệ Thống Chăm Sóc Khách Hàng • CRM Zalo Tự Động
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Nhắc Việc & Chăm Sóc Zalo
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            Tự động soạn sẵn tin nhắn gửi Zalo cho khách sắp hết hạn, đã hết hạn, còn nợ và sinh nhật.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--text)] shadow-sm">
            <span className="size-2 rounded-full bg-red-500" />
            Tổng cần xử lý: <strong className="text-red-500 font-black text-sm">{items.length}</strong> việc
          </div>

          <button
            type="button"
            onClick={() => void loadReminders()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface-muted)]"
            title="Làm mới danh sách"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </section>

      {/* 2. Error banner */}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
          {error}
        </div>
      ) : null}

      {/* 3. 4 Categories Filter Tabs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {REMINDER_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = routeType === tab.type
          const count = counts[tab.type]

          const activeBorder = {
            amber: 'border-amber-500/80 bg-gradient-to-br from-amber-500/15 via-[var(--surface)] to-[var(--surface)] ring-1 ring-amber-500/40',
            red: 'border-red-500/80 bg-gradient-to-br from-red-500/15 via-[var(--surface)] to-[var(--surface)] ring-1 ring-red-500/40',
            purple: 'border-purple-500/80 bg-gradient-to-br from-purple-500/15 via-[var(--surface)] to-[var(--surface)] ring-1 ring-purple-500/40',
            pink: 'border-pink-500/80 bg-gradient-to-br from-pink-500/15 via-[var(--surface)] to-[var(--surface)] ring-1 ring-pink-500/40',
          }[tab.tone]

          const iconContainer = {
            amber: 'bg-amber-500/15 text-amber-400',
            red: 'bg-red-500/15 text-red-400',
            purple: 'bg-purple-500/15 text-purple-400',
            pink: 'bg-pink-500/15 text-pink-400',
          }[tab.tone]

          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => navigate(`/reminders/${tab.type}`)}
              className={[
                'group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200',
                isActive
                  ? `${activeBorder} text-[var(--text-strong)] shadow-md`
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-amber-500/40 hover:bg-[var(--surface-muted)]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className={`grid size-9 sm:size-10 place-items-center rounded-xl transition-colors ${iconContainer}`}>
                  <Icon size={18} />
                </span>
                <span
                  className={[
                    'rounded-full px-2.5 py-0.5 text-xs font-black transition-colors',
                    isActive
                      ? 'bg-amber-500 text-black'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:text-[var(--text-strong)]',
                  ].join(' ')}
                >
                  {count} việc
                </span>
              </div>

              <div className="mt-3">
                <p className="text-base font-black tracking-tight text-[var(--text-strong)]">
                  {tab.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
                  {tab.description}
                </p>
              </div>
            </button>
          )
        })}
      </section>

      {/* 4. Controls Toolbar */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[var(--text-strong)]">
            {currentTab.label}
          </span>
          <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
            {activeItems.length} kết quả
          </span>
        </div>

        <div className="relative flex h-10 w-full items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm sm:w-80">
          <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc số Zalo..."
            className="ml-2.5 w-full bg-transparent text-xs font-semibold text-[var(--text-strong)] placeholder:text-[var(--text-muted)] outline-none"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="rounded-md p-1 text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              aria-label="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </section>

      {/* 5. Reminders List */}
      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
            <div className="inline-flex size-10 animate-spin items-center justify-center rounded-full border-2 border-amber-500 border-t-transparent text-amber-500" />
            <p className="mt-3 text-sm font-bold text-[var(--text-muted)]">
              Đang tải danh sách nhắc việc & tin nhắn Zalo...
            </p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Sparkles size={24} />
            </span>
            <h3 className="mt-3 text-base font-black text-[var(--text-strong)]">
              Tuyệt vời, không có khách nào cần xử lý trong mục này!
            </h3>
            <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
              Hệ thống sẽ tự động quét và thông báo khi có khách đến hạn chăm sóc.
            </p>
          </div>
        ) : (
          activeItems.map((item) => (
            <ReminderCard
              key={item.id}
              item={item}
              copied={copiedId === item.id}
              onCopy={() => void copyMessage(item, false)}
              onCopyAndOpen={() => void copyMessage(item, true)}
            />
          ))
        )}
      </section>
    </div>
  )
}

function ReminderCard({
  item,
  copied,
  onCopy,
  onCopyAndOpen,
}: {
  item: ReminderItem
  copied: boolean
  onCopy: () => void
  onCopyAndOpen: () => void
}) {
  const zaloUrl = buildZaloUrl(item.zaloPhone)

  // Status Badge Tone
  const statusBadge = {
    yellow: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
    red: 'border-red-500/30 bg-red-500/15 text-red-400',
    purple: 'border-purple-500/30 bg-purple-500/15 text-purple-300',
    pink: 'border-pink-500/30 bg-pink-500/15 text-pink-300',
  }[item.statusTone]

  // Avatar Initials
  const initial = item.memberName.charAt(0).toUpperCase()

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl">
      <div>
        {/* Top Member Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-purple-500/20 text-lg font-black text-amber-400 border border-amber-500/30 shadow-inner">
              {initial}
            </span>

            {/* Member Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/members/${item.memberId}`}
                  className="text-base font-black text-[var(--text-strong)] transition-colors hover:text-amber-400 sm:text-lg"
                >
                  {item.memberName}
                </Link>

                {item.zaloPhone ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-400">
                    <span className="size-1.5 rounded-full bg-sky-400" />
                    Zalo: {item.zaloPhone}
                  </span>
                ) : null}

                {item.phone && item.phone !== item.zaloPhone ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    <Phone size={10} />
                    {item.phone}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                {item.detail}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`shrink-0 whitespace-nowrap self-start rounded-full border px-3 py-1 text-xs font-black ${statusBadge}`}
          >
            {item.statusLabel}
          </span>
        </div>

        {/* Zalo Message Bubble Preview */}
        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-4.5 transition-colors group-hover:border-sky-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-sky-400">
              <span className="grid size-6 place-items-center rounded-lg bg-sky-500/15">
                <MessageCircle size={14} />
              </span>
              Mẫu tin nhắn Zalo gửi khách hàng
            </div>

            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-sky-400 transition"
              title="Sao chép nhanh"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <ClipboardCopy size={13} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép nhanh'}</span>
            </button>
          </div>

          <p className="mt-2.5 border-t border-sky-500/10 pt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-[var(--text-strong)] italic">
            "{item.message}"
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--line)] pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action: Copy & Open Zalo */}
          <button
            type="button"
            onClick={onCopyAndOpen}
            disabled={!zaloUrl}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-950/20 transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} />
            Copy & Mở Zalo
            <ExternalLink size={13} />
          </button>

          {/* Secondary Action: Only Copy Message */}
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 text-xs sm:text-sm font-bold text-[var(--text-strong)] transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface)]"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <ClipboardCopy size={15} />}
            {copied ? 'Đã copy tin nhắn' : 'Chỉ copy tin nhắn'}
          </button>

          {/* Tertiary Action: Direct Zalo Link */}
          {zaloUrl ? (
            <a
              href={zaloUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs sm:text-sm font-bold text-[var(--text)] transition hover:border-sky-500 hover:text-sky-400"
            >
              Mở Zalo
              <ExternalLink size={13} />
            </a>
          ) : null}
        </div>

        {/* Link to Member Detail */}
        <Link
          to={`/members/${item.memberId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-amber-400 transition"
        >
          <User size={13} />
          Xem hồ sơ hội viên
        </Link>
      </div>
    </article>
  )
}
