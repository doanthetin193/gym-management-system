import { CreditCard, Dumbbell, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../../auth/context/authContext'

const metrics = [
  { label: 'Auth', value: 'Đã kết nối', icon: ShieldCheck, tone: 'blue' },
  { label: 'Member API', value: 'Sẵn sàng', icon: Users, tone: 'red' },
  { label: 'Membership', value: 'Sẵn sàng', icon: Dumbbell, tone: 'yellow' },
  { label: 'Payment', value: 'Sẵn sàng', icon: CreditCard, tone: 'green' },
]

const nextSteps = [
  'Hoàn thiện cập nhật thông tin khách hàng',
  'Bổ sung lọc khách sắp hết hạn và đã hết hạn',
  'Chuẩn hóa flow gia hạn gói tập',
  'Dựng màn hình danh sách và chi tiết khách hàng',
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Sprint 1</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--text-strong)]">
              Xin chào, {user?.fullName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Frontend hiện đã nối được auth backend. Các màn hình nghiệp vụ sẽ được mở dần theo từng lát Sprint 2.
            </p>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Vai trò</p>
            <p className="mt-1 text-lg font-black text-[var(--brand-yellow)]">{user?.roles.join(', ')}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className={`inline-flex size-10 items-center justify-center rounded-[8px] bg-metric-${metric.tone}`}>
                <Icon size={19} />
              </div>
              <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">{metric.label}</p>
              <p className="mt-1 text-xl font-black text-[var(--text-strong)]">{metric.value}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="text-base font-black text-[var(--text-strong)]">Backend đã có trong Sprint 1</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {['Login JWT', 'Current user API', 'RBAC OWNER', 'Member API', 'Membership API', 'Payment API'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] bg-[var(--surface-muted)] px-3 py-2">
                <span className="size-2 rounded-full bg-[var(--brand-blue)]" />
                <span className="text-sm font-semibold text-[var(--text)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="text-base font-black text-[var(--text-strong)]">Tiếp theo</h3>
          <div className="mt-4 space-y-3">
            {nextSteps.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--brand-yellow)] text-xs font-black text-black">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm font-semibold leading-5 text-[var(--text)]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
