import { AlertCircle, ArrowRight, Lock, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { BrandMark } from '../../../shared/components/BrandMark'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { useAuth } from '../context/authContext'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('owner')
  const [password, setPassword] = useState('change_me')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(username, password)
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        setError(caughtError.message)
      } else {
        setError('Không thể đăng nhập. Vui lòng thử lại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--login-bg)] text-[var(--text)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-4 md:px-8">
          <BrandMark />
          <ThemeToggle />
        </header>

        <main className="grid flex-1 place-items-center px-5 py-8">
          <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section className="hidden lg:block">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold uppercase text-[var(--text-muted)]">
                  <span className="size-2 rounded-full bg-[var(--brand-yellow)]" />
                  Gym nhỏ, dữ liệu rõ, vận hành gọn
                </div>
                <h1 className="mt-6 max-w-lg text-5xl font-black leading-[1.03] text-[var(--text-strong)]">
                  Quản lý phòng gym Dương Double
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-muted)]">
                  Sprint đầu tiên tập trung vào đăng nhập, bảo vệ phiên làm việc và khung vận hành cho chủ phòng.
                </p>
                <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                  <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
                    <p className="text-2xl font-black text-[var(--brand-blue)]">JWT</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Auth API</p>
                  </div>
                  <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
                    <p className="text-2xl font-black text-[var(--brand-red)]">RBAC</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Theo role</p>
                  </div>
                  <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-4">
                    <p className="text-2xl font-black text-[var(--brand-yellow)]">API</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Spring Boot</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.10)] md:p-6">
              <div>
                <p className="text-sm font-bold uppercase text-[var(--brand-blue)]">Đăng nhập hệ thống</p>
                <h2 className="mt-2 text-2xl font-black text-[var(--text-strong)]">Chào mừng trở lại</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Dùng tài khoản OWNER đã seed từ backend để vào dashboard.
                </p>
              </div>

              {error ? (
                <div className="mt-5 flex gap-3 rounded-[8px] border border-[var(--danger-line)] bg-[var(--danger-soft)] p-3 text-sm font-semibold text-[var(--danger-text)]">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-strong)]">Tên đăng nhập</span>
                  <span className="mt-2 flex h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-[var(--text)] focus-within:border-[var(--brand-blue)]">
                    <UserRound size={18} className="text-[var(--text-muted)]" />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                      autoComplete="username"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-[var(--text-strong)]">Mật khẩu</span>
                  <span className="mt-2 flex h-11 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--input-bg)] px-3 text-[var(--text)] focus-within:border-[var(--brand-blue)]">
                    <Lock size={18} className="text-[var(--text-muted)]" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                      type="password"
                      autoComplete="current-password"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand-yellow)] px-4 text-sm font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
