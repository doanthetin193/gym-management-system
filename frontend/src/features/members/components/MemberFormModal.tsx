import { UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { DatePartsSelect } from '../../../shared/components/DatePartsSelect'
import type { Gender, MemberPayload, MemberProfile, MemberSource, MemberStatus } from '../types/member'

type MemberFormModalProps = {
  mode: 'create' | 'edit'
  member?: MemberProfile | null
  canManageStatus: boolean
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
  canManageStatus,
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
      status: mode === 'edit' && canManageStatus ? form.status : null,
      note: form.note.trim() || null,
    })
  }

  const isCreate = mode === 'create'
  const Icon = isCreate ? UserPlus : Users

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0c1017] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#087ec1] to-blue-700 text-white shadow-sm">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                {isCreate ? 'Thêm mới khách hàng' : 'Cập nhật thông tin'}
              </p>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                {isCreate ? 'Tạo Hội Viên Mới' : member?.fullName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white transition"
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs md:text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Họ và tên <span className="text-red-500">*</span>
              </span>
              <input
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Số điện thoại <span className="text-red-500">*</span>
              </span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                inputMode="tel"
                placeholder="Ví dụ: 0901 000 004 hoặc +84 901 000 004"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
                required
              />
            </label>

            <DatePartsSelect
              label="Ngày sinh"
              value={form.dateOfBirth}
              onChange={(value) => setForm((current) => ({ ...current, dateOfBirth: value }))}
              allowEmpty
              yearBack={80}
              yearForward={0}
              labelClassName="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400"
              selectClassName="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
            />

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Giới tính
              </span>
              <select
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as '' | Gender }))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Nguồn khách
              </span>
              <select
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value as '' | MemberSource }))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Số Zalo
              </span>
              <input
                value={form.zaloPhone}
                onChange={(event) => setForm((current) => ({ ...current, zaloPhone: event.target.value }))}
                inputMode="tel"
                placeholder="Để trống nếu dùng cùng số điện thoại"
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
              />
            </label>
          </div>

          {mode === 'edit' && canManageStatus && (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Trạng thái tài khoản
              </span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MemberStatus }))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
              >
                <option value="ACTIVE">Đang theo dõi (Active)</option>
                <option value="INACTIVE">Ngưng tương tác (Inactive)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Địa chỉ liên hệ
            </span>
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="Ví dụ: Phường 5, Quận 3, TP.HCM"
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Ghi chú hội viên
            </span>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Ghi chú mục tiêu tập luyện, tiền sử chấn thương..."
              className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs md:text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087ec1] focus:bg-white focus:ring-2 focus:ring-[#087ec1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#ffcc08] dark:focus:bg-[#0c1017]"
            />
          </label>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200/80 bg-white px-4 text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#df271b] to-[#b91c1c] px-5 text-xs md:text-sm font-extrabold text-white shadow-sm hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

