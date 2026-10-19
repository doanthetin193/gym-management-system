import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { MembershipPlanPayload, PlanType, PtLevel } from '../types/membershipPlan'

type MembershipPlanFormModalProps = {
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: MembershipPlanPayload) => Promise<void>
}

type PlanFormState = {
  name: string
  planType: PlanType
  ptLevel: '' | PtLevel
  durationDays: string
  defaultPrice: string
  ptSessionCount: string
  practiceSessionCount: string
  guidanceSessionCount: string
  description: string
  active: boolean
}

const planTypeOptions: Array<{ value: PlanType; label: string }> = [
  { value: 'SELF_TRAINING', label: 'Tự tập' },
  { value: 'GUIDANCE', label: 'Giáo án/Hướng dẫn' },
  { value: 'PT', label: 'PT' },
  { value: 'OTHER', label: 'Khác' },
]

function toNumber(value: string) {
  return value.trim() ? Number(value) : null
}

export function MembershipPlanFormModal({ submitting, error, onClose, onSubmit }: MembershipPlanFormModalProps) {
  const [form, setForm] = useState<PlanFormState>({
    name: '',
    planType: 'SELF_TRAINING',
    ptLevel: '',
    durationDays: '30',
    defaultPrice: '',
    ptSessionCount: '',
    practiceSessionCount: '',
    guidanceSessionCount: '',
    description: '',
    active: true,
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      name: form.name.trim(),
      planType: form.planType,
      ptLevel: form.planType === 'PT' ? form.ptLevel || null : null,
      durationDays: toNumber(form.durationDays),
      defaultPrice: toNumber(form.defaultPrice),
      ptSessionCount: form.planType === 'PT' ? toNumber(form.ptSessionCount) : null,
      practiceSessionCount: form.planType === 'PT' ? toNumber(form.practiceSessionCount) : null,
      guidanceSessionCount: form.planType === 'GUIDANCE' ? toNumber(form.guidanceSessionCount) : null,
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
              Biểu Phí Niêm Yết
            </span>
            <h2 className="text-xl font-black text-[var(--text-strong)]">Thêm gói tập mới</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--text-muted)] transition hover:border-[var(--brand-yellow)] hover:text-[var(--text-strong)]"
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-[var(--text-strong)]">Tên gói tập *</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="VD: Tự Tập - Full 1 Tháng, Tăng Cơ Giảm Mỡ (PT Chuẩn)..."
                className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-strong)]">Loại chương trình *</span>
              <select
                value={form.planType}
                onChange={(event) => setForm((current) => ({ ...current, planType: event.target.value as PlanType }))}
                className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
              >
                {planTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[var(--surface)] text-[var(--text-strong)]">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-strong)]">Thời hạn sử dụng (ngày) *</span>
              <input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))}
                className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-strong)]">Đơn giá niêm yết (VNĐ) *</span>
              <input
                type="number"
                min={0}
                step={10000}
                value={form.defaultPrice}
                onChange={(event) => setForm((current) => ({ ...current, defaultPrice: event.target.value }))}
                placeholder="VD: 300000, 6000000..."
                className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                required
              />
            </label>

            {form.planType === 'PT' ? (
              <>
                <label className="block">
                  <span className="text-xs font-bold text-[var(--text-strong)]">Phân cấp HLV</span>
                  <select
                    value={form.ptLevel}
                    onChange={(event) => setForm((current) => ({ ...current, ptLevel: event.target.value as '' | PtLevel }))}
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  >
                    <option value="" className="bg-[var(--surface)] text-[var(--text-strong)]">Chọn cấp HLV</option>
                    <option value="MAIN" className="bg-[var(--surface)] text-[var(--text-strong)]">PT Chuẩn (&gt;3 năm/VĐV)</option>
                    <option value="NEW" className="bg-[var(--surface)] text-[var(--text-strong)]">PT Mới ra nghề (Junior)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-[var(--text-strong)]">Số buổi kèm 1-1 (PT)</span>
                  <input
                    type="number"
                    min={1}
                    value={form.ptSessionCount}
                    onChange={(event) => setForm((current) => ({ ...current, ptSessionCount: event.target.value }))}
                    placeholder="VD: 12, 20, 40, 60"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-[var(--text-strong)]">Số buổi hướng dẫn / ôn tập</span>
                  <input
                    type="number"
                    min={1}
                    value={form.practiceSessionCount}
                    onChange={(event) => setForm((current) => ({ ...current, practiceSessionCount: event.target.value }))}
                    placeholder="VD: 12, 20, 40, 60"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                    required
                  />
                </label>
              </>
            ) : null}

            {form.planType === 'GUIDANCE' ? (
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-[var(--text-strong)]">Số buổi trị liệu / hướng dẫn</span>
                <input
                  type="number"
                  min={1}
                  value={form.guidanceSessionCount}
                  onChange={(event) => setForm((current) => ({ ...current, guidanceSessionCount: event.target.value }))}
                  placeholder="VD: 4 (1 trị liệu + 3 hướng dẫn)..."
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                />
              </label>
            ) : null}
          </div>

          <label className="block">
            <span className="text-xs font-bold text-[var(--text-strong)]">Mô tả quyền lợi & đặc trưng gói</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Quyền lợi chính của gói tập..."
              className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
            />
          </label>

          <label className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-xs font-bold text-[var(--text)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
              className="size-4 accent-amber-500"
            />
            Đang niêm yết bán gói này (Hội viên có thể đăng ký)
          </label>

          <div className="flex justify-end gap-2.5 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-5 text-xs font-black text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Thêm gói tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
