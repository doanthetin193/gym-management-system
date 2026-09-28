import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Gender, MemberPayload, MemberProfile, MemberSource, MemberStatus } from '../types/member'

type MemberFormModalProps = {
  mode: 'create' | 'edit'
  member?: MemberProfile | null
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: MemberPayload) => Promise<void>
}

type MemberFormState = {
  fullName: string
  phone: string
  dateOfBirth: string
  gender: '' | Gender
  address: string
  zaloPhone: string
  source: '' | MemberSource
  status: MemberStatus
  note: string
}

const sourceOptions: Array<{ value: MemberSource; label: string }> = [
  { value: 'WALK_IN', label: 'Đến trực tiếp' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'ZALO', label: 'Zalo' },
  { value: 'REFERRAL', label: 'Giới thiệu' },
  { value: 'OTHER', label: 'Khác' },
]

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

function initialState(member?: MemberProfile | null): MemberFormState {
  return {
    fullName: member?.fullName ?? '',
    phone: member?.phone ?? '',
    dateOfBirth: member?.dateOfBirth ?? '',
    gender: member?.gender ?? '',
    address: member?.address ?? '',
    zaloPhone: member?.zaloPhone ?? '',
    source: member?.source ?? 'WALK_IN',
    status: member?.status ?? 'ACTIVE',
    note: member?.note ?? '',
  }
}

export function MemberFormModal({
  mode,
  member,
  submitting,
  error,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const [form, setForm] = useState<MemberFormState>(() => initialState(member))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender || null,
      address: form.address.trim() || null,
      zaloPhone: form.zaloPhone.trim() || null,
      source: form.source || null,
      status: mode === 'edit' ? form.status : null,
      note: form.note.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[8px] border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
              {mode === 'create' ? 'Khách hàng mới' : 'Cập nhật hồ sơ'}
            </p>
            <h2 className="mt-1 text-lg font-black text-[var(--text-strong)]">
              {mode === 'create' ? 'Tạo hội viên' : member?.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Họ tên</span>
              <input
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Số điện thoại</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Ngày sinh</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Giới tính</span>
              <select
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as '' | Gender }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              >
                <option value="">Chưa chọn</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Nguồn khách</span>
              <select
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value as '' | MemberSource }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Zalo</span>
              <input
                value={form.zaloPhone}
                onChange={(event) => setForm((current) => ({ ...current, zaloPhone: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              />
            </label>
          </div>

          {mode === 'edit' ? (
            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Trạng thái</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MemberStatus }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              >
                <option value="ACTIVE">Đang theo dõi</option>
                <option value="INACTIVE">Ngưng tương tác</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-bold text-[var(--text-strong)]">Địa chỉ</span>
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[var(--text-strong)]">Ghi chú</span>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              className="mt-2 min-h-24 w-full resize-y rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[8px] border border-[var(--line)] px-4 text-sm font-bold text-[var(--text)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95 disabled:opacity-70"
            >
              {submitting ? 'Đang lưu...' : 'Lưu hội viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
