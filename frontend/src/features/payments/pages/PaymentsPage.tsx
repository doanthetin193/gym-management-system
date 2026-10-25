import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  RefreshCcw,
  Search,
  WalletCards,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import type { PageResponse } from '../../../shared/types/pagination'
import { getVietQrSetting } from '../../settings/api/settingsApi'
import type { VietQrSetting } from '../../settings/types/settings'
import { createPayment, getFinanceSummary, listDebts, listDebtsPage, listPaymentsPage } from '../api/paymentApi'
import { PaymentFormModal } from '../components/PaymentFormModal'
import { paymentMethodLabels } from '../types/payment'
import type { DebtRecord, DebtStatus, FinanceSummary, PaymentPayload, PaymentTransaction } from '../types/payment'

type ActiveTab = 'debts' | 'payments'
type DebtFilter = 'ALL' | 'OPEN' | 'PAID'

const EMPTY_DEBT_PAGE: PageResponse<DebtRecord> = {
  items: [],
  page: 0,
  size: 10,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
}

const EMPTY_PAYMENT_PAGE: PageResponse<PaymentTransaction> = {
  items: [],
  page: 0,
  size: 10,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
}

const EMPTY_FINANCE_SUMMARY: FinanceSummary = {
  openDebtCount: 0,
  totalOpenDebt: 0,
  paidToday: 0,
}

