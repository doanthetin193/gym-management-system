import { ChevronRight, Globe2, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { defaultPathForUser, hasAnyRole, isMemberOnly } from '../app/access'
import { appNavItems } from '../app/navigation'
import type { AppNavItem } from '../app/navigation'
import { useAuth } from '../features/auth/context/authContext'
import { BrandMark } from '../shared/components/BrandMark'
import { ThemeToggle } from '../shared/components/ThemeToggle'
import { fixVietnameseMojibake } from '../shared/lib/text'

type NavigationLinkProps = {
  item: AppNavItem
  onNavigate?: () => void
}

const roleLabels: Record<string, string> = {
  OWNER: 'Chủ phòng',
  PT: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
}

function NavigationLink({ item, onNavigate }: NavigationLinkProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-xs md:text-sm font-bold transition-all duration-150',
          isActive
            ? 'bg-[#ffcc08] text-black shadow-[0_4px_16px_rgba(255,204,8,0.25)] font-black'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
        ].join(' ')
      }
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon size={18} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
      {item.status === 'soon' ? (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600 dark:bg-white/10 dark:text-gray-400">
          Sau
        </span>
      ) : (
        <ChevronRight size={14} className="shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      )}
    </NavLink>
  )
}

function UserCard({ onLogout, onNavigate }: { onLogout: () => void; onNavigate?: () => void }) {
  const { user } = useAuth()
  const primaryRole = user?.roles[0] ?? 'USER'
  const roleLabel = roleLabels[primaryRole] ?? primaryRole
  const displayName = fixVietnameseMojibake(user?.fullName)
  const memberOnly = isMemberOnly(user)
  const initials = displayName
    ?.split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="space-y-2">
      {/* Profile Card */}
      <Link
        to={memberOnly ? defaultPathForUser(user) : '/profile'}
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 transition hover:border-[#ffcc08] hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#ffcc08]/50 dark:hover:bg-white/[0.08]"
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ffcc08] to-[#e6b400] text-xs font-black text-black shadow-sm">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs md:text-sm font-bold text-slate-900 transition dark:text-white group-hover:text-[#b45309] dark:group-hover:text-[#ffcc08]">
            {displayName}
          </p>
          <p className="flex items-center gap-1 truncate text-[11px] font-semibold text-slate-500 dark:text-gray-400">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <span>{roleLabel}</span>
          </p>
        </div>
        <ChevronRight size={14} className="text-slate-400 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-gray-400" />
      </Link>

      {/* Utility Action Row: Web khách hàng + Dark/Light Toggle */}
      <div className="flex items-center gap-2">
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#087ec1] hover:bg-white hover:text-[#087ec1] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
          title="Mở website giới thiệu khách hàng"
        >
          <Globe2 size={14} className="text-[#087ec1] dark:text-[#38bdf8]" />
          <span>Web khách hàng</span>
        </Link>

        <ThemeToggle />
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99] dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
      >
        <LogOut size={14} />
        <span>Đăng xuất</span>
      </button>
    </div>
  )
}

export function AppShell() {
  const { logout, user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const visibleNavItems = appNavItems.filter((item) => hasAnyRole(user, item.roles))

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)] transition-colors duration-300">
      {/* Desktop Sidebar: Pinned header & footer, only nav items scroll */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-72 flex-col justify-between border-r border-slate-200/80 bg-white/95 px-4 py-4 text-slate-800 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#07090e] dark:text-white lg:flex overflow-hidden">
        {/* Top: Brand Header (Pinned) */}
        <div className="shrink-0 px-2 pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
          <BrandMark />
        </div>

        {/* Middle: Nav Items (Scrollable Only) */}
        <nav className="my-2 flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar py-1">
          {visibleNavItems.map((item) => (
            <NavigationLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom: Anchored User Card strictly pinned at the bottom */}
        <div className="shrink-0 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
          <UserCard onLogout={logout} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        {/* Mobile Header only (< lg) */}
        <header className="sticky top-0 z-10 flex lg:hidden items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#07090e]/90">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#ffcc08] dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              aria-label="Mở menu"
              title="Mở menu"
            >
              <Menu size={18} />
            </button>
            <BrandMark compact />
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              <Globe2 size={13} className="text-[#087ec1] dark:text-[#38bdf8]" />
              <span className="text-[11px]">Web</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content: Starts flush at the top on desktop! */}
        <main className="flex-1 px-4 py-5 md:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Đóng menu"
            title="Đóng menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(20rem,86vw)] flex-col justify-between border-r border-slate-200/80 bg-white p-5 text-slate-800 shadow-2xl transition-colors duration-300 dark:border-white/10 dark:bg-[#07090e] dark:text-white overflow-hidden">
            <div className="shrink-0 pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
              <BrandMark />
            </div>

            <nav className="my-2 flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar py-1">
              {visibleNavItems.map((item) => (
                <NavigationLink key={item.path} item={item} onNavigate={() => setMobileNavOpen(false)} />
              ))}
            </nav>

            <div className="shrink-0 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <UserCard onLogout={logout} onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

