import { Eye, Pencil, Plus, RefreshCcw, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { createMember, getMemberDetail, listMembers, updateMember } from '../api/memberApi'
import { MemberFormModal } from '../components/MemberFormModal'
import type { MemberDetail, MemberListFilter, MemberPayload, MemberProfile, MemberSummary } from '../types/member'

const filterOptions: Array<{ value: MemberListFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang tập' },
  { value: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
  { value: 'EXPIRED', label: 'Hết hạn' },
]

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function expiryLabel(member: MemberSummary) {
  if (member.daysUntilExpiration === null) {
    return { label: 'Chưa có gói', className: 'bg-[var(--surface-muted)] text-[var(--text-muted)]' }
  }
  if (member.daysUntilExpiration < 0) {
    return { label: 'Đã hết hạn', className: 'bg-[var(--danger-soft)] text-[var(--danger-text)]' }
  }
  if (member.daysUntilExpiration <= 7) {
    return { label: `Còn ${member.daysUntilExpiration} ngày`, className: 'bg-metric-yellow' }
  }
  return { label: 'Đang tập', className: 'bg-metric-green' }
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

export function MembersPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<MemberListFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const stats = useMemo(() => {
    return {
      total: members.length,
      expiring: members.filter((member) => member.daysUntilExpiration !== null && member.daysUntilExpiration >= 0 && member.daysUntilExpiration <= 7).length,
      expired: members.filter((member) => member.daysUntilExpiration !== null && member.daysUntilExpiration < 0).length,
    }
  }, [members])

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

  async function loadDetail(memberId: number) {
    setDetailLoading(true)
    try {
      const data = await getMemberDetail(memberId)
      setDetail(data)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setDetailLoading(false)
    }
  }

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
        const updated = await updateMember(editingMember.id, payload)
        if (detail?.profile.id === updated.id) {
          await loadDetail(updated.id)
        }
      } else {
        const created = await createMember(payload)
        await loadDetail(created.id)
      }
      setFormMode(null)
      setEditingMember(null)
      await loadMembers()
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
    setFormMode('edit')
    const loadedDetail = detail?.profile.id === member.id ? detail : await getMemberDetail(member.id)
    setDetail(loadedDetail)
    setEditingMember(loadedDetail.profile)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Sprint 2</p>
          <h2 className="mt-1 text-2xl font-black text-[var(--text-strong)]">Quản lý khách hàng</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Theo dõi thông tin hội viên, hạn gói tập, công nợ và lịch sử đăng ký để thay cho bảng Excel thủ công.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95"
        >
          <Plus size={18} />
          Tạo hội viên
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-bold text-[var(--text-muted)]">Tổng khách trong bộ lọc</p>
          <p className="mt-2 text-2xl font-black text-[var(--text-strong)]">{stats.total}</p>
        </div>
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-bold text-[var(--text-muted)]">Sắp hết hạn</p>
          <p className="mt-2 text-2xl font-black text-[var(--brand-yellow)]">{stats.expiring}</p>
        </div>
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-bold text-[var(--text-muted)]">Đã hết hạn</p>
          <p className="mt-2 text-2xl font-black text-[var(--danger)]">{stats.expired}</p>
        </div>
      </section>

      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3">
            <Search size={18} className="shrink-0 text-[var(--text-muted)]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên hoặc số điện thoại"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={[
                  'h-10 rounded-[8px] border px-3 text-sm font-bold transition',
                  filter === option.value
                    ? 'border-[var(--brand-blue)] bg-metric-blue'
                    : 'border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text-strong)]',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadMembers()}
              className="inline-flex size-10 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              title="Tải lại"
              aria-label="Tải lại"
            >
              <RefreshCcw size={17} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs uppercase text-[var(--text-muted)]">
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Gói hiện tại</th>
                <th className="px-4 py-3">Hết hạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[var(--text-muted)]">
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[var(--text-muted)]">
                    Chưa có khách hàng phù hợp.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const badge = expiryLabel(member)
                  return (
                    <tr key={member.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[var(--nav-active)] text-sm font-black text-[var(--text-strong)]">
                            <Users size={17} />
                          </span>
                          <div>
                            <p className="font-bold text-[var(--text-strong)]">{member.fullName}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Sinh nhật: {formatDate(member.dateOfBirth)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--text)]">{member.phone}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--text)]">{member.currentPlanName ?? '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--text)]">{formatDate(member.endDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void loadDetail(member.id)}
                            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void openEditModal(member)}
                            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                            title="Sửa"
                            aria-label="Sửa"
                          >
                            <Pencil size={17} />
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
      </section>

      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
        {detailLoading ? (
          <p className="text-sm font-semibold text-[var(--text-muted)]">Đang tải chi tiết khách hàng...</p>
        ) : detail ? (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Chi tiết hội viên</p>
                  <h3 className="mt-1 text-xl font-black text-[var(--text-strong)]">{detail.profile.fullName}</h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{detail.profile.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(detail.profile)
                    setFormMode('edit')
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-sm font-bold text-[var(--text)]"
                >
                  <Pencil size={16} />
                  Sửa
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Ngày sinh" value={formatDate(detail.profile.dateOfBirth)} />
                <Info label="Zalo" value={detail.profile.zaloPhone ?? detail.profile.phone} />
                <Info label="Nguồn" value={detail.profile.source ?? '-'} />
                <Info label="Tổng dư nợ" value={formatMoney(detail.totalDebt)} strong />
              </div>
              {detail.profile.note ? (
                <p className="mt-4 rounded-[8px] bg-[var(--surface-muted)] p-3 text-sm font-semibold leading-6 text-[var(--text)]">
                  {detail.profile.note}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              <MembershipList title="Gói đang active" memberships={detail.activeMemberships} />
              <MembershipList title="Lịch sử gói cũ" memberships={detail.membershipHistory} />
              <div>
                <h4 className="text-sm font-black text-[var(--text-strong)]">Gói buổi PT</h4>
                <div className="mt-2 space-y-2">
                  {detail.ptSessionPackages.length === 0 ? (
                    <p className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                      Chưa có gói buổi PT.
                    </p>
                  ) : (
                    detail.ptSessionPackages.map((item) => (
                      <div key={item.id} className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                        <p className="font-bold text-[var(--text-strong)]">
                          PT còn {item.remainingPtSessions}/{item.totalPtSessions} buổi, ôn tập còn {item.remainingPracticeSessions}/{item.totalPracticeSessions}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)} · {item.status}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[var(--text-muted)]">Chọn một khách hàng để xem hồ sơ, lịch sử gói và công nợ.</p>
        )}
      </section>

      {formMode ? (
        <MemberFormModal
          mode={formMode}
          member={editingMember}
          submitting={submitting}
          error={formError}
          onClose={() => {
            setFormMode(null)
            setEditingMember(null)
          }}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className={['mt-1 text-sm', strong ? 'font-black text-[var(--brand-red)]' : 'font-semibold text-[var(--text)]'].join(' ')}>
        {value}
      </p>
    </div>
  )
}

function MembershipList({ title, memberships }: { title: string; memberships: MemberDetail['activeMemberships'] }) {
  return (
    <div>
      <h4 className="text-sm font-black text-[var(--text-strong)]">{title}</h4>
      <div className="mt-2 space-y-2">
        {memberships.length === 0 ? (
          <p className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
            Chưa có dữ liệu.
          </p>
        ) : (
          memberships.map((membership) => (
            <div key={membership.id} className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-[var(--text-strong)]">{membership.planName}</p>
                <p className="font-black text-[var(--brand-red)]">{formatMoney(membership.debtAmount)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                {formatDate(membership.startDate)} - {formatDate(membership.endDate)} · {membership.status}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
