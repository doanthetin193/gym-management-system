import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  PieChart,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDaysIso, localIsoDate } from '../../../shared/lib/date'
import { getFinanceReport, getMemberReport, getOwnerDashboard } from '../../dashboard/api/dashboardApi'
import type { FinanceReport, MemberReport, OwnerDashboard } from '../../dashboard/types/dashboard'
import { listMembers, getMemberDetail } from '../../members/api/memberApi'
import type { MemberSummary } from '../../members/types/member'
import { listMembershipPlans } from '../../membership-plans/api/planApi'
import type { MembershipPlan } from '../../membership-plans/types/membershipPlan'
import { listDebts, listPayments } from '../../payments/api/paymentApi'
import { paymentMethodLabels } from '../../payments/types/payment'
import type { DebtRecord, PaymentTransaction } from '../../payments/types/payment'
import { analyzeRetentionRevenue } from '../api/aiAdvisorApi'
import type { AiAdvisorResult } from '../api/aiAdvisorApi'
import { downloadXlsx } from '../lib/xlsxExport'

type SheetConfig = {
  url: string
  token: string
}

const SHEET_CONFIG_KEY = 'gymdd.reports.sheetConfig'

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatCompactMoney(value: number) {
  if (value === 0) return '0 đ'
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${millions % 1 === 0 ? millions : millions.toFixed(2).replace(/\.?0+$/, '')} Tr ₫`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k ₫`
  }
  return `${value} ₫`
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

function currentPeriod() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function readSheetConfig(): SheetConfig {
  try {
    const raw = localStorage.getItem(SHEET_CONFIG_KEY)
    if (!raw) {
      return { url: '', token: '' }
    }
    return JSON.parse(raw) as SheetConfig
  } catch {
    return { url: '', token: '' }
  }
}

function saveSheetConfig(config: SheetConfig) {
  localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config))
}

function lastSixRows(report: FinanceReport | null) {
  if (!report) {
    return []
  }
  const now = currentPeriod()
  return report.rows
    .filter((row) => row.month <= now.month)
    .slice(-6)
}

function memberDistribution(members: MemberSummary[], dashboard: OwnerDashboard | null) {
  const today = localIsoDate()
  const in7Days = addDaysIso(7)

  if (members.length > 0) {
    const expired = members.filter((member) => member.currentMembershipId && member.endDate && member.endDate < today).length
    const expiringSoon = members.filter(
      (member) => member.currentMembershipId && member.endDate && member.endDate >= today && member.endDate <= in7Days
    ).length
    const active = members.filter((member) => member.currentMembershipId && member.endDate && member.endDate > in7Days).length
    const noPackage = Math.max(0, members.length - active - expiringSoon - expired)

    return { total: members.length, active, expiringSoon, expired, noPackage }
  }

  const expiringSoon = dashboard?.expiringSoon ?? 0
  const expired = dashboard?.expired ?? 0
  const active = Math.max(0, (dashboard?.activeMembers ?? 0) - expiringSoon)
  const total = dashboard?.totalMembers ?? 0
  const noPackage = Math.max(0, total - (dashboard?.activeMembers ?? 0) - expired)

  return { total, active, expiringSoon, expired, noPackage }
}

