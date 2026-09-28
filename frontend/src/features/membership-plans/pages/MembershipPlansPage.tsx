import { Dumbbell, Plus, RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { createMembershipPlan, listMembershipPlans } from '../api/planApi'
import { MembershipPlanFormModal } from '../components/MembershipPlanFormModal'
import type { MembershipPlan, MembershipPlanPayload, PlanType } from '../types/membershipPlan'

const planTypeLabels: Record<PlanType, string> = {
  SELF_TRAINING: 'Tự tập',
  PT: 'PT',
  GUIDANCE: 'Giáo án',
  OTHER: 'Khác',
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

function planAccent(planType: PlanType) {
  if (planType === 'PT') {
    return 'bg-metric-red'
  }
  if (planType === 'GUIDANCE') {
    return 'bg-metric-blue'
  }
  if (planType === 'SELF_TRAINING') {
    return 'bg-metric-green'
  }
  return 'bg-metric-yellow'
}

export function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const groupedPlans = useMemo(() => {
    return plans.reduce<Record<PlanType, MembershipPlan[]>>(
      (groups, plan) => {
        groups[plan.planType].push(plan)
        return groups
      },
      {
        SELF_TRAINING: [],
        PT: [],
        GUIDANCE: [],
        OTHER: [],
      },
    )
  }, [plans])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPlans(await listMembershipPlans())
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void loadPlans()
  }, [loadPlans])

  async function handleCreatePlan(payload: MembershipPlanPayload) {
    setSubmitting(true)
    setFormError(null)
    try {
      await createMembershipPlan(payload)
      setFormOpen(false)
      await loadPlans()
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Sprint 2</p>
          <h2 className="mt-1 text-2xl font-black text-[var(--text-strong)]">Bảng giá gói tập</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Quản lý các gói tự tập, giáo án/hướng dẫn và PT chính/PT mới để dùng khi đăng ký hoặc gia hạn cho khách.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadPlans()}
            className="inline-flex size-10 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
            title="Tải lại"
            aria-label="Tải lại"
          >
            <RefreshCcw size={17} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError(null)
              setFormOpen(true)
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95"
          >
            <Plus size={18} />
            Thêm gói
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger-text)]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm font-semibold text-[var(--text-muted)]">
          Đang tải bảng giá gói tập...
        </section>
      ) : (
        (Object.keys(groupedPlans) as PlanType[]).map((planType) => (
          <section key={planType} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[var(--text-strong)]">{planTypeLabels[planType]}</h3>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-black text-[var(--text-muted)]">
                {groupedPlans[planType].length} gói
              </span>
            </div>

            {groupedPlans[planType].length === 0 ? (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--text-muted)]">
                Chưa có gói thuộc nhóm này.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedPlans[planType].map((plan) => (
                  <article key={plan.id} className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`inline-flex size-10 items-center justify-center rounded-[8px] ${planAccent(plan.planType)}`}>
                        <Dumbbell size={18} />
                      </div>
                      <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-black text-[var(--text-muted)]">
                        {plan.active ? 'Đang bán' : 'Tạm ẩn'}
                      </span>
                    </div>
                    <h4 className="mt-4 text-lg font-black text-[var(--text-strong)]">{plan.name}</h4>
                    <p className="mt-2 text-2xl font-black text-[var(--brand-red)]">{formatMoney(plan.defaultPrice)}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <PlanMetric label="Thời hạn" value={plan.durationDays ? `${plan.durationDays} ngày` : '-'} />
                      <PlanMetric label="Nội dung" value={plan.contentAccessLevel} />
                      {plan.planType === 'PT' ? (
                        <>
                          <PlanMetric label="Cấp PT" value={plan.ptLevel === 'MAIN' ? 'PT chính' : 'PT mới'} />
                          <PlanMetric label="PT / Ôn tập" value={`${plan.ptSessionCount ?? 0}/${plan.practiceSessionCount ?? 0}`} />
                        </>
                      ) : null}
                      {plan.planType === 'GUIDANCE' ? (
                        <PlanMetric label="Buổi giáo án" value={`${plan.guidanceSessionCount ?? 0}`} />
                      ) : null}
                    </div>
                    {plan.description ? (
                      <p className="mt-4 text-sm font-semibold leading-6 text-[var(--text-muted)]">{plan.description}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {formOpen ? (
        <MembershipPlanFormModal
          submitting={submitting}
          error={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreatePlan}
        />
      ) : null}
    </div>
  )
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-2">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--text)]">{value}</p>
    </div>
  )
}
