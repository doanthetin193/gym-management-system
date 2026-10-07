import { CalendarDays, CreditCard, Dumbbell, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'
import type { PaymentMethod } from '../../payments/types/payment'
import type { MemberMembershipPayload } from '../types/member'

export type MembershipAssignmentSubmitPayload = {
  membership: MemberMembershipPayload
  paidAmount: number
  paymentMethod: PaymentMethod
}

type MembershipAssignmentModalProps = {
  memberName: string
  plans: MembershipPlan[]
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: MembershipAssignmentSubmitPayload) => Promise<void>
}

const methodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản (VietQR)' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

export function MembershipAssignmentModal({
  memberName,
  plans,
  submitting,
  error,
  onClose,
  onSubmit,
}: MembershipAssignmentModalProps) {
  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans])
  const firstPlan = activePlans[0]
  const [planId, setPlanId] = useState(firstPlan?.id.toString() ?? '')
  const [startDate, setStartDate] = useState(todayIso())
  const [actualPrice, setActualPrice] = useState((firstPlan?.defaultPrice ?? 0).toString())
  const [discountAmount, setDiscountAmount] = useState('0')
  const [paidAmount, setPaidAmount] = useState((firstPlan?.defaultPrice ?? 0).toString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [note, setNote] = useState('')

  const selectedPlan = useMemo(
    () => activePlans.find((plan) => plan.id.toString() === planId) ?? null,
    [activePlans, planId],
  )

  const payableAmount = Math.max(Number(actualPrice || 0) - Number(discountAmount || 0), 0)
  const remainingAmount = Math.max(payableAmount - Number(paidAmount || 0), 0)

  function handlePlanChange(value: string) {
    const nextPlan = activePlans.find((plan) => plan.id.toString() === value) ?? null
    const defaultPrice = nextPlan?.defaultPrice ?? 0
    setPlanId(value)
    setActualPrice(defaultPrice.toString())
    setDiscountAmount('0')
    setPaidAmount(defaultPrice.toString())
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) {
      return
    }

    await onSubmit({
      membership: {
        planId: selectedPlan.id,
        startDate,
        actualPrice: Number(actualPrice || 0),
        discountAmount: Number(discountAmount || 0),
        note: note.trim() || null,
      },
      paidAmount: Number(paidAmount || 0),
      paymentMethod,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[8px] border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Đăng ký / Gia hạn gói</p>
            <h3 className="mt-1 text-lg font-black text-[var(--text-strong)]">{memberName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-5">
          {error ? (
            <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-[var(--text)]">
                Chọn gói tập
                <select
                  value={planId}
                  onChange={(event) => handlePlanChange(event.target.value)}
                  className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  required
                >
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatMoney(plan.defaultPrice)}{plan.durationDays ? ` (${plan.durationDays} ngày)` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-[var(--text)]">
                  Ngày bắt đầu
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-[var(--text)]">
                  Phương thức thu tiền
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                    required
                  >
                    {methodOptions.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-bold text-[var(--text)]">
                  Giá bán thực tế
                  <input
                    type="number"
                    min={0}
                    value={actualPrice}
                    onChange={(event) => setActualPrice(event.target.value)}
                    className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-[var(--text)]">
                  Giảm giá
                  <input
                    type="number"
                    min={0}
                    max={Number(actualPrice || 0)}
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  />
                </label>

                <label className="block text-sm font-bold text-[var(--text)]">
                  Thu ngay
                  <input
                    type="number"
                    min={0}
                    max={payableAmount}
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    className="mt-2 h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-[var(--text)]">
                Ghi chú đăng ký
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 min-h-24 w-full resize-y rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--brand-blue)]"
                  placeholder="Ví dụ: khách chuyển khoản trước, còn lại thu cuối tuần"
                />
              </label>
            </div>

            <aside className="space-y-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-metric-blue">
                  <Dumbbell size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Gói được chọn</p>
                  <p className="mt-1 text-sm font-black text-[var(--text-strong)]">{selectedPlan?.name ?? 'Chưa chọn gói'}</p>
                </div>
              </div>

              <SummaryRow icon={<CalendarDays size={16} />} label="Thời hạn mặc định" value={selectedPlan?.durationDays ? `${selectedPlan.durationDays} ngày` : 'Nhập ngày kết thúc'} />
              <SummaryRow icon={<CreditCard size={16} />} label="Cần thu" value={formatMoney(payableAmount)} />

              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-3">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Công nợ sau khi lưu</p>
                <p className={['mt-1 text-xl font-black', remainingAmount > 0 ? 'text-[var(--brand-red)]' : 'text-[var(--success)]'].join(' ')}>
                  {formatMoney(remainingAmount)}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                  Thu ngay {formatMoney(Number(paidAmount || 0))}; phần còn lại tự sang công nợ.
                </p>
              </div>
            </aside>
          </div>

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
              disabled={submitting || !selectedPlan || Number(paidAmount || 0) > payableAmount}
              className="h-10 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95 disabled:opacity-70"
            >
              {submitting ? 'Đang kích hoạt...' : 'Kích hoạt gói'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] bg-[var(--surface)] px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2 font-bold text-[var(--text-muted)]">
        {icon}
        {label}
      </span>
      <span className="font-black text-[var(--text-strong)]">{value}</span>
    </div>
  )
}
