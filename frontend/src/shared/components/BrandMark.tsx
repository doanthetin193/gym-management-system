type BrandMarkProps = {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.jpg"
        alt="Duong Double"
        className={[
          'shrink-0 rounded-[8px] bg-black object-cover shadow-[0_12px_30px_rgba(0,0,0,0.18)]',
          compact ? 'size-11' : 'size-14',
        ].join(' ')}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase leading-none tracking-[0.08em] text-[var(--brand-yellow)]">
          Duong Double
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-[var(--text-muted)]">
          Gym Management
        </p>
      </div>
    </div>
  )
}