export function ReportsPage() {
  const [period] = useState(currentPeriod)
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null)
  const [financeReport, setFinanceReport] = useState<FinanceReport | null>(null)
  const [memberReport, setMemberReport] = useState<MemberReport | null>(null)
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => readSheetConfig())
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [aiAdvisor, setAiAdvisor] = useState<AiAdvisorResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [dashboardData, financeData, memberData, memberList, planList, debtList, paymentList] = await Promise.all([
        getOwnerDashboard(period),
        getFinanceReport({ year: period.year }),
        getMemberReport(period),
        listMembers(),
        listMembershipPlans(),
        listDebts(),
        listPayments(),
      ])
      setDashboard(dashboardData)
      setFinanceReport(financeData)
      setMemberReport(memberData)
      setMembers(memberList)
      setPlans(planList)
      setDebts(debtList)
      setPayments(paymentList)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải báo cáo.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadReports])

  const distribution = useMemo(() => memberDistribution(members, dashboard), [dashboard, members])
  const financeRows = useMemo(() => lastSixRows(financeReport), [financeReport])
  const maxIncome = Math.max(1, ...financeRows.map((row) => row.income))
  const sixMonthsTotal = financeRows.reduce((sum, row) => sum + row.income, 0)
  const activeDebts = debts.filter((debt) => (debt.status === 'OPEN' || debt.status === 'PARTIALLY_PAID') && debt.remainingAmount > 0)
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0)
  const operatingMembers = distribution.active + distribution.expiringSoon
  const attentionMembers = distribution.expiringSoon + distribution.expired

  const currentMonthPayments = payments.filter((payment) => {
    const date = new Date(payment.paymentDate)
    return date.getFullYear() === period.year && date.getMonth() + 1 === period.month
  })
  const bankTransferTotal = currentMonthPayments
    .filter((payment) => payment.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const cashTotal = currentMonthPayments
    .filter((payment) => payment.paymentMethod === 'CASH')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const currentMonthTotalIncome = bankTransferTotal + cashTotal

  const bankTransferPercent = currentMonthTotalIncome > 0 ? Math.round((bankTransferTotal / currentMonthTotalIncome) * 100) : 0
  const cashPercent = currentMonthTotalIncome > 0 ? 100 - bankTransferPercent : 0

  function handlePrintPdf() {
    window.print()
  }

  function handleSaveSheetConfig(nextConfig: SheetConfig) {
    setSheetConfig(nextConfig)
    saveSheetConfig(nextConfig)
  }

  function exportFullBackup() {
    downloadXlsx(`gym-duong-double-backup-${period.year}-${String(period.month).padStart(2, '0')}.xlsx`, [
      { name: 'Hoi vien', rows: reportRows('members') },
      { name: 'Thanh toan', rows: reportRows('payments') },
      { name: 'Cong no', rows: reportRows('debts') },
      { name: 'Goi tap', rows: reportRows('plans') },
      { name: 'Doanh thu', rows: financeReport?.rows.map((row) => ({ month: row.month, income: row.income })) ?? [] },
    ])
  }

  function reportRows(kind: 'members' | 'payments' | 'debts' | 'plans') {
    return {
      members: members.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        phone: member.phone,
        currentPlanName: member.currentPlanName,
        currentPlanType: member.currentPlanType,
        endDate: member.endDate,
        status: member.currentMembershipStatus,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        memberName: payment.memberName,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        paymentMethod: paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod,
        revenueCategory: payment.revenueCategory,
        note: payment.note,
      })),
      debts: debts.map((debt) => ({
        id: debt.id,
        memberName: debt.memberName,
        planName: debt.planName,
        originalAmount: debt.originalAmount,
        paidAmount: debt.paidAmount,
        remainingAmount: debt.remainingAmount,
        status: debt.status,
      })),
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        planType: plan.planType,
        price: plan.defaultPrice,
        durationDays: plan.durationDays,
        active: plan.active,
      })),
    }[kind]
  }

  function exportXlsx(kind: 'members' | 'payments' | 'debts' | 'plans') {
    const sheetNames = {
      members: 'Hoi vien',
      payments: 'Thanh toan',
      debts: 'Cong no',
      plans: 'Goi tap',
    }
    downloadXlsx(`gym-duong-double-${kind}.xlsx`, [{ name: sheetNames[kind], rows: reportRows(kind) }])
  }

  async function handleAnalyzeAiAdvisor() {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await analyzeRetentionRevenue(period)
      setAiAdvisor(result)
    } catch (analyzeError) {
      setAiError(analyzeError instanceof Error ? analyzeError.message : 'Không thể tạo phân tích AI.')
    } finally {
      setAiLoading(false)
    }
  }

  async function syncGoogleSheet() {
    setSyncMessage(null)
    const config = { url: sheetConfig.url.trim(), token: sheetConfig.token.trim() }
    handleSaveSheetConfig(config)

    if (!config.url || !config.token) {
      setSyncMessage({ text: 'Vui lòng điền đầy đủ Google Apps Script URL và Bảo mật Token trước khi đồng bộ.', success: false })
      return
    }

    try {
      setSyncing(true)
      const details = await Promise.all(members.map((m) => getMemberDetail(m.id)))
      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          token: config.token,
          source: 'gym-management-system',
          payload: {
            generatedAt: new Date().toISOString(),
            period,
            dashboard,
            financeReport,
            memberReport,
            members,
            memberDetails: details,
            membershipPlans: plans,
            debts,
            payments,
          },
        }),
      })
      const responseText = await response.text().catch(() => '')
      if (!response.ok) {
        throw new Error(responseText || `Apps Script trả về HTTP ${response.status}`)
      }
      const trimmedResponse = responseText.trim()
      if (trimmedResponse.startsWith('{')) {
        const parsed = JSON.parse(trimmedResponse) as { success?: boolean; message?: string }
        if (parsed.success === false) {
          throw new Error(parsed.message || 'Apps Script từ chối gói dữ liệu.')
        }
      }
      setSyncMessage({ text: 'Đã gửi gói dữ liệu sang Apps Script thành công. Google Sheet sẽ tự động cập nhật!', success: true })
    } catch (syncError) {
      setSyncMessage({
        text: syncError instanceof Error
          ? syncError.message
          : 'Không gửi được dữ liệu. Hãy kiểm tra URL hoặc quyền truy cập của Web App.',
        success: false,
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Header Bar */}
      <div className="print:hidden flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-yellow)]/35 bg-[var(--brand-yellow)]/10 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-[var(--brand-yellow)]">
              <Sparkles size={12} className="text-[var(--brand-yellow)]" />
              Báo cáo & Phân tích thông minh
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
              Tháng {period.month}/{period.year}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
            Báo cáo & Phân tích vận hành
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
            Theo dõi bức tranh tài chính, tình trạng hội viên, dòng tiền thanh toán và sao lưu dữ liệu toàn diện.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadReports()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-black text-[var(--text-strong)] shadow-sm hover:border-[var(--brand-yellow)]/50 hover:bg-[var(--surface-muted)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            Làm mới
          </button>
          <button
            onClick={handlePrintPdf}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-black text-[var(--text-strong)] shadow-sm hover:border-[var(--brand-yellow)]/50 hover:bg-[var(--surface-muted)] transition-all active:scale-[0.98]"
          >
            <FileText size={15} />
            In / lưu PDF
          </button>
          <button
            onClick={exportFullBackup}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 text-xs font-black text-white shadow-[0_4px_16px_rgba(225,29,72,0.3)] hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <Download size={15} />
            Tải Full Backup XLSX
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section id="report-print-area" className="space-y-5">
        {/* 4 Super-Sleek Compact Telemetry Cards (Height reduced by 50%) */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CompactMetricCard
            icon={Users}
            label="Tổng hội viên"
            value={`${formatNumber(distribution.total)} khách`}
            helper={`${operatingMembers} hoạt động • ${distribution.expiringSoon} sắp hết hạn • ${distribution.expired} hết hạn`}
            iconColor="text-sky-400"
            iconBg="bg-sky-500/15 border-sky-500/30"
            glowColor="rgba(56, 189, 248, 0.5)"
          />
          <CompactMetricCard
            icon={TrendingUp}
            label="Doanh thu tích lũy"
            value={formatMoney(financeReport?.totalIncome)}
            helper={`Tháng này: ${formatMoney(currentMonthTotalIncome)}`}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/15 border-emerald-500/30"
            glowColor="rgba(52, 211, 153, 0.5)"
          />
          <CompactMetricCard
            icon={AlertTriangle}
            label="Công nợ cần thu"
            value={formatMoney(totalDebt || dashboard?.totalDebt)}
            helper={`${activeDebts.length} khoản nợ đang mở`}
            iconColor="text-rose-400"
            iconBg="bg-rose-500/15 border-rose-500/30"
            glowColor="rgba(251, 113, 133, 0.5)"
          />
          <CompactMetricCard
            icon={CalendarDays}
            label="Đăng ký & Gia hạn"
            value={`${formatNumber((memberReport?.newMembers ?? 0) + (memberReport?.renewedMembers ?? 0))} gói`}
            helper={`Kỳ Tháng ${period.month}/${period.year}`}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/15 border-amber-500/30"
            glowColor="rgba(251, 191, 36, 0.5)"
          />
        </div>

        <AiRetentionAdvisorCard
          result={aiAdvisor}
          loading={aiLoading}
          error={aiError}
          onAnalyze={() => void handleAnalyzeAiAdvisor()}
        />

        {/* 2 Flagship Charts Grid */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chart 1: Neon Cyber Donut Chart - Phân bổ trạng thái hội viên (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-10 place-items-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-[0_0_14px_rgba(0,229,255,0.35)]">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[var(--text-strong)] flex items-center gap-2">
                      Phân bổ trạng thái
                      <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse" />
                    </h2>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">Tỷ trọng hội viên theo gói tập</p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                  {distribution.total} hội viên
                </span>
              </div>

              {/* Chart & Legend Content with Two-Way Neon Hover */}
              <div className="mt-5">
                <InteractiveNeonDonutSection distribution={distribution} />
              </div>
            </div>

            {/* Smart Neon Insight Banner */}
            <div className="mt-5 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 flex items-center justify-between gap-3 text-xs font-bold text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]" />
                Tỷ lệ duy trì: <strong className="text-cyan-400 font-black">{distribution.total > 0 ? Math.round((operatingMembers / distribution.total) * 100) : 0}%</strong>
              </span>
              <span className="font-semibold text-right truncate">
                {attentionMembers > 0 ? `Cần chăm sóc ${attentionMembers} khách sắp/đã hết hạn` : '100% hội viên còn hạn ổn định'}
              </span>
            </div>
          </div>

          {/* Chart 2: Neon Electric 6-Month Revenue Bar Chart + Financial Flow (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-10 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[var(--text-strong)] flex items-center gap-2">
                      Doanh thu 6 tháng gần nhất
                      <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse" />
                    </h2>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">Biểu đồ đối soát dòng tiền thực thu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-[var(--brand-yellow)] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    Tổng 6T: {formatMoney(sixMonthsTotal)}
                  </span>
                </div>
              </div>

              {/* Dynamic Modern Electric Neon Bar Chart */}
              <div className="mt-4">
                <ModernNeonRevenueChart rows={financeRows} maxIncome={maxIncome} currentMonth={period.month} />
              </div>
            </div>

            {/* Neon Financial Split Breakdown Strip */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 pt-3.5 border-t border-[var(--line)]">
              <div className="flex items-center justify-between rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 shadow-[0_0_15px_rgba(14,165,233,0.06)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-9 place-items-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_8px_rgba(14,165,233,0.25)] shrink-0">
                    <CreditCard size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">Chuyển khoản (Tháng này)</p>
                    <p className="text-sm font-black text-[var(--text-strong)] truncate">{formatMoney(bankTransferTotal)}</p>
                  </div>
                </div>
                <span className="rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/35 px-2 py-0.5 text-xs font-black shadow-[0_0_8px_rgba(14,165,233,0.25)] shrink-0">
                  {bankTransferPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 shadow-[0_0_15px_rgba(16,185,129,0.06)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.25)] shrink-0">
                    <Banknote size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">Tiền mặt (Tháng này)</p>
                    <p className="text-sm font-black text-[var(--text-strong)] truncate">{formatMoney(cashTotal)}</p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 text-xs font-black shadow-[0_0_8px_rgba(16,185,129,0.25)] shrink-0">
                  {cashPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Central Data Export & Cloud Sync Hub */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-10 place-items-center rounded-xl border border-[var(--brand-yellow)]/30 bg-[var(--brand-yellow)]/10 text-[var(--brand-yellow)] shadow-sm">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-[var(--text-strong)]">Trung tâm Dữ liệu & Đồng bộ Đám mây</h2>
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Xuất file Excel độc lập, tải bản sao lưu toàn hệ thống hoặc tự động đẩy sang Google Sheets
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 shadow-sm">
              <CheckCircle2 size={13} />
              Sẵn sàng xuất file
            </span>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            {/* Quick Export Tiles (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Xuất Excel theo từng danh mục (.xlsx)
                </h3>
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  {plans.filter((p) => p.active).length}/{plans.length} gói niêm yết
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <QuickExportCard
                  icon={Users}
                  title="Danh sách hội viên"
                  count={`${members.length} hồ sơ`}
                  badge="Hồ sơ & Gói"
                  onClick={() => exportXlsx('members')}
                />
                <QuickExportCard
                  icon={CreditCard}
                  title="Lịch sử thu tiền"
                  count={`${payments.length} giao dịch`}
                  badge="Phiếu thu"
                  onClick={() => exportXlsx('payments')}
                />
                <QuickExportCard
                  icon={AlertTriangle}
                  title="Sổ theo dõi công nợ"
                  count={`${activeDebts.length} khoản cần thu • ${debts.length} bản ghi`}
                  badge="Công nợ"
                  onClick={() => exportXlsx('debts')}
                />
                <QuickExportCard
                  icon={Layers}
                  title="Bảng giá gói tập chuẩn"
                  count={`${plans.length} gói niêm yết`}
                  badge="Menu 21 gói"
                  onClick={() => exportXlsx('plans')}
                />
              </div>

              {/* Full Backup Callout */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-red-500 text-white shrink-0 shadow-sm">
                    <Download size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--text-strong)]">Tải trọn gói Toàn Bộ Cơ Sở Dữ Liệu</h4>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Đầy đủ 5 Sheet: Hội viên, Thanh toán, Công nợ, Gói tập, Doanh thu trong 1 file .xlsx
                    </p>
                  </div>
                </div>
                <button
                  onClick={exportFullBackup}
                  className="w-full sm:w-auto shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-black text-white hover:bg-red-700 transition-all shadow-sm active:scale-95"
                >
                  <Download size={14} />
                  Tải Full Backup
                </button>
              </div>
            </div>

            {/* Google Sheets Cloud Sync Panel (5 Cols) */}
            <div className="lg:col-span-5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm">
                    <CloudUpload size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[var(--text-strong)]">Đồng bộ Google Sheets (Apps Script)</h3>
                    <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Tự động đẩy số liệu sang trang tính Google Drive
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                      Web App URL (Apps Script)
                    </label>
                    <input
                      value={sheetConfig.url}
                      onChange={(event) => handleSaveSheetConfig({ ...sheetConfig, url: event.target.value })}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                      Mã bảo mật Token
                    </label>
                    <input
                      value={sheetConfig.token}
                      onChange={(event) => handleSaveSheetConfig({ ...sheetConfig, token: event.target.value })}
                      placeholder="Nhập mã token bí mật..."
                      type="password"
                      className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => void syncGoogleSheet()}
                  disabled={syncing || loading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-sm hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  <RefreshCcw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Đang gửi dữ liệu sang Google Sheet...' : 'Đồng bộ Google Sheet ngay'}
                </button>

                {syncMessage ? (
                  <p className={`text-[11px] font-bold text-center ${syncMessage.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {syncMessage.text}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function AiRetentionAdvisorCard({
  result,
  loading,
  error,
  onAnalyze,
}: {
  result: AiAdvisorResult | null
  loading: boolean
  error: string | null
  onAnalyze: () => void
}) {
  const insight = result?.insight
  const statusStyle = {
    GOOD: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
    WATCH: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
    RISK: 'border-rose-500/35 bg-rose-500/10 text-rose-400',
  }[insight?.healthStatus ?? 'WATCH'] ?? 'border-amber-500/35 bg-amber-500/10 text-amber-400'

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-violet-500/35 bg-violet-500/12 text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.18)]">
            <Sparkles size={21} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-[var(--text-strong)]">AI Cố vấn Giữ chân & Doanh thu</h2>
              {result ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black ${statusStyle}`}>
                  {result.aiGenerated ? 'AI Groq' : 'Rule fallback'} • {insight?.healthStatus ?? 'WATCH'}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--text-muted)]">
              Phân tích dữ liệu tổng hợp đã ẩn danh: không gửi tên, SĐT, Zalo, email, địa chỉ hay giao dịch cá nhân sang AI.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 px-4 text-xs font-black text-white shadow-[0_4px_18px_rgba(139,92,246,0.25)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <Sparkles size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'AI đang phân tích...' : result ? 'Phân tích lại' : 'Phân tích AI'}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
          {error}
        </div>
      ) : null}

      {!result ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <AiEmptyPoint title="Tìm rủi ro mất khách" text="Nhận diện nhóm đã hết hạn, sắp hết hạn, còn nợ hoặc khách PT đang gián đoạn." />
          <AiEmptyPoint title="Tìm cơ hội doanh thu" text="Gợi ý nhóm nên gia hạn, thu công nợ, phục hồi lịch PT hoặc upsell gói phù hợp." />
          <AiEmptyPoint title="Lập kế hoạch 7 ngày" text="AI chuyển dữ liệu tổng hợp thành hành động vận hành cụ thể cho chủ phòng." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AiSummaryTile label="Rủi ro cao" value={`${result.summary.highRiskChurn} khách`} tone="rose" />
            <AiSummaryTile label="Sắp hết hạn" value={`${result.summary.nearExpiryMembers} khách`} tone="amber" />
            <AiSummaryTile label={`Công nợ cần thu (${result.summary.openDebtCount})`} value={formatMoney(result.summary.openDebtAmount)} tone="violet" />
            <AiSummaryTile label="Cơ hội gia hạn" value={formatMoney(result.summary.renewalOpportunityValue)} tone="emerald" />
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/35 p-4">
            <p className="text-sm font-bold leading-relaxed text-[var(--text-strong)]">{insight?.overview}</p>
            {insight?.providerMessage ? (
              <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] font-semibold text-amber-500">
                {insight.providerMessage}
              </p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">{insight?.revenueRiskNote}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <AiInsightList title="Top rủi ro cần xử lý" items={insight?.topRisks ?? []} tone="rose" />
            <AiInsightList title="Cơ hội doanh thu" items={insight?.revenueOpportunities ?? []} tone="emerald" />
            <AiInsightList title="Kế hoạch 7 ngày" items={insight?.actionPlan7Days ?? []} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AiSegmentList title="Nhóm rủi ro hệ thống đã chấm" segments={result.riskSegments} />
            <AiSegmentList title="Nhóm cơ hội nên ưu tiên" segments={result.opportunitySegments} />
          </div>
        </div>
      )}
    </div>
  )
}

function AiEmptyPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/35 p-3">
      <p className="text-xs font-black text-[var(--text-strong)]">{title}</p>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--text-muted)]">{text}</p>
    </div>
  )
}

