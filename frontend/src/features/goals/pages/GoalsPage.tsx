import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  Plus,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import {
  createBusinessGoal,
  getBusinessGoalProgress,
  getFinanceReport,
  getMemberReport,
  listBusinessGoals,
} from '../../dashboard/api/dashboardApi'
import type {
  BusinessGoal,
  BusinessGoalCategory,
  BusinessGoalMetric,
  BusinessGoalPayload,
  BusinessGoalProgress,
  FinanceReport,
  MemberReport,
} from '../../dashboard/types/dashboard'

const categoryLabels: Record<BusinessGoalCategory, string> = {
  FINANCE: 'Tài chính',
  SELF_TRAINING_MEMBER: 'Khách tự tập',
  GUIDED_CUSTOMER: 'Khách giáo án',
  NEW_PT_CUSTOMER: 'Khách PT mới',
  MAIN_PT_CUSTOMER: 'Khách PT chính',
  OTHER: 'Khác',
}

const metricLabels: Record<BusinessGoalMetric, string> = {
  REVENUE: 'Doanh thu',
  PROFIT: 'Lợi nhuận',
  CUSTOMER_COUNT: 'Số khách',
  NEW_CUSTOMER_COUNT: 'Khách mới',
  PT_CUSTOMER_COUNT: 'Khách PT',
}

