import { Copy, QrCode, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
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

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

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
  const [debtRecordId, setDebtRecordId] = useState(selectedDebt?.id.toString() ?? debts[0]?.id.toString() ?? '')
  const [amount, setAmount] = useState((selectedDebt?.remainingAmount ?? debts[0]?.remainingAmount ?? 0).toString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState(todayIso())
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
              Biên Nhận Thu Tiền
            </span>
            <h3 className="text-xl font-black text-[var(--text-strong)]">Lập phiếu thu công nợ</h3>
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

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          {/* Debt Selector if multiple open debts */}
          <label className="block text-xs font-bold text-[var(--text-strong)]">
            Hồ sơ công nợ cần thu *
            <select
              value={debtRecordId}
              onChange={(event) => handleDebtChange(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
              required
            >
              {debts.map((debt) => (
                <option key={debt.id} value={debt.id} className="bg-[var(--surface)] text-[var(--text-strong)]">
                  {debt.memberName} — {debt.planName ?? 'Khoản thu'} — Còn nợ: {formatMoney(debt.remainingAmount)}
                </option>
              ))}
            </select>
          </label>

          {/* Selected Debt Quick Summary */}
          {currentDebt ? (
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-xs">
              <Info label="Hội viên" value={currentDebt.memberName} />
              <Info label="Đã thanh toán" value={formatMoney(currentDebt.paidAmount)} />
              <Info label="Còn phải thu" value={formatMoney(currentDebt.remainingAmount)} highlight />
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div className="space-y-3.5">
              <label className="block text-xs font-bold text-[var(--text-strong)]">
                Số tiền thu đợt này (VNĐ) *
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  min={1000}
                  max={currentDebt?.remainingAmount}
                  step={10000}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-[var(--text-strong)]">
                  Ngày lập phiếu *
                  <input
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    type="date"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                    required
                  />
                </label>

                <label className="block text-xs font-bold text-[var(--text-strong)]">
                  Phương thức *
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
                    required
                  >
                    {methodOptions.map((method) => (
                      <option key={method.value} value={method.value} className="bg-[var(--surface)] text-[var(--text-strong)]">
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-bold text-[var(--text-strong)]">
                Ghi chú phiếu thu
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none transition focus:border-amber-500"
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
              disabled={submitting || !currentDebt}
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
