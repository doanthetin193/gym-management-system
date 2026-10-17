import { CalendarDays, CreditCard, Dumbbell, X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { DatePartsSelect } from '../../../shared/components/DatePartsSelect'
import { localIsoDate } from '../../../shared/lib/date'
import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'
import type { PaymentMethod } from '../../payments/types/payment'
import type { MemberMembershipPayload } from '../types/member'

export type MembershipAssignmentSubmitPayload = {
  membership: MemberMembershipPayload
  paidAmount: number
  paymentMethod: PaymentMethod | null
  paymentDate: string | null
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

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

export function MembershipAssignmentModal({
  memberName,
  plans,
  submitting,
  error,
  onClose,
  onSubmit,
}: MembershipAssignmentModalProps) {
  const today = localIsoDate()
  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans])
  const firstPlan = activePlans[0]
  const [planId, setPlanId] = useState(firstPlan?.id.toString() ?? '')
  const [startDate, setStartDate] = useState(today)
  const [paymentDate, setPaymentDate] = useState(today)
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
  const paidValue = Number(paidAmount || 0)
  const remainingAmount = Math.max(payableAmount - paidValue, 0)
  const hasInitialPayment = paidValue > 0

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
      paidAmount: paidValue,
      paymentMethod: hasInitialPayment ? paymentMethod : null,
      paymentDate: hasInitialPayment ? paymentDate : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-auto w-full max-w-4xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4.5 bg-[var(--surface-muted)]/40">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Dumbbell size={20} />
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
                Đăng ký / Gia hạn gói tập
              </span>
              <h3 className="text-lg font-black text-[var(--text-strong)]">{memberName}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--text-muted)] transition hover:border-[var(--brand-yellow)] hover:text-[var(--text-strong)]"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 p-6">
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            {/* Left Column: Form Fields */}
            <div className="space-y-4">
              {/* Plan Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Chọn gói tập áp dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={planId}
                  onChange={(event) => handlePlanChange(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  required
                >
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-[var(--surface)] text-[var(--text-strong)]">
                      {plan.name} — {formatMoney(plan.defaultPrice)}{plan.durationDays ? ` (${plan.durationDays} ngày)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3.5">
                <DatePartsSelect
                  label="Ngày bắt đầu kích hoạt gói"
                  value={startDate}
                  onChange={setStartDate}
                  required
                  labelClassName="text-xs font-bold text-[var(--text-strong)]"
                  selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2.5 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500 cursor-pointer"
                />
              </div>

              {/* Financial Inputs: Actual Price, Discount, Paid */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Học phí & Thanh toán đợt đầu
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">Giá bán thực tế</span>
                    <input
                      type="number"
                      min={0}
                      value={actualPrice}
                      onChange={(event) => setActualPrice(event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-bold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">Giảm giá (nếu có)</span>
                    <input
                      type="number"
                      min={0}
                      max={Number(actualPrice || 0)}
                      value={discountAmount}
                      onChange={(event) => setDiscountAmount(event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-bold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">Thu ngay hôm nay</span>
                    <input
                      type="number"
                      min={0}
                      max={payableAmount}
                      value={paidAmount}
                      onChange={(event) => setPaidAmount(event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-bold text-emerald-400 outline-none transition focus:border-amber-500"
                    />
                  </label>
                </div>
              </div>

              {/* Initial Payment Method & Date (Only if paidAmount > 0) */}
              {hasInitialPayment ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Thông tin thu tiền đợt đầu ({formatMoney(paidValue)})
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold text-[var(--text-strong)]">
                        Phương thức thanh toán <span className="text-red-500">*</span>
                      </span>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                        required={hasInitialPayment}
                      >
                        {methodOptions.map((method) => (
                          <option key={method.value} value={method.value} className="bg-[var(--surface)] text-[var(--text-strong)]">
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div>
                      <DatePartsSelect
                        label="Ngày thu tiền"
                        value={paymentDate}
                        onChange={setPaymentDate}
                        maxIso={today}
                        required={hasInitialPayment}
                        labelClassName="text-xs font-bold text-[var(--text-strong)]"
                        selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    💡 Nhập dữ liệu cũ thì chọn đúng ngày đã thu tiền để doanh thu ghi nhận chính xác theo tháng.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)]/40 p-3 text-xs text-[var(--text-muted)]">
                  Chưa thu tiền đợt này. Toàn bộ số tiền cần thu ({formatMoney(payableAmount)}) sẽ tự động chuyển sang công nợ học phí của hội viên.
                </div>
              )}

              {/* Note */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Ghi chú đăng ký</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1.5 min-h-[72px] w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-xs font-medium text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  placeholder="Ví dụ: Khách hẹn thanh toán phần còn lại sau 3 ngày..."
                />
              </label>
            </div>

            {/* Right Column: Dynamic Summary & Debt Calculation */}
            <aside className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/50 p-4.5 space-y-4">
              <div className="space-y-3.5">
                {/* Selected Plan Spec */}
                <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-metric-blue text-[var(--brand-blue)]">
                    <Dumbbell size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gói được chọn</p>
                    <p className="mt-0.5 text-sm font-bold text-[var(--text-strong)] truncate">
                      {selectedPlan?.name ?? 'Chưa chọn gói'}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-amber-400">
                      Thời hạn: {selectedPlan?.durationDays ? `${selectedPlan.durationDays} ngày` : 'Theo ngày kết thúc'}
                    </p>
                  </div>
                </div>

                {/* Pricing Table */}
                <div className="space-y-2 text-xs">
                  <SummaryRow icon={<CreditCard size={14} />} label="Giá bán thực tế" value={formatMoney(Number(actualPrice || 0))} />
                  {Number(discountAmount || 0) > 0 ? (
                    <SummaryRow icon={<CreditCard size={14} />} label="Giảm giá" value={`-${formatMoney(Number(discountAmount || 0))}`} />
                  ) : null}
                  <SummaryRow icon={<CreditCard size={14} />} label="Cần thanh toán" value={formatMoney(payableAmount)} highlight />
                  <SummaryRow
                    icon={<CalendarDays size={14} />}
                    label="Thu ngay đợt này"
                    value={hasInitialPayment ? formatMoney(paidValue) : '0 ₫'}
                  />
                  {hasInitialPayment ? (
                    <SummaryRow
                      icon={<CalendarDays size={14} />}
                      label="Ngày thu tiền"
                      value={formatDate(paymentDate)}
                    />
                  ) : null}
                </div>
              </div>

              {/* Debt Result Card */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm">
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Công nợ sau khi lưu
                </span>
                <p className={['mt-1 text-2xl font-black', remainingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'].join(' ')}>
                  {formatMoney(remainingAmount)}
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                  {hasInitialPayment
                    ? remainingAmount > 0
                      ? `Đã thu ${formatMoney(paidValue)}. Còn nợ ${formatMoney(remainingAmount)} tự động ghi sổ nợ.`
                      : 'Đã thu đủ 100% học phí, không ghi nhận công nợ.'
                    : remainingAmount > 0
                      ? `Chưa thu tiền. Tạo hồ sơ công nợ ${formatMoney(remainingAmount)}.`
                      : 'Gói miễn phí 0 ₫.'}
                </p>
              </div>
            </aside>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--surface-muted)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPlan || paidValue > payableAmount}
              className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 text-xs font-black text-black shadow-md transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Đang kích hoạt...'
                : hasInitialPayment
                  ? 'Kích hoạt gói & thu tiền'
                  : remainingAmount > 0
                    ? 'Kích hoạt gói & tạo công nợ'
                    : 'Kích hoạt gói'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] px-3 py-2.5 text-xs border border-[var(--line)]">
      <span className="inline-flex items-center gap-2 font-medium text-[var(--text-muted)]">
        {icon}
        {label}
      </span>
      <span className={`font-bold ${highlight ? 'text-amber-400 font-black' : 'text-[var(--text-strong)]'}`}>{value}</span>
    </div>
  )
}