function AiSummaryTile({ label, value, tone }: { label: string; value: string; tone: 'rose' | 'amber' | 'violet' | 'emerald' }) {
  const color = {
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  }[tone]

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  )
}

function AiInsightList({ title, items, tone }: { title: string; items: string[]; tone: 'rose' | 'emerald' | 'amber' }) {
  const dotColor = {
    rose: 'bg-rose-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
  }[tone]

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/35 p-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs font-semibold text-[var(--text-muted)]">Chưa có khuyến nghị.</p>
        ) : (
          items.map((item) => (
            <div key={item} className="flex gap-2 text-xs font-semibold leading-relaxed text-[var(--text-muted)]">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dotColor}`} />
              <span>{item}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AiSegmentList({ title, segments }: { title: string; segments: AiAdvisorResult['riskSegments'] }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/30 p-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">{title}</h3>
      <div className="mt-3 space-y-2">
        {segments.length === 0 ? (
          <p className="text-xs font-semibold text-[var(--text-muted)]">Không có nhóm đáng chú ý.</p>
        ) : (
          segments.slice(0, 4).map((segment) => (
            <div key={segment.code} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-xs font-black text-[var(--text-strong)]">{segment.label}</p>
                <span className="shrink-0 rounded-full bg-[var(--line)] px-2 py-0.5 text-[10px] font-black text-[var(--text-muted)]">
                  {segment.count} khách
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[var(--text-muted)]">{segment.recommendation}</p>
              {segment.estimatedRevenueAtRisk > 0 ? (
                <p className="mt-1 text-[11px] font-black text-amber-500">
                  Ước tính liên quan: {formatMoney(segment.estimatedRevenueAtRisk)}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function CompactMetricCard({
  icon: Icon,
  label,
  value,
  helper,
  iconColor,
  iconBg,
  glowColor,
}: {
  icon: typeof Users
  label: string
  value: string
  helper: string
  iconColor: string
  iconBg: string
  glowColor: string
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm hover:border-[var(--brand-yellow)]/50 transition-all flex items-center gap-3.5 group">
      {/* Subtle Neon Ambient Glow */}
      <div
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-xl pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: glowColor }}
      />
      <div className={`grid size-11 place-items-center rounded-xl border ${iconBg} ${iconColor} shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--text-muted)] truncate">{label}</p>
        <p className="text-lg font-black text-[var(--text-strong)] tracking-tight leading-tight mt-0.5">{value}</p>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{helper}</p>
      </div>
    </article>
  )
}

