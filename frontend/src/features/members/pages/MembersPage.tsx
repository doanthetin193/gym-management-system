import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/context/authContext'
import { createMember, getMemberDetail, listMembers, updateMember } from '../api/memberApi'
import { MemberFormModal } from '../components/MemberFormModal'
import type { MemberListFilter, MemberPayload, MemberProfile, MemberSummary } from '../types/member'

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-600 to-violet-600',
  'from-cyan-600 to-blue-600',
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function getMemberStatusBadge(member: MemberSummary) {
  if (member.daysUntilExpiration === null) {
    return {
      label: 'Chưa có gói',
      badgeClass:
        'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400',
      dotClass: 'bg-slate-400',
    }
  }
  if (member.daysUntilExpiration < 0) {
    return {
      label: 'Đã hết hạn',
      badgeClass:
        'border-red-500/30 bg-red-50 text-[#df271b] dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
      dotClass: 'bg-[#df271b]',
    }
  }
  if (member.daysUntilExpiration <= 7) {
    return {
      label: member.daysUntilExpiration === 0 ? 'Hết hôm nay' : `Còn ${member.daysUntilExpiration} ngày`,
      badgeClass:
        'border-amber-500/30 bg-amber-50 text-amber-700 dark:border-[#ffcc08]/30 dark:bg-[#ffcc08]/15 dark:text-[#ffcc08]',
      dotClass: 'bg-[#ffcc08] animate-pulse',
    }
  }
  return {
    label: 'Đang tập',
    badgeClass:
      'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
    dotClass: 'bg-emerald-500 animate-pulse',
  }
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

export function MembersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageStatus = user?.roles.includes('OWNER') ?? false
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [allMembers, setAllMembers] = useState<MemberSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<MemberListFilter>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Full global stats (independent of current active filter)
  const stats = useMemo(() => {
    const list = allMembers.length > 0 ? allMembers : members
    return {
      total: list.length,
      active: list.filter(
        (member) => member.daysUntilExpiration !== null && member.daysUntilExpiration > 7,
      ).length,
      expiring: list.filter(
        (member) =>
          member.daysUntilExpiration !== null &&
          member.daysUntilExpiration >= 0 &&
          member.daysUntilExpiration <= 7,
      ).length,
      expired: list.filter(
        (member) => member.daysUntilExpiration !== null && member.daysUntilExpiration < 0,
      ).length,
    }
  }, [allMembers, members])

  const totalPages = Math.max(1, Math.ceil(members.length / pageSize))
  const activePage = Math.min(currentPage, totalPages)

  const paginatedMembers = useMemo(() => {
    const start = (activePage - 1) * pageSize
    return members.slice(start, start + pageSize)
  }, [activePage, members, pageSize])

  const fromIndex = members.length === 0 ? 0 : (activePage - 1) * pageSize + 1
  const toIndex = Math.min(activePage * pageSize, members.length)

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (activePage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (activePage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages]
  }, [activePage, totalPages])

  const filterOptions = useMemo<Array<{ value: MemberListFilter; label: string; count: number }>>(
    () => [
      { value: 'ALL', label: 'Tất cả', count: stats.total },
      { value: 'ACTIVE', label: 'Đang tập', count: stats.active },
      { value: 'EXPIRING_SOON', label: 'Sắp hết hạn', count: stats.expiring },
      { value: 'EXPIRED', label: 'Hết hạn', count: stats.expired },
    ],
    [stats],
  )

  const loadAllMembers = useCallback(async () => {
    try {
      const allData = await listMembers({ keyword: '', filter: 'ALL' })
      setAllMembers(allData)
    } catch {
      // ignore silently for background telemetry
    }
  }, [])

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listMembers({ keyword: keyword.trim(), filter })
      setMembers(data)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [filter, keyword])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAllMembers()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadAllMembers])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers()
    }, 250)

    return () => window.clearTimeout(timer)
  }, [loadMembers])

  async function handleSubmit(payload: MemberPayload) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (formMode === 'edit' && editingMember) {
        await updateMember(editingMember.id, payload)
        await Promise.all([loadMembers(), loadAllMembers()])
      } else {
        const created = await createMember(payload)
        await loadAllMembers()
        navigate(`/members/${created.id}`)
      }
      setFormMode(null)
      setEditingMember(null)
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateModal() {
    setEditingMember(null)
    setFormError(null)
    setFormMode('create')
  }

  async function openEditModal(member: MemberSummary) {
    setFormError(null)
    try {
      setEditingMember((await getMemberDetail(member.id)).profile)
      setFormMode('edit')
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      {/* 1. Page Header (Đồng bộ chuẩn 100% với các trang khác) */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            Quản Trị Hội Viên • Hồ Sơ & Thẻ Tập
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Quản Lý Hội Viên
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            Theo dõi thời hạn gói tập, lịch sử đăng ký và tình trạng hội viên toàn phòng gym.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#df271b] to-[#b91c1c] px-4 text-sm font-extrabold text-white shadow-sm hover:brightness-110 active:scale-[0.99] transition"
          >
            <Plus size={16} />
            <span>+ Tạo hội viên mới</span>
          </button>
        </div>
      </section>

      {/* 4 Luxury Telemetry Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        <StatCard
          label="Tổng hội viên"
          value={stats.total}
          subtext="Toàn hệ thống"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Đang tập an toàn"
          value={stats.active}
          subtext="Hạn > 7 ngày"
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Sắp hết hạn"
          value={stats.expiring}
          subtext="Cần gọi nhắc"
          icon={CalendarClock}
          tone="yellow"
        />
        <StatCard
          label="Đã hết hạn"
          value={stats.expired}
          subtext="Ưu tiên gia hạn"
          icon={AlertCircle}
          tone="red"
        />
      </section>

      {/* Main Table Container */}
      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#0c1017] overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3.5 border-b border-slate-100 p-4 dark:border-white/[0.06] lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex min-w-0 flex-1 items-center rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 transition focus-within:border-[#087ec1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-[#ffcc08] dark:focus-within:bg-[#0c1017]">
            <Search size={16} className="shrink-0 text-slate-400 dark:text-gray-400" />
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm theo tên hội viên, số điện thoại..."
              className="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-xs md:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-gray-400"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  setCurrentPage(1)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Pills & Reload */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {filterOptions.map((option) => {
                const isActive = filter === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value)
                      setCurrentPage(1)
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#087ec1] text-white shadow-sm dark:bg-[#ffcc08] dark:text-slate-900'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-black/10 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300'
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                void loadMembers()
                void loadAllMembers()
              }}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-[#087ec1] hover:text-[#087ec1] dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white transition"
              title="Tải lại danh sách"
              aria-label="Tải lại danh sách"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs md:text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-400">
                <th className="px-5 py-3.5">Hội viên</th>
                <th className="px-4 py-3.5">Số điện thoại</th>
                <th className="px-4 py-3.5">Gói tập hiện tại</th>
                <th className="px-4 py-3.5">Thời hạn thẻ</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCcw size={20} className="animate-spin text-[#087ec1] dark:text-[#ffcc08]" />
                      <span>Đang tải danh sách hội viên...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={32} className="text-slate-300 dark:text-white/20" />
                      <p className="text-slate-700 dark:text-gray-300 font-bold">Không tìm thấy hội viên phù hợp</p>
                      <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const statusBadge = getMemberStatusBadge(member)
                  return (
                    <tr
                      key={member.id}
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                    >
                      {/* Member column with initial avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(
                                member.fullName,
                              )} text-xs font-black text-white shadow-sm`}
                            >
                              {getInitials(member.fullName)}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-[#0c1017] ${statusBadge.dotClass}`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-slate-900 group-hover:text-[#087ec1] dark:text-white dark:group-hover:text-[#ffcc08] transition truncate">
                              {member.fullName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                              {member.dateOfBirth && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} className="text-slate-400" />
                                  <span>{formatDate(member.dateOfBirth)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-700 dark:text-gray-300">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      </td>

                      {/* Plan Name */}
                      <td className="px-4 py-3.5">
                        {member.currentPlanName ? (
                          <span className="inline-flex max-w-[240px] items-center gap-1.5 truncate rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                            <span className="size-1.5 rounded-full bg-[#087ec1] shrink-0" />
                            <span className="truncate">{member.currentPlanName}</span>
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-gray-400">Chưa đăng ký gói</span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3.5">
                        {member.endDate ? (
                          <div>
                            <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-gray-200">
                              {formatDate(member.endDate)}
                            </p>
                            {member.daysUntilExpiration !== null && (
                              <span
                                className={`mt-0.5 inline-block text-[11px] font-semibold ${
                                  member.daysUntilExpiration < 0
                                    ? 'text-red-500 dark:text-red-400'
                                    : member.daysUntilExpiration <= 7
                                      ? 'text-amber-600 dark:text-[#ffcc08]'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {member.daysUntilExpiration < 0
                                  ? `Hết hạn ${Math.abs(member.daysUntilExpiration)} ngày trước`
                                  : member.daysUntilExpiration === 0
                                    ? 'Hết hạn hôm nay'
                                    : `Còn ${member.daysUntilExpiration} ngày`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-black ${statusBadge.badgeClass}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusBadge.dotClass}`} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => void openEditModal(member)}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 hover:border-[#087ec1] hover:text-[#087ec1] dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white transition shadow-sm"
                            title="Sửa hồ sơ"
                            aria-label="Sửa hồ sơ"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${member.id}`)}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 hover:border-[#087ec1] hover:text-[#087ec1] dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white transition shadow-sm"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Luxury Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 text-xs font-semibold text-slate-500 dark:border-white/[0.06] dark:text-gray-400">
          {/* Left Info: Range & Page Size Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Hiển thị <strong className="text-slate-900 dark:text-white">{fromIndex}</strong> -{' '}
              <strong className="text-slate-900 dark:text-white">{toIndex}</strong> trên{' '}
              <strong className="text-slate-900 dark:text-white">{members.length}</strong> hội viên
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
              <span className="text-[11px] text-slate-400">Số dòng:</span>
              <div className="flex items-center gap-1">
                {[6, 10, 20].map((size) => {
                  const isSelected = pageSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size)
                        setCurrentPage(1)
                      }}
                      className={`h-6 rounded-lg px-2 text-[11px] font-extrabold transition ${
                        isSelected
                          ? 'bg-[#087ec1] text-white shadow-sm dark:bg-[#ffcc08] dark:text-slate-900'
                          : 'border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Modern Pagination Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Previous Page Button */}
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#087ec1] hover:text-[#087ec1] disabled:opacity-40 disabled:pointer-events-none dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Trước</span>
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {paginationPages.map((page, idx) => {
                if (typeof page === 'string') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                      ...
                    </span>
                  )
                }

                const isCurrent = activePage === page
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex size-8 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                      isCurrent
                        ? 'bg-[#087ec1] text-white shadow-sm dark:bg-[#ffcc08] dark:text-slate-900'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:border-[#087ec1] hover:text-[#087ec1] dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#087ec1] hover:text-[#087ec1] disabled:opacity-40 disabled:pointer-events-none dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
            >
              <span className="hidden sm:inline">Sau</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Member Form Modal */}
      {formMode && (
        <MemberFormModal
          mode={formMode}
          member={editingMember}
          canManageStatus={canManageStatus}
          submitting={submitting}
          error={formError}
          onClose={() => {
            setFormMode(null)
            setEditingMember(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: string | number
  subtext: string
  icon: typeof Users
  tone?: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const toneClasses = {
    blue: {
      glow: 'bg-[#087ec1]/10',
      iconBg: 'bg-blue-50 text-[#087ec1] dark:bg-[#087ec1]/15',
      borderHover: 'hover:border-[#087ec1]/50',
      subtextBadge: 'text-[#087ec1]',
    },
    green: {
      glow: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-500/50',
      subtextBadge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    yellow: {
      glow: 'bg-[#ffcc08]/10',
      iconBg: 'bg-amber-50 text-[#d97706] dark:bg-[#ffcc08]/15 dark:text-[#ffcc08]',
      borderHover: 'hover:border-[#ffcc08]/50',
      subtextBadge: 'bg-amber-50 text-amber-700 dark:bg-[#ffcc08]/15 dark:text-[#ffcc08]',
    },
    red: {
      glow: 'bg-[#df271b]/10',
      iconBg: 'bg-red-50 text-[#df271b] dark:bg-[#df271b]/15 dark:text-red-400',
      borderHover: 'hover:border-[#df271b]/50',
      subtextBadge: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    },
  }[tone]

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-white/[0.08] dark:bg-[#0c1017] ${toneClasses.borderHover}`}
    >
      <div
        className={`pointer-events-none absolute right-0 top-0 size-24 rounded-full blur-xl transition group-hover:scale-125 ${toneClasses.glow}`}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
          {label}
        </span>
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneClasses.iconBg}`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-black ${toneClasses.subtextBadge}`}>
          {subtext}
        </span>
      </div>
    </div>
  )
}

