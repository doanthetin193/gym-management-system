import { Copy, CreditCard, QrCode, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { DatePartsSelect } from '../../../shared/components/DatePartsSelect'
import { localIsoDate } from '../../../shared/lib/date'
import { buildTransferContent, buildVietQrImageUrl } from '../../settings/lib/vietQr'
import type { VietQrSetting } from '../../settings/types/settings'
import type { DebtRecord, PaymentMethod, PaymentPayload } from '../types/payment'

type PaymentFormModalProps = {
  debts: DebtRecord[]
  selectedDebt: DebtRecord | null
  submitting: boolean
  error: string | null
  vietQrSetting?: VietQrSetting | null
  onClose: () => void
  onSubmit: (payload: PaymentPayload) => Promise<void>
}

const methodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản (VietQR)' },
]

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

export function PaymentFormModal({
  debts,
  selectedDebt,
  submitting,
  error,
  vietQrSetting,
  onClose,
  onSubmit,
}: PaymentFormModalProps) {
  const today = localIsoDate()
  const [debtRecordId, setDebtRecordId] = useState(selectedDebt?.id.toString() ?? debts[0]?.id.toString() ?? '')
  const [amount, setAmount] = useState((selectedDebt?.remainingAmount ?? debts[0]?.remainingAmount ?? 0).toString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState(today)
  const [note, setNote] = useState('')

  const currentDebt = useMemo(
    () => debts.find((debt) => debt.id.toString() === debtRecordId) ?? selectedDebt ?? null,
    [debtRecordId, debts, selectedDebt],
  )
  const transferContent = useMemo(
    () => currentDebt && vietQrSetting ? buildTransferContent(vietQrSetting, currentDebt.memberName, currentDebt.id) : '',
    [currentDebt, vietQrSetting],
  )
  const vietQrUrl = useMemo(
    () => vietQrSetting ? buildVietQrImageUrl({ setting: vietQrSetting, amount: Number(amount || 0), addInfo: transferContent }) : '',
    [amount, transferContent, vietQrSetting],
  )

  function handleDebtChange(value: string) {
    const nextDebt = debts.find((debt) => debt.id.toString() === value) ?? null
    setDebtRecordId(value)
    setAmount((nextDebt?.remainingAmount ?? 0).toString())
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentDebt) return

    await onSubmit({
      memberId: currentDebt.memberId,
      debtRecordId: currentDebt.id,
      membershipId: currentDebt.membershipId,
      paymentDate,
      amount: Number(amount),
      paymentMethod,
      note: note.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4.5 bg-[var(--surface-muted)]/40">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <CreditCard size={20} />
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                Biên nhận thu tiền
              </span>
              <h3 className="text-lg font-black text-[var(--text-strong)]">Lập phiếu thu công nợ</h3>
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

          {/* Debt Selector if multiple open debts */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Hồ sơ công nợ cần thu <span className="text-red-500">*</span>
            </label>
            <select
              value={debtRecordId}
              onChange={(event) => handleDebtChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
              required
            >
              {debts.map((debt) => (
                <option key={debt.id} value={debt.id} className="bg-[var(--surface)] text-[var(--text-strong)]">
                  {debt.memberName} — {debt.planName ?? 'Khoản thu'} — Còn nợ: {formatMoney(debt.remainingAmount)}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Debt Quick Summary */}
          {currentDebt ? (
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/60 p-3 text-xs">
              <Info label="Hội viên" value={currentDebt.memberName} />
              <Info label="Đã thanh toán" value={formatMoney(currentDebt.paidAmount)} />
              <Info label="Còn phải thu" value={formatMoney(currentDebt.remainingAmount)} highlight />
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {/* Payment Amount with Quick-fill helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Số tiền thu đợt này (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  {currentDebt && Number(amount || 0) < currentDebt.remainingAmount ? (
                    <button
                      type="button"
                      onClick={() => setAmount(currentDebt.remainingAmount.toString())}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      Thu tất cả ({formatMoney(currentDebt.remainingAmount)})
                    </button>
                  ) : null}
                </div>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  min={1000}
                  max={currentDebt?.remainingAmount}
                  step={10000}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-emerald-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                  required
                />
              </div>

              {/* Payment Method */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Phương thức thanh toán <span className="text-red-500">*</span>
                </span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  required
                >
                  {methodOptions.map((method) => (
                    <option key={method.value} value={method.value} className="bg-[var(--surface)] text-[var(--text-strong)]">
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Payment Date - FULL WIDTH IN LEFT COLUMN to guarantee NO TRUNCATION */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3.5">
                <DatePartsSelect
                  label="Ngày lập phiếu thu"
                  value={paymentDate}
                  onChange={setPaymentDate}
                  maxIso={today}
                  required
                  helperText="💡 Có thể chọn ngày thu cũ để doanh thu ghi nhận chính xác theo tháng."
                  labelClassName="text-xs font-bold text-[var(--text-strong)]"
                  selectClassName="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-2.5 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500 cursor-pointer"
                />
              </div>

              {/* Note */}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Ghi chú phiếu thu
                </span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-medium text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                  placeholder="Ví dụ: Chuyển khoản cọc đợt 1, thanh toán qua Momo..."
                />
              </label>
            </div>

            {/* VietQR Preview Box */}
            <VietQrPreview
              setting={vietQrSetting}
              imageUrl={vietQrUrl}
              transferContent={transferContent}
              amount={Number(amount || 0)}
            />
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
              disabled={submitting || !currentDebt || Number(amount || 0) <= 0}
              className="h-10 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-5 text-xs font-black text-white shadow-md transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang lưu...' : 'Xác nhận thu tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VietQrPreview({
  setting,
  imageUrl,
  transferContent,
  amount,
}: {
  setting?: VietQrSetting | null
  imageUrl: string
  transferContent: string
  amount: number
}) {
  async function copyContent() {
    if (transferContent) {
      await navigator.clipboard.writeText(transferContent)
    }
  }

  if (!setting?.enabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4 text-center text-xs font-semibold text-[var(--text-muted)]">
        <QrCode size={32} className="opacity-30 mb-2" />
        <p>VietQR chuyển khoản nhanh chưa kích hoạt trong Cài đặt.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3.5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider">
            <QrCode size={14} />
            Mã VietQR
          </span>
          <span className="text-xs font-black text-emerald-400">{formatMoney(amount)}</span>
        </div>

        <div className="mt-2.5 grid place-items-center">
          {imageUrl ? (
            <button
              type="button"
              onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
              className="rounded-xl bg-white p-2 shadow-sm transition hover:scale-[1.02]"
              title="Nhấn để mở mã QR kích thước lớn"
            >
              <img src={imageUrl} alt="Mã VietQR thu tiền" className="h-32 w-32 object-contain" />
            </button>
          ) : (
            <div className="grid h-32 w-32 place-items-center rounded-xl border border-dashed border-[var(--line)] text-center text-xs font-semibold text-[var(--text-muted)]">
              Chưa đủ cấu hình QR
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
        <p className="truncate text-[var(--text-strong)]">{setting.bankName} • {setting.accountNumber}</p>
        <button
          type="button"
          onClick={() => void copyContent()}
          className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--text-strong)] hover:border-amber-500 transition"
          title="Sao chép nội dung chuyển khoản"
        >
          <span className="truncate">{transferContent || 'Nội dung chuyển khoản'}</span>
          <Copy size={12} className="shrink-0 text-amber-500" />
        </button>
      </div>
    </div>
  )
}

function Info({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <p className={`mt-0.5 font-black truncate ${highlight ? 'text-red-500 text-sm' : 'text-[var(--text-strong)]'}`}>
        {value}
      </p>
    </div>
  )
}