const goalOptions: Array<{ category: BusinessGoalCategory; metricName: BusinessGoalMetric; unit: string }> = [
  { category: 'FINANCE', metricName: 'REVENUE', unit: 'VND' },
  { category: 'FINANCE', metricName: 'PROFIT', unit: 'VND' },
  { category: 'SELF_TRAINING_MEMBER', metricName: 'CUSTOMER_COUNT', unit: 'khách' },
  { category: 'GUIDED_CUSTOMER', metricName: 'CUSTOMER_COUNT', unit: 'khách' },
  { category: 'NEW_PT_CUSTOMER', metricName: 'PT_CUSTOMER_COUNT', unit: 'khách' },
  { category: 'MAIN_PT_CUSTOMER', metricName: 'PT_CUSTOMER_COUNT', unit: 'khách' },
  { category: 'OTHER', metricName: 'CUSTOMER_COUNT', unit: 'khách' },
]

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatNumber(value: number | null | undefined, unit?: string | null) {
  if (unit === 'VND') {
    return formatMoney(value)
  }
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value ?? 0)}${unit ? ` ${unit}` : ''}`
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

const availableYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

export function GoalsPage() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [goals, setGoals] = useState<BusinessGoal[]>([])
  const [progress, setProgress] = useState<BusinessGoalProgress | null>(null)
  const [financeReport, setFinanceReport] = useState<FinanceReport | null>(null)
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    optionIndex: '0',
    targetValue: '',
    actualValueOverride: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedOption = goalOptions[Number(form.optionIndex)] || goalOptions[0]

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [goalData, progressData, financeData, memberData] = await Promise.all([
        listBusinessGoals({ year, month }),
        getBusinessGoalProgress({ year, month }),
        getFinanceReport({ year }),
        getMemberReport({ year, month }),
      ])
      setGoals(goalData)
      setProgress(progressData)
      setFinanceReport(financeData)
      setMemberReport(memberData)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const option = goalOptions[Number(form.optionIndex)]
    const targetValue = Number(form.targetValue)
    const actualValueOverride = form.actualValueOverride ? Number(form.actualValueOverride) : null

    if (!option || Number.isNaN(targetValue)) {
      setError('Vui lòng nhập mục tiêu hợp lệ.')
      return
    }

    const payload: BusinessGoalPayload = {
      year,
      month,
      category: option.category,
      metricName: option.metricName,
      targetValue,
      actualValueOverride,
      unit: option.unit,
      note: form.note || null,
    }

    setSubmitting(true)
    setError(null)
    try {
      await createBusinessGoal(payload)
      setForm({ optionIndex: form.optionIndex, targetValue: '', actualValueOverride: '', note: '' })
      await loadData()
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Title info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-amber-400">
                <Target size={13} className="animate-pulse" />
                Kế hoạch vận hành & KPI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-strong)] tracking-tight">
                Mục tiêu tháng & kết quả thực tế
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] line-clamp-1">
              Theo dõi chỉ tiêu doanh thu, chi phí, lợi nhuận và số lượng khách theo từng nhóm.
            </p>
          </div>

          {/* Period Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Year Dropdown */}
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-amber-400 shrink-0 hidden sm:block" />
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all cursor-pointer"
                title="Chọn năm theo dõi"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm font-bold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all cursor-pointer"
              title="Chọn tháng theo dõi"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Tháng {value} {value === today.getMonth() + 1 && year === today.getFullYear() ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>

            {/* Jump to current month button */}
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => {
                  setYear(today.getFullYear())
                  setMonth(today.getMonth() + 1)
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs sm:text-sm font-black text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all shadow-sm"
                title="Quay về tháng hiện tại"
              >
                <Clock size={14} />
                <span>Tháng này</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 text-xs sm:text-sm font-black text-[var(--text-strong)] hover:border-amber-400/50 hover:bg-[var(--surface)] active:scale-95 transition-all shadow-sm disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin text-amber-400' : ''} />
              <span>{loading ? 'Đang tải...' : 'Tải lại'}</span>
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm font-bold text-red-400 shadow-sm animate-in fade-in">
          {error}
        </div>
      ) : null}

      {/* 3 Metric Cards: Tổng thu năm, Tổng chi năm, Lợi nhuận năm */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CompactMetricCard
          icon={Coins}
          label={`Tổng thu năm ${year}`}
          value={formatMoney(financeReport?.totalIncome)}
          subtext="Doanh thu tích lũy cả năm"
          accent="emerald"
        />
        <CompactMetricCard
          icon={BarChart3}
          label={`Tổng chi năm ${year}`}
          value={formatMoney(financeReport?.totalExpense)}
          subtext="Chi phí vận hành cả năm"
          accent="amber"
        />
        <CompactMetricCard
          icon={(financeReport?.profit ?? 0) >= 0 ? TrendingUp : TrendingDown}
          label={`Lợi nhuận năm ${year}`}
          value={formatMoney(financeReport?.profit)}
          subtext={(financeReport?.profit ?? 0) >= 0 ? 'Kinh doanh có lãi' : 'Đang thâm hụt ngân sách'}
          accent={(financeReport?.profit ?? 0) >= 0 ? 'cyan' : 'rose'}
        />
      </section>

      {/* Core 2-Column: Tạo mục tiêu & Tiến độ thực tế (Tự cân bằng chiều cao để không bị hổng khoảng trống) */}
      <section className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr] items-stretch">
        {/* Form: Tạo mục tiêu tháng */}
        <form
          onSubmit={handleCreateGoal}
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm hover:border-amber-400/30 transition-all flex flex-col justify-between space-y-3"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--line)]">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-strong)]">Tạo mục tiêu tháng</h3>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Chỉ tiêu theo dõi tháng {month}/{year}
                </p>
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Nhóm mục tiêu <span className="text-amber-400">*</span>
                </label>
                <select
                  value={form.optionIndex}
                  onChange={(event) => setForm((current) => ({ ...current, optionIndex: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-semibold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all"
                >
                  {goalOptions.map((option, index) => (
                    <option key={`${option.category}-${option.metricName}`} value={index}>
                      {categoryLabels[option.category]} — {metricLabels[option.metricName]} ({option.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[var(--text-strong)]">
                    Chỉ tiêu cần đạt <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    Đơn vị: {selectedOption.unit}
                  </span>
                </div>
                <input
                  value={form.targetValue}
                  onChange={(event) => setForm((current) => ({ ...current, targetValue: event.target.value }))}
                  type="number"
                  min="0"
                  step="any"
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-semibold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                  placeholder={`Ví dụ: ${selectedOption.unit === 'VND' ? '50000000' : '20'}`}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Thực tế thủ công (tùy chọn)
                </label>
                <input
                  value={form.actualValueOverride}
                  onChange={(event) => setForm((current) => ({ ...current, actualValueOverride: event.target.value }))}
                  type="number"
                  min="0"
                  step="any"
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs sm:text-sm font-semibold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                  placeholder="Bỏ trống nếu để hệ thống tự động tính"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-strong)] block mb-1">
                  Ghi chú / Chiến lược
                </label>
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50 resize-none"
                  placeholder="Ví dụ: Đẩy mạnh telesale khách cũ, ưu đãi gói 6 tháng..."
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-4 text-xs sm:text-sm font-black text-black shadow-md hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 shrink-0"
          >
            <Plus size={16} />
            <span>{submitting ? 'Đang lưu...' : 'Lưu chỉ tiêu mục tiêu'}</span>
          </button>
        </form>

        {/* Right: Tiến độ tháng (Căn chỉnh cân đối không để khoảng trống thừa) */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--line)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <BarChart3 size={17} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-strong)]">
                  Tiến độ tháng {month}/{year}
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  So sánh chỉ tiêu đã đặt với dữ liệu thực tế
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400">
              {progress?.items.length ?? 0} mục tiêu
            </span>
          </div>

          {/* Progress List or Centered Empty State */}
          <div className="flex-1 flex flex-col justify-center min-h-[260px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-6 text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
                Đang tải dữ liệu tiến độ...
              </div>
            ) : !progress || progress.items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)]/40 p-6 text-center space-y-2.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                  <Target size={24} />
                </div>
                <h4 className="text-sm sm:text-base font-black text-[var(--text-strong)]">
                  Chưa có mục tiêu cho tháng {month}/{year}
                </h4>
                <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                  Nhập nhóm mục tiêu và chỉ tiêu cần đạt ở khung bên trái để bắt đầu theo dõi tiến độ vận hành thực tế.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1 custom-scrollbar">
                {progress.items.map((item) => (
                  <CompactProgressCard key={item.goalId} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </section>

      {/* Reports Section: Khách hàng tháng & Dòng tiền năm */}
      <section className="grid gap-4 lg:grid-cols-2 items-stretch">
        {/* Khách hàng tháng */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--line)]">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Users size={17} />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--text-strong)]">Khách hàng tháng {month}</h3>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Phân loại hội viên mới và gói tập trong tháng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 flex-1">
            <CompactReportBox
              label="Khách mới"
              value={memberReport?.newMembers ?? 0}
              icon={UserPlus}
              accent="emerald"
            />
            <CompactReportBox
              label="Gia hạn / Quay lại"
              value={memberReport?.renewedMembers ?? 0}
              icon={UserCheck}
              accent="amber"
            />
            <CompactReportBox
              label="Khách tự tập"
              value={memberReport?.selfTrainingCustomers ?? 0}
              icon={Users}
              accent="cyan"
            />
            <CompactReportBox
              label="Khách giáo án"
              value={memberReport?.guidedCustomers ?? 0}
              icon={Target}
              accent="blue"
            />
            <CompactReportBox
              label="Khách PT mới"
              value={memberReport?.newPtCustomers ?? 0}
              icon={Zap}
              accent="purple"
            />
            <CompactReportBox
              label="Khách PT chính"
              value={memberReport?.mainPtCustomers ?? 0}
              icon={Sparkles}
              accent="rose"
            />
          </div>
        </section>

        {/* Dòng tiền 12 tháng năm */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <CalendarDays size={17} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-strong)]">Dòng tiền năm {year}</h3>
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  Bấm vào từng tháng để xem chi tiết
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 flex-1">
            {financeReport?.rows.map((row) => {
              const isSelected = row.month === month
              const isProfitPositive = row.profit >= 0

              return (
                <div
                  key={row.month}
                  onClick={() => setMonth(row.month)}
                  className={`group cursor-pointer rounded-xl border p-2.5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400/80 bg-amber-500/10 shadow-sm ring-1 ring-amber-400/30'
                      : 'border-[var(--line)] bg-[var(--surface-muted)]/50 hover:border-amber-400/40 hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-black ${isSelected ? 'text-amber-400' : 'text-[var(--text-strong)]'}`}>
                      Tháng {row.month}
                    </span>
                    <span className={`text-[11px] font-black flex items-center ${
                      isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isProfitPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {formatMoney(row.profit)}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                    <div className="flex justify-between">
                      <span>Thu:</span>
                      <span className="text-[var(--text-strong)]">{formatMoney(row.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chi:</span>
                      <span className="text-[var(--text-strong)]">{formatMoney(row.expense)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </section>

      {/* Mục tiêu đã tạo */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Target size={15} />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--text-strong)]">Tất cả mục tiêu đã tạo</h3>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Chi tiết chỉ tiêu thiết lập tháng {month}/{year}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--text-muted)]">
            {goals.length} mục
          </span>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)]/30 p-6 text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
            Chưa có mục tiêu nào được tạo cho tháng {month}/{year}.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3.5 hover:border-amber-400/40 hover:bg-[var(--surface-muted)] transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black uppercase">
                    {categoryLabels[goal.category]}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {metricLabels[goal.metricName]}
                  </span>
                </div>
                <p className="text-lg font-black text-[var(--text-strong)]">
                  {formatNumber(goal.targetValue, goal.unit)}
                </p>
                {goal.note ? (
                  <p className="text-xs font-semibold text-[var(--text-muted)] line-clamp-1 border-t border-[var(--line)] pt-2">
                    {goal.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CompactMetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: typeof Coins
  label: string
  value: string
  subtext: string
  accent: 'emerald' | 'amber' | 'cyan' | 'rose'
}) {
  const accentStyles = {
    emerald: {
      border: 'hover:border-emerald-500/40',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      valueColor: 'text-emerald-400',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      valueColor: 'text-amber-400',
    },
    cyan: {
      border: 'hover:border-cyan-500/40',
      badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      valueColor: 'text-cyan-400',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      valueColor: 'text-rose-400',
    },
  }[accent]

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-200 ${accentStyles.border} hover:shadow-md`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold text-[var(--text-muted)]">{label}</p>
          <p className={`text-xl sm:text-2xl font-black tracking-tight ${accentStyles.valueColor}`}>
            {value}
          </p>
          <p className="text-xs font-semibold text-[var(--text-muted)]">{subtext}</p>
        </div>
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl border ${accentStyles.badge} shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon size={19} />
        </div>
      </div>
    </article>
  )
}

