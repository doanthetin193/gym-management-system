import { useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, CreditCard, Dumbbell } from 'lucide-react'
import { apiGet } from '../../../shared/api/apiClient'
import { getVietQrSetting } from '../../settings/api/settingsApi'
import { buildVietQrImageUrl } from '../../settings/lib/vietQr'
import type { VietQrSetting } from '../../settings/types/settings'

type PlanType = 'SELF_TRAINING' | 'PT' | 'GUIDANCE' | 'OTHER'
type PublicPlan = {
  id: number
  name: string
  planType: PlanType
  durationDays: number | null
  price: number | null
  ptSessionCount: number | null
  practiceSessionCount: number | null
  guidanceSessionCount: number | null
  description: string | null
}

const groups: { type: PlanType; label: string }[] = [
  { type: 'SELF_TRAINING', label: 'Tự tập' },
  { type: 'PT', label: 'Huấn luyện cá nhân' },
  { type: 'GUIDANCE', label: 'Hướng dẫn' },
  { type: 'OTHER', label: 'Gói khác' },
]

export function PricingPackages({ scrollToSection }: { scrollToSection: (id: string) => void }) {
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [payment, setPayment] = useState<VietQrSetting | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiGet<PublicPlan[]>('/v1/public/membership-plans')
      .then((data) => { if (!cancelled) setPlans(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    getVietQrSetting()
      .then((data) => { if (!cancelled) setPayment(data) })
      .catch(() => { if (!cancelled) setPayment(null) })
    return () => { cancelled = true }
  }, [])

  const qrUrl = payment ? buildVietQrImageUrl({ setting: payment, addInfo: payment.transferPrefix }) : ''

  async function copyAccount() {
    if (!payment?.accountNumber || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(payment.accountNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="packages" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1 text-xs font-bold uppercase text-amber-600">
          <Dumbbell size={15} /> Dương Double Gym
        </span>
        <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Gói tập & dịch vụ</h2>
      </div>

      {loading ? <p className="mt-8 text-center text-sm text-slate-500">Đang tải bảng giá...</p> : null}
      {error ? <p role="alert" className="mt-8 text-center text-sm text-red-600">Không thể tải bảng giá. Vui lòng liên hệ phòng gym.</p> : null}
      {!loading && !error && plans.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">Hiện chưa có gói tập đang mở bán.</p> : null}

      {!loading && !error && groups.map((group) => {
        const items = plans.filter((plan) => plan.planType === group.type)
        if (!items.length) return null
        return (
          <div key={group.type} className="mt-9">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{group.label}</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((plan) => (
                <article key={plan.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  <p className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">
                    {plan.price == null ? 'Liên hệ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(plan.price)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {[plan.durationDays ? `${plan.durationDays} ngày` : null,
                      plan.ptSessionCount ? `${plan.ptSessionCount} buổi PT` : null,
                      plan.practiceSessionCount ? `${plan.practiceSessionCount} buổi ôn tập` : null,
                      plan.guidanceSessionCount ? `${plan.guidanceSessionCount} buổi hướng dẫn` : null].filter(Boolean).join(' · ')}
                  </p>
                  {plan.description ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p> : null}
                  <button type="button" onClick={() => scrollToSection('contact')} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-blue-600 dark:text-blue-400">
                    Liên hệ đăng ký <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        )
      })}

      {qrUrl && payment ? (
        <div className="mt-10 flex flex-col items-center gap-5 border-t border-slate-200 pt-8 dark:border-white/10 sm:flex-row sm:justify-center">
          <img src={qrUrl} alt="Mã VietQR của phòng gym" className="h-44 w-44 rounded-lg bg-white object-contain" />
          <div className="text-center sm:text-left">
            <p className="flex items-center justify-center gap-2 font-bold text-slate-900 dark:text-white sm:justify-start"><CreditCard size={18} /> Thông tin chuyển khoản</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{payment.bankName || payment.bankCode} · {payment.accountName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{payment.accountNumber}</p>
            <button type="button" onClick={() => void copyAccount()} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Đã sao chép' : 'Sao chép số tài khoản'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
