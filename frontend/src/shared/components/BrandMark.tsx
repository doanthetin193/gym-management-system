type BrandMarkProps = {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <img
          src="/logo.jpg"
          alt="Duong Double"
          className={[
            'rounded-xl bg-black object-cover ring-1 ring-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition group-hover:ring-[#ffcc08]/50',
            compact ? 'size-10' : 'size-12',
          ].join(' ')}
        />
        <div className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-r from-[#087ec1]/40 via-[#df271b]/40 to-[#ffcc08]/40 blur-[4px] opacity-70" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase leading-none tracking-[0.08em] text-[#d97706] dark:text-[#ffcc08]">
          Duong Double
        </p>
        <p className="mt-1 truncate text-xs font-bold text-gray-500 dark:text-gray-400">
          Gym Management
        </p>
      </div>
    </div>
  )
}