function CompactProgressCard({ item }: { item: NonNullable<BusinessGoalProgress['items'][number]> }) {
  const percent = Math.min(Math.max(item.progressPercent, 0), 100)
  const isCompleted = item.progressPercent >= 100
  const isGood = item.progressPercent >= 70

  const progressColor = isCompleted
    ? 'from-emerald-500 to-teal-400'
    : isGood
      ? 'from-[var(--brand-yellow)] to-amber-500'
      : 'from-cyan-500 to-blue-500'

  const badgeColor = isCompleted
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : isGood
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3.5 hover:border-amber-400/40 hover:bg-[var(--surface-muted)] transition-all space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-black text-sm text-[var(--text-strong)] truncate">
              {categoryLabels[item.category]} — {metricLabels[item.metricName]}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30 shrink-0">
                <CheckCircle2 size={11} /> Đạt
              </span>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            {item.manualActual ? 'Số liệu nhập thủ công' : 'Hệ thống tự tính'}
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-black border ${badgeColor}`}>
          {item.progressPercent}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)] border border-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <span className="text-[var(--text-muted)] truncate">
          Chỉ tiêu: <b className="text-[var(--text-strong)] font-black">{formatNumber(item.targetValue, item.unit)}</b>
        </span>
        <span className="text-[var(--text-muted)] text-right truncate">
          Thực tế: <b className={`font-black ${isCompleted ? 'text-emerald-400' : 'text-[var(--text-strong)]'}`}>
            {formatNumber(item.actualValue, item.unit)}
          </b>
        </span>
      </div>
    </div>
  )
}

function CompactReportBox({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: typeof Users
  accent: 'emerald' | 'amber' | 'cyan' | 'blue' | 'purple' | 'rose'
}) {
  const accentClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[accent]

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3 flex items-center justify-between gap-2 hover:border-white/20 transition-all">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] truncate">{label}</p>
        <p className="text-base font-black text-[var(--text-strong)]">{value}</p>
      </div>
      <div className={`grid size-8 shrink-0 place-items-center rounded-lg border ${accentClasses}`}>
        <Icon size={15} />
      </div>
    </div>
  )
}
