import { Bell, ChevronRight, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { appNavItems } from '../app/navigation'
import type { AppNavItem } from '../app/navigation'
import { useAuth } from '../features/auth/context/authContext'
import { BrandMark } from '../shared/components/BrandMark'
import { ThemeToggle } from '../shared/components/ThemeToggle'

type NavigationLinkProps = {
  item: AppNavItem
  onNavigate?: () => void
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
          'flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-left text-sm font-semibold transition',
          isActive
            ? 'bg-[var(--nav-active)] text-[var(--text-strong)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]',
        ].join(' ')
      }
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon size={18} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
      {item.status === 'soon' ? (
        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-muted)]">
          Sau
        </span>
      ) : (
        <ChevronRight size={16} className="shrink-0" />
      )}
    </NavLink>
  )
}

export function AppShell() {
  const { logout, user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const primaryRole = user?.roles[0] ?? 'USER'

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-[var(--line)] bg-[var(--sidebar)] px-4 py-5 lg:block">
        <BrandMark />

        <nav className="mt-8 space-y-1">
          {appNavItems.map((item) => (
            <NavigationLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Phiên đăng nhập</p>
          <p className="mt-2 truncate text-sm font-bold text-[var(--text-strong)]">{user?.fullName}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Role: {primaryRole}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--danger)] text-sm font-bold text-white transition hover:brightness-95"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--topbar)]/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] lg:hidden"
                aria-label="Mở menu"
                title="Mở menu"
              >
                <Menu size={18} />
              </button>
              <div className="lg:hidden">
                <BrandMark compact />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Dương Double</p>
                <h1 className="text-xl font-black text-[var(--text-strong)]">Bảng điều khiển vận hành</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition hover:border-[var(--brand-blue)] hover:text-[var(--text-strong)]"
                title="Thông báo"
                aria-label="Thông báo"
              >
                <Bell size={18} />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Đóng menu"
            title="Đóng menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] border-r border-[var(--line)] bg-[var(--sidebar)] px-4 py-5 shadow-2xl">
            <BrandMark />
            <nav className="mt-8 space-y-1">
              {appNavItems.map((item) => (
                <NavigationLink key={item.path} item={item} onNavigate={() => setMobileNavOpen(false)} />
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="absolute inset-x-4 bottom-5 inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[var(--danger)] text-sm font-bold text-white transition hover:brightness-95"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
