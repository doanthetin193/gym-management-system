import type { LucideIcon } from 'lucide-react'

type ComingSoonPageProps = {
  title: string
  description: string
  icon: LucideIcon
  plannedItems: string[]
}

export function ComingSoonPage({ title, description, icon: Icon, plannedItems }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex size-11 items-center justify-center rounded-[8px] bg-[var(--nav-active)] text-[var(--text-strong)]">
              <Icon size={21} />
            </div>
            <h2 className="mt-4 text-2xl font-black text-[var(--text-strong)]">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-black uppercase text-[var(--text-muted)]">
            Sprint sau
          </span>
        </div>
      </section>

      <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5">
        <h3 className="text-base font-black text-[var(--text-strong)]">Dự kiến triển khai</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plannedItems.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-[8px] bg-[var(--surface-muted)] px-3 py-2">
              <span className="size-2 rounded-full bg-[var(--brand-yellow)]" />
              <span className="text-sm font-semibold text-[var(--text)]">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