type StatusKey = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NO_PACKAGE'

interface StatusSlice {
  key: StatusKey
  label: string
  count: number
  percent: number
  color: string
  glowColor: string
  gradientId: string
  gradientCss: string
  filterId: string
}

function InteractiveNeonDonutSection({
  distribution,
}: {
  distribution: {
    active: number
    expiringSoon: number
    expired: number
    noPackage: number
    total: number
  }
}) {
  const [hoveredKey, setHoveredKey] = useState<StatusKey | null>(null)
  const safeTotal = Math.max(1, distribution.total)

  const items: StatusSlice[] = [
    {
      key: 'ACTIVE',
      label: 'Đang tập',
      count: distribution.active,
      percent: distribution.total > 0 ? (distribution.active / distribution.total) * 100 : 0,
      color: '#00e5ff',
      glowColor: 'rgba(0, 229, 255, 0.9)',
      gradientId: 'neonAquaGrad',
      gradientCss: 'linear-gradient(90deg, #00f5a0 0%, #00e5ff 50%, #00a8ff 100%)',
      filterId: 'neon-glow-aqua',
    },
    {
      key: 'EXPIRING',
      label: 'Sắp hết hạn',
      count: distribution.expiringSoon,
      percent: distribution.total > 0 ? (distribution.expiringSoon / distribution.total) * 100 : 0,
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.9)',
      gradientId: 'neonYellowGrad',
      gradientCss: 'linear-gradient(90deg, #ffe259 0%, #fbbf24 50%, #f59e0b 100%)',
      filterId: 'neon-glow-yellow',
    },
    {
      key: 'EXPIRED',
      label: 'Đã hết hạn',
      count: distribution.expired,
      percent: distribution.total > 0 ? (distribution.expired / distribution.total) * 100 : 0,
      color: '#ff3366',
      glowColor: 'rgba(255, 51, 102, 0.9)',
      gradientId: 'neonRedGrad',
      gradientCss: 'linear-gradient(90deg, #ff0055 0%, #ff3366 50%, #ef4444 100%)',
      filterId: 'neon-glow-red',
    },
    {
      key: 'NO_PACKAGE',
      label: 'Chưa có gói',
      count: distribution.noPackage,
      percent: distribution.total > 0 ? (distribution.noPackage / distribution.total) * 100 : 0,
      color: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.75)',
      gradientId: 'neonSlateGrad',
      gradientCss: 'linear-gradient(90deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)',
      filterId: 'neon-glow-slate',
    },
  ]

  const activeHovered = items.find((item) => item.key === hoveredKey)

  // Donut geometry: thick modern ring with cyber proportions
  const radius = 56
  const circumference = 2 * Math.PI * radius // ≈ 351.858

  // Calculate cumulative arc offsets dynamically
  let accumulatedOffset = 0
  const renderedSlices = items.map((item) => {
    const length = (item.count / safeTotal) * circumference
    const offset = accumulatedOffset
    if (item.count > 0) {
      accumulatedOffset += length
    }
    return {
      ...item,
      length,
      offset,
    }
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      {/* Donut Chart with Neon Glow, Delicate Dashed Orbit & Hollow Center */}
      <div className="relative grid size-52 shrink-0 place-items-center">
        {/* Soft Dynamic Neon Halo Glow behind the chart */}
        <div
          className="absolute inset-2 rounded-full blur-2xl pointer-events-none transition-all duration-500"
          style={{
            backgroundColor: activeHovered ? activeHovered.color : '#00e5ff',
            opacity: activeHovered ? 0.35 : 0.12,
          }}
        />

        <svg className="size-52 -rotate-90 transform overflow-visible" viewBox="0 0 180 180">
          <defs>
            {/* Cyber Neon Glow Filters */}
            <filter id="neon-glow-aqua" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neon-glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neon-glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neon-glow-slate" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glowing Gradients */}
            <linearGradient id="neonAquaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5a0" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#00a8ff" />
            </linearGradient>

            <linearGradient id="neonYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe259" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <linearGradient id="neonRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0055" />
              <stop offset="50%" stopColor="#ff3366" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <linearGradient id="neonSlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Outer Cyber Dashed Orbit Ring */}
          <circle
            cx="90"
            cy="90"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="4 6"
            className="text-cyan-400/40 dark:text-cyan-400/35"
          />

          {/* Inner Tech Micro Accent Orbit */}
          <circle
            cx="90"
            cy="90"
            r="73"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2 10"
            className="text-slate-300/40 dark:text-cyan-400/20"
          />

          {/* Base Thick Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            className="text-slate-100 dark:text-slate-800/70"
          />

          {/* Dynamic Arcs */}
          {renderedSlices.map((slice) => {
            if (slice.count === 0) return null
            const isHovered = hoveredKey === slice.key
            const isOtherHovered = hoveredKey !== null && !isHovered

            return (
              <circle
                key={slice.key}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={`url(#${slice.gradientId})`}
                strokeWidth={isHovered ? 23 : 18}
                strokeDasharray={`${slice.length} ${circumference}`}
                strokeDashoffset={-slice.offset}
                strokeLinecap="round"
                filter={isHovered ? `url(#${slice.filterId})` : undefined}
                className="cursor-pointer transition-all duration-300 ease-out"
                opacity={isOtherHovered ? 0.28 : 1}
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            )
          })}
        </svg>

        {/* Center Hollow Core Disc with Dynamic Percentage & Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <div className="size-24 rounded-full border border-[var(--line)] bg-[var(--surface)]/95 shadow-lg flex flex-col items-center justify-center p-1 transition-all duration-300">
            {activeHovered ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-[var(--text-strong)] tracking-tight leading-none">
                  {activeHovered.count}
                </span>
                <span
                  className="mt-1 text-xs sm:text-sm font-black tracking-tight"
                  style={{
                    color: activeHovered.color,
                    textShadow: `0 0 10px ${activeHovered.glowColor}`,
                  }}
                >
                  {activeHovered.percent.toFixed(1)}%
                </span>
                <span className="mt-0.5 text-[10px] font-bold text-[var(--text-muted)] truncate max-w-[84px] leading-tight">
                  {activeHovered.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,245,160,0.5)] tracking-tight leading-none">
                  {distribution.total}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] leading-tight">
                  <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff]" />
                  Hội viên
                </span>
                <span className="text-[9px] font-medium text-[var(--text-muted)] leading-tight">
                  Tổng số
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend Items List on the right with Neon Progress Bars */}
      <div className="w-full flex-1 min-w-0 space-y-2.5">
        {items.map((item) => {
          const isHovered = hoveredKey === item.key

          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={
                isHovered
                  ? {
                      borderColor: item.color,
                      backgroundColor: `${item.color}15`,
                      boxShadow: `0 0 16px ${item.glowColor}25`,
                    }
                  : undefined
              }
              className={`rounded-xl border p-2.5 sm:p-3 cursor-pointer transition-all duration-200 ${
                isHovered
                  ? 'scale-[1.01]'
                  : 'border-[var(--line)] bg-[var(--surface-muted)]/40 hover:bg-[var(--surface-muted)]/70'
              }`}
            >
              {/* Top Row: Dot + Label and Count + Percentage */}
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-black text-[var(--text-strong)] whitespace-nowrap min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0 shadow-sm transition-all duration-300"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isHovered ? `0 0 14px ${item.glowColor}` : `0 0 6px ${item.glowColor}`,
                    }}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-xs font-black text-[var(--text-strong)] shrink-0 whitespace-nowrap">
                  {item.count} khách{' '}
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    ({item.percent.toFixed(1)}%)
                  </span>
                </span>
              </div>

              {/* Bottom Row: Glowing Tech Neon Progress Bar */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(item.percent > 0 ? 3 : 0, item.percent)}%`,
                    background: item.gradientCss,
                    boxShadow: isHovered ? `0 0 16px ${item.glowColor}` : `0 0 8px ${item.glowColor}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ModernNeonRevenueChart({
  rows,
  maxIncome,
  currentMonth,
}: {
  rows: Array<{ month: number; income: number }>
  maxIncome: number
  currentMonth: number
}) {
  const safeMax = Math.max(1, maxIncome)

  return (
    <div className="space-y-1">
      {/* Chart Canvas with Guide Lines */}
      <div className="relative h-56 w-full pt-2">
        {/* Horizontal Neon Guide Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          <div className="flex items-center gap-2 border-b border-dashed border-amber-500/25 pb-1">
            <span className="text-[10px] font-bold text-amber-500/80 w-16 shrink-0 text-right">
              {formatCompactMoney(safeMax)}
            </span>
            <div className="w-full" />
          </div>
          <div className="flex items-center gap-2 border-b border-dashed border-amber-500/15 pb-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] w-16 shrink-0 text-right">
              {formatCompactMoney(Math.round(safeMax * 0.5))}
            </span>
            <div className="w-full" />
          </div>
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] w-16 shrink-0 text-right">
              0 đ
            </span>
            <div className="w-full" />
          </div>
        </div>

        {/* 6 Bars Container */}
        <div className="relative z-10 ml-18 flex h-full items-end justify-around gap-2 pb-7">
          {rows.map((row) => {
            const isCurrent = row.month === currentMonth
            const ratio = row.income / safeMax
            const heightPercent = row.income > 0 ? Math.max(14, Math.round(ratio * 100)) : 0

            return (
              <div key={row.month} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                {/* Floating Neon Value Badge */}
                <div className="mb-2 shrink-0 transition-all duration-300 group-hover:-translate-y-1">
                  {row.income > 0 ? (
                    <span className="inline-block rounded-md bg-black/80 dark:bg-black/90 backdrop-blur border border-amber-400/80 px-2 py-0.5 text-[11px] font-black text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)] whitespace-nowrap">
                      {formatCompactMoney(row.income)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50">
                      0 đ
                    </span>
                  )}
                </div>

                {/* Cyber Neon Bar Pillar */}
                <div className="relative flex h-36 w-full max-w-[48px] items-end justify-center rounded-t-xl bg-[var(--surface-muted)]/60 border border-[var(--line)]/50 p-1 group-hover:border-amber-400/40 transition-all">
                  {row.income > 0 ? (
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 via-amber-400 to-[#ffe066] shadow-[0_0_20px_rgba(245,158,11,0.65),0_0_6px_rgba(255,224,102,0.8)] transition-all duration-700 ease-out group-hover:brightness-125 relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* White-hot top laser cap */}
                      <div className="absolute top-0 inset-x-0 h-1 rounded-t-lg bg-white/90 shadow-[0_0_8px_#ffffff]" />
                    </div>
                  ) : (
                    <div className="h-1 w-full rounded-full bg-[var(--line)]/80" />
                  )}
                </div>

                {/* Month Label below */}
                <div className="mt-2 text-center">
                  <span
                    className={`inline-block text-xs font-black transition-all ${
                      isCurrent
                        ? 'rounded-md bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/60 px-2 py-0.5 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]'
                    }`}
                  >
                    T{row.month}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function QuickExportCard({
  icon: Icon,
  title,
  count,
  badge,
  onClick,
}: {
  icon: typeof Users
  title: string
  count: string
  badge: string
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3 hover:border-[var(--brand-yellow)]/40 hover:bg-[var(--surface-muted)] transition-all group">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="grid size-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] group-hover:text-[var(--brand-yellow)] group-hover:border-[var(--brand-yellow)]/40 transition-colors shrink-0">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black text-[var(--text-strong)] truncate">{title}</h4>
            <span className="hidden sm:inline-block rounded px-1.5 py-0.2 text-[9px] font-bold bg-[var(--line)]/60 text-[var(--text-muted)] shrink-0">
              {badge}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)]">{count}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="shrink-0 inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs font-black text-[var(--text-strong)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-all shadow-sm active:scale-95"
      >
        <Download size={12} />
        XLSX
      </button>
    </div>
  )
}
