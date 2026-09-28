import { X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ContentAccessLevel, MembershipPlanPayload, PlanType, PtLevel } from '../types/membershipPlan'

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
  contentAccessLevel: ContentAccessLevel
  priceRatio: string
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
    contentAccessLevel: 'NONE',
    priceRatio: '',
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
      contentAccessLevel: form.contentAccessLevel,
      priceRatio: toNumber(form.priceRatio),
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[8px] border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Bảng giá</p>
            <h2 className="mt-1 text-lg font-black text-[var(--text-strong)]">Thêm gói tập</h2>
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
              <span className="text-sm font-bold text-[var(--text-strong)]">Tên gói</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Loại gói</span>
              <select
                value={form.planType}
                onChange={(event) => setForm((current) => ({ ...current, planType: event.target.value as PlanType }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              >
                {planTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Thời hạn ngày</span>
              <input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Giá mặc định</span>
              <input
                type="number"
                min={0}
                value={form.defaultPrice}
                onChange={(event) => setForm((current) => ({ ...current, defaultPrice: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              />
            </label>

            {form.planType === 'PT' ? (
              <>
                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-strong)]">Cấp PT</span>
                  <select
                    value={form.ptLevel}
                    onChange={(event) => setForm((current) => ({ ...current, ptLevel: event.target.value as '' | PtLevel }))}
                    className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  >
                    <option value="">Chọn cấp PT</option>
                    <option value="MAIN">PT chính</option>
                    <option value="NEW">PT mới</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-strong)]">Số buổi PT</span>
                  <input
                    type="number"
                    min={1}
                    value={form.ptSessionCount}
                    onChange={(event) => setForm((current) => ({ ...current, ptSessionCount: event.target.value }))}
                    className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-strong)]">Số buổi ôn tập</span>
                  <input
                    type="number"
                    min={0}
                    value={form.practiceSessionCount}
                    onChange={(event) => setForm((current) => ({ ...current, practiceSessionCount: event.target.value }))}
                    className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  />
                </label>
              </>
            ) : null}

            {form.planType === 'GUIDANCE' ? (
              <label className="block">
                <span className="text-sm font-bold text-[var(--text-strong)]">Số buổi giáo án</span>
                <input
                  type="number"
                  min={1}
                  value={form.guidanceSessionCount}
                  onChange={(event) => setForm((current) => ({ ...current, guidanceSessionCount: event.target.value }))}
                  className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Quyền nội dung</span>
              <select
                value={form.contentAccessLevel}
                onChange={(event) => setForm((current) => ({ ...current, contentAccessLevel: event.target.value as ContentAccessLevel }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              >
                <option value="NONE">Không</option>
                <option value="BASIC">Cơ bản</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[var(--text-strong)]">Tỉ lệ giá</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.priceRatio}
                onChange={(event) => setForm((current) => ({ ...current, priceRatio: event.target.value }))}
                className="mt-2 h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-[var(--text-strong)]">Mô tả</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-2 min-h-24 w-full resize-y rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
            />
          </label>

          <label className="flex items-center gap-3 rounded-[8px] bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--text)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
              className="size-4"
            />
            Đang bán gói này
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
              {submitting ? 'Đang lưu...' : 'Thêm gói'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