const debtFilters: Array<{ value: DebtFilter; label: string }> = [
  { value: 'OPEN', label: 'Cần thu' },
  { value: 'PAID', label: 'Đã thu đủ' },
  { value: 'ALL', label: 'Tất cả' },
]

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`))
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
}

function debtStatusBadge(status: DebtStatus) {
  if (status === 'PAID') {
    return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
  }
  if (status === 'CANCELLED') {
    return 'border-slate-500/30 bg-[var(--surface-muted)] text-[var(--text-muted)]'
  }
  if (status === 'PARTIALLY_PAID') {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400'
  }
  return 'border-red-500/30 bg-red-500/15 text-red-400'
}

function debtStatusLabel(status: DebtStatus) {
  const labels: Record<DebtStatus, string> = {
    OPEN: 'Cần thu',
    PARTIALLY_PAID: 'Đã thu một phần',
    PAID: 'Đã thu đủ',
    CANCELLED: 'Đã hủy',
  }
  return labels[status]
}

export function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('debts')
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('OPEN')
  const [debtPage, setDebtPage] = useState<PageResponse<DebtRecord>>(EMPTY_DEBT_PAGE)
  const [paymentPage, setPaymentPage] = useState<PageResponse<PaymentTransaction>>(EMPTY_PAYMENT_PAGE)
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>(EMPTY_FINANCE_SUMMARY)
  const [openDebtOptions, setOpenDebtOptions] = useState<DebtRecord[]>([])
  const [vietQrSetting, setVietQrSetting] = useState<VietQrSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [debtData, paymentData, summaryData, vietQrData] = await Promise.all([
        listDebtsPage({
          status: debtFilter === 'ALL' ? undefined : debtFilter,
          keyword,
          page,
          size: pageSize,
        }),
        listPaymentsPage({ keyword, page, size: pageSize }),
        getFinanceSummary(),
        getVietQrSetting().catch(() => null),
      ])
      setDebtPage(debtData)
      setPaymentPage(paymentData)
      setFinanceSummary(summaryData)
      setVietQrSetting(vietQrData)
      const activeResponse = activeTab === 'debts' ? debtData : paymentData
      if (activeResponse.page !== page) {
        setPage(activeResponse.page)
      }
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [activeTab, debtFilter, keyword, page, pageSize])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  async function openPaymentModal(debt: DebtRecord) {
    setSelectedDebt(debt)
    setOpenDebtOptions([debt])
    setFormError(null)
    setPaymentModalOpen(true)
    try {
      setOpenDebtOptions(await listDebts({ status: 'OPEN' }))
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    }
  }

  async function handleCreatePayment(payload: PaymentPayload) {
    setSubmitting(true)
    setFormError(null)
    try {
      await createPayment(payload)
      setPaymentModalOpen(false)
      setSelectedDebt(null)
      await Promise.all([loadData(), listDebts({ status: 'OPEN' }).then(setOpenDebtOptions)])
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  const activePage = activeTab === 'debts' ? debtPage : paymentPage

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* 1. Header Section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Sổ Quỹ Tài Chính • Công Nợ & Thu Tiền
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Thanh Toán & Công Nợ
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            Theo dõi chính xác công nợ hội viên, lập phiếu thu và kiểm tra lịch sử dòng tiền.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface-muted)]"
            title="Làm mới dữ liệu"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </section>

      {/* 2. 3 Telemetry Cards */}
      <section className="grid gap-3.5 sm:grid-cols-3">
        {/* Card 1: Khoản cần thu */}
        <div className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Khoản nợ cần thu
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
              <WalletCards size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
              {financeSummary.openDebtCount}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">hồ sơ nợ</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-500/90">
            Khoản nợ mở hoặc thanh toán một phần
          </p>
        </div>

        {/* Card 2: Tổng còn nợ */}
        <div className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-red-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tổng công nợ mở
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-500">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-red-500 sm:text-3xl">
              {formatMoney(financeSummary.totalOpenDebt)}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-red-400/90">
            Tổng số tiền hội viên chưa thanh toán đủ
          </p>
        </div>

        {/* Card 3: Đã thu hôm nay */}
        <div className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Đã thu hôm nay
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Banknote size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-500 sm:text-3xl">
              {formatMoney(financeSummary.paidToday)}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-emerald-500/90">
            Thực thu ghi nhận trong ngày hôm nay
          </p>
        </div>
      </section>

      {/* 3. Table Container */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm overflow-hidden">
        {/* Top Control Bar: Tabs + Filters + Search */}
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Main Tab Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('debts')
                setPage(0)
              }}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-black transition',
                activeTab === 'debts'
                  ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              <WalletCards size={15} />
              Công nợ ({debtPage.totalItems})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('payments')
                setPage(0)
              }}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-black transition',
                activeTab === 'payments'
                  ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              <History size={15} />
              Lịch sử thu ({paymentPage.totalItems})
            </button>
          </div>

          {/* Right Toolbar: Filter status (if debts) + Search Input */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'debts' ? (
              <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-1">
                {debtFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setDebtFilter(filter.value)
                      setPage(0)
                    }}
                    className={[
                      'rounded-lg px-3 py-1 text-xs font-black transition',
                      debtFilter === filter.value
                        ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                    ].join(' ')}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Search Input */}
            <div className="relative flex h-9 w-full items-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs sm:w-64">
              <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm hội viên, gói tập..."
                className="ml-2 w-full bg-transparent font-semibold text-[var(--text-strong)] placeholder:text-[var(--text-muted)] outline-none"
              />
              {keyword ? (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="rounded-md p-0.5 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400">
            {error}
          </div>
        ) : null}

        {/* Tab Content Table */}
        {activeTab === 'debts' ? (
          <DebtTable debts={debtPage.items} loading={loading} onCollect={(debt) => void openPaymentModal(debt)} />
        ) : (
          <PaymentTable payments={paymentPage.items} loading={loading} />
        )}

        <PaginationFooter
          page={activePage.page}
          size={activePage.size}
          totalItems={activePage.totalItems}
          totalPages={activePage.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(0)
          }}
        />
      </section>

      {/* Payment Form Modal */}
      {paymentModalOpen && selectedDebt ? (
        <PaymentFormModal
          debts={openDebtOptions}
          selectedDebt={selectedDebt}
          vietQrSetting={vietQrSetting}
          submitting={submitting}
          error={formError}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedDebt(null)
          }}
          onSubmit={handleCreatePayment}
        />
      ) : null}
    </div>
  )
}

function DebtTable({
  debts,
  loading,
  onCollect,
}: {
  debts: DebtRecord[]
  loading: boolean
  onCollect: (debt: DebtRecord) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--surface-muted)]/50 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">
            <th className="px-5 py-3">Hội viên</th>
            <th className="px-5 py-3">Gói / Khoản thu</th>
            <th className="px-5 py-3 text-right">Tổng nợ</th>
            <th className="px-5 py-3 text-right">Đã thu</th>
            <th className="px-5 py-3 text-right">Còn nợ</th>
            <th className="px-5 py-3 text-center whitespace-nowrap">Trạng thái</th>
            <th className="px-5 py-3 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-[var(--text-muted)]">
                Đang tải danh sách công nợ...
              </td>
            </tr>
          ) : debts.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 size={20} />
                </span>
                <p className="mt-2 text-sm font-bold text-[var(--text-strong)]">
                  Không có khoản công nợ nào phù hợp
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Toàn bộ công nợ trong phân loại này đã được tất toán hoặc chưa phát sinh.
                </p>
              </td>
            </tr>
          ) : (
            debts.map((debt) => {
              const initial = debt.memberName.charAt(0).toUpperCase()
              const canCollect = debt.remainingAmount > 0 && debt.status !== 'PAID' && debt.status !== 'CANCELLED'

              return (
                <tr key={debt.id} className="transition-colors hover:bg-[var(--surface-muted)]/50">
                  {/* Member Column */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-purple-500/20 text-xs font-black text-amber-400 border border-amber-500/30">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/members/${debt.memberId}`}
                          className="font-black text-sm text-[var(--text-strong)] hover:text-amber-400 transition-colors"
                        >
                          {debt.memberName}
                        </Link>
                        {debt.memberPhone ? (
                          <p className="text-xs font-semibold text-[var(--text-muted)]">{debt.memberPhone}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Plan / Note Column */}
                  <td className="px-5 py-3.5 text-xs font-bold text-[var(--text)]">
                    <span className="line-clamp-2 max-w-xs">{debt.planName ?? 'Khoản thu khác'}</span>
                  </td>

                  {/* Amounts */}
                  <td className="px-5 py-3.5 text-right text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">
                    {formatMoney(debt.originalAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs font-bold text-sky-400 whitespace-nowrap">
                    {formatMoney(debt.paidAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-black text-red-500 whitespace-nowrap">
                    {formatMoney(debt.remainingAmount)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black ${debtStatusBadge(debt.status)}`}>
                      {debtStatusLabel(debt.status)}
                    </span>
                  </td>

                  {/* Action Column: Single, precise 'Thu tiền' button */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {canCollect ? (
                      <button
                        type="button"
                        onClick={() => onCollect(debt)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3.5 text-xs font-black text-white shadow-sm transition hover:scale-[1.03] hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
                        title={`Lập phiếu thu tiền cho ${debt.memberName}`}
                      >
                        <Banknote size={14} className="shrink-0" />
                        <span>Thu tiền</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 whitespace-nowrap">
                        <CheckCircle2 size={13} />
                        Đã thu đủ
                      </span>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function PaymentTable({ payments, loading }: { payments: PaymentTransaction[]; loading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--surface-muted)]/50 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)]">
            <th className="px-5 py-3">Ngày thu</th>
            <th className="px-5 py-3">Hội viên</th>
            <th className="px-5 py-3 text-right">Số tiền thu</th>
            <th className="px-5 py-3 text-center">Phương thức</th>
            <th className="px-5 py-3">Người thu</th>
            <th className="px-5 py-3">Mã công nợ</th>
            <th className="px-5 py-3">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-[var(--text-muted)]">
                Đang tải lịch sử thanh toán...
              </td>
            </tr>
          ) : payments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-[var(--text-muted)]">
                Chưa có giao dịch thanh toán nào được ghi nhận.
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id} className="transition-colors hover:bg-[var(--surface-muted)]/50">
                <td className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)]">
                  {formatDate(payment.paymentDate)}
                </td>
                <td className="px-5 py-3.5 text-xs font-black text-[var(--text-strong)]">
                  {payment.memberName}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-black text-emerald-500">
                  +{formatMoney(payment.amount)}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={payment.paymentMethod === 'BANK_TRANSFER' ? 'inline-flex rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400' : 'inline-flex rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400'}>
                    {paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-[var(--text-strong)]">
                  {payment.createdByName ?? '-'}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)]">
                  {payment.debtRecordId ? (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400 font-bold">
                      #{payment.debtRecordId}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs font-medium text-[var(--text-muted)]">
                  {payment.note ?? '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function PaginationFooter({
  page,
  size,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  size: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  if (totalItems === 0) {
    return null
  }

  const fromIndex = page * size + 1
  const toIndex = Math.min((page + 1) * size, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line)] px-4 py-3 text-xs font-semibold text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị <strong className="text-[var(--text-strong)]">{fromIndex}</strong> -{' '}
          <strong className="text-[var(--text-strong)]">{toIndex}</strong> trên{' '}
          <strong className="text-[var(--text-strong)]">{totalItems}</strong> bản ghi
        </span>
        <label className="flex items-center gap-1.5">
          <span>Số dòng:</span>
          <select
            value={size}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-7 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-2 text-xs font-bold text-[var(--text-strong)] outline-none"
          >
            {[10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 font-bold text-[var(--text)] transition hover:border-amber-400 hover:text-amber-400 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            <span>Trước</span>
          </button>
          <span className="min-w-16 text-center font-bold text-[var(--text-strong)]">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 font-bold text-[var(--text)] transition hover:border-amber-400 hover:text-amber-400 disabled:pointer-events-none disabled:opacity-40"
          >
            <span>Sau</span>
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
