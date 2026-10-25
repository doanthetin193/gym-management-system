import {
  AlertCircle,
  ArrowRight,
  Award,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient'
import { BrandMark } from '../../../shared/components/BrandMark'
import { ThemeToggle } from '../../../shared/components/ThemeToggle'
import { readRememberedEmail, readRememberMePreference } from '../../../shared/lib/authStorage'
import { useAuth } from '../context/authContext'

function formatRetryAfter(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function LoginPage() {
  const { login } = useAuth()
  const [rememberMe, setRememberMe] = useState(() => readRememberMePreference())
  const [email, setEmail] = useState(() => readRememberedEmail() ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lockUntil, setLockUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const retryAfterSeconds = lockUntil ? Math.max(0, Math.ceil((lockUntil - now) / 1000)) : 0
  const lockMessage = `Đăng nhập tạm khóa sau nhiều lần không thành công. Vui lòng thử lại sau ${formatRetryAfter(retryAfterSeconds)}.`

  useEffect(() => {
    if (!lockUntil) {
      return undefined
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    const unlockTimer = window.setTimeout(() => {
      setLockUntil(null)
      setError(null)
    }, Math.max(0, lockUntil - Date.now()))

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(unlockTimer)
    }
  }, [lockUntil])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (retryAfterSeconds > 0) {
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await login(email, password, rememberMe)
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        // [TRUY VẾT RATE LIMIT]: Nếu Backend trả về mã HTTP 429 kèm số giây chờ (retryAfterSeconds),
        // Frontend sẽ tính mốc tương lai lockUntil để kích hoạt đồng hồ đếm ngược thời gian thực trên giao diện.
        if (caughtError.status === 429 && caughtError.retryAfterSeconds) {
          setLockUntil(Date.now() + caughtError.retryAfterSeconds * 1_000)
          setNow(Date.now())
        }
        setError(caughtError.message)
      } else {
        setError('Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản hoặc kết nối.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen lg:h-screen lg:max-h-screen w-full flex-col justify-between overflow-y-auto lg:overflow-hidden bg-[#f6f8fc] text-slate-800 transition-colors duration-300 dark:bg-[#06080d] dark:text-[#f1f3f7]">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blue Orb - Top Left */}
        <div className="animate-float-1 absolute -left-28 -top-28 size-[520px] rounded-full bg-[#087ec1]/15 blur-[120px] dark:bg-[#087ec1]/25" />

        {/* Red Orb - Bottom Right */}
        <div className="animate-float-2 absolute -bottom-28 -right-28 size-[540px] rounded-full bg-[#df271b]/12 blur-[130px] dark:bg-[#df271b]/20" />

        {/* Gold Orb - Center Soft Glow */}
        <div className="animate-float-3 absolute left-1/2 top-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffcc08]/15 blur-[120px] dark:bg-[#ffcc08]/15" />

        {/* Athletic Mesh Background */}
        <div className="gym-mesh-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]" />

        {/* Top Edge Neon Laser Highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffcc08]/60 to-transparent" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 px-5 py-3 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#06080d]/70 md:px-10">
        <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.01]">
          <BrandMark compact />
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            Hệ thống trực tuyến
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://zalo.me/0965193907"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#ffcc08] dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-[#ffcc08]/40 dark:hover:text-white"
          >
            <span className="size-2 rounded-full bg-[#ffcc08]" />
            Hotline Zalo: <span className="font-bold text-[#b45309] dark:text-[#ffcc08]">0965.193.907</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero & Login Section */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 md:px-8 lg:py-4">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          
          {/* Left Column: Clean, Minimalist, Inspiring Gym Branding */}
          <section className="hidden lg:flex flex-col justify-center space-y-6 pr-4">
            {/* Athletic Pill Badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d97706]/30 bg-[#ffcc08]/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#b45309] shadow-sm dark:border-[#ffcc08]/30 dark:bg-[#ffcc08]/15 dark:text-[#ffcc08]">
              <Sparkles size={14} className="text-[#d97706] dark:text-[#ffcc08]" />
              <span>Dương Double Gym</span>
            </div>

            {/* Powerful & Short Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white">
                Bứt Phá Giới Hạn <br />
                <span className="bg-gradient-to-r from-[#d97706] via-[#df271b] to-[#087ec1] dark:from-[#ffcc08] dark:via-[#ff6b4a] dark:to-[#087ec1] bg-clip-text text-transparent">
                  Kiến Tạo Vóc Dáng
                </span>
              </h1>
              <p className="max-w-md text-base leading-relaxed font-medium text-slate-600 dark:text-gray-300">
                Kỷ luật hôm nay • Vóc dáng tự hào ngày mai.
              </p>
            </div>

            {/* 4 Symmetrical Gym Cards in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md dark:border-[#087ec1]/30 dark:bg-[#087ec1]/15 dark:text-gray-200">
                <Dumbbell size={17} className="text-[#087ec1] shrink-0" />
                <span>Tập luyện khoa học</span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md dark:border-[#df271b]/30 dark:bg-[#df271b]/15 dark:text-gray-200">
                <Flame size={17} className="text-[#df271b] shrink-0" />
                <span>Theo sát lộ trình</span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md dark:border-[#ffcc08]/30 dark:bg-[#ffcc08]/15 dark:text-gray-200">
                <Award size={17} className="text-[#d97706] dark:text-[#ffcc08] shrink-0" />
                <span>Kết quả bền vững</span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-gray-200">
                <Zap size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Bứt phá giới hạn</span>
              </div>
            </div>
          </section>

          {/* Right Column: Sleek VIP Glassmorphic Login Card */}
          <div className="relative mx-auto w-full max-w-[420px]">
            {/* Outer Subtle Multi-color Glow Aura */}
            <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#087ec1]/20 via-[#df271b]/20 to-[#ffcc08]/25 blur-lg opacity-70" />

            <section className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-colors duration-300 dark:border-white/[0.12] dark:bg-[#0c1017]/95 dark:shadow-[0_25px_60px_rgba(0,0,0,0.65)] md:p-8">
              {/* Brand Laser Top Accent Line */}
              <div className="animate-laser absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-[#087ec1] via-[#df271b] via-[#ffcc08] to-[#087ec1]" />

              {/* Card Header */}
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Đăng Nhập
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Truy cập hệ thống Dương Double Gym.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#df271b]/30 bg-red-50 p-3 text-xs md:text-sm font-semibold text-red-700 dark:border-[#df271b]/40 dark:bg-[#df271b]/15 dark:text-red-200" role="alert" aria-live="polite">
                  <AlertCircle size={18} className="shrink-0 text-[#df271b]" />
                  <span>{retryAfterSeconds > 0 ? lockMessage : error}</span>
                </div>
              )}

              {/* Login Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email / Phone Input */}
                <label className="block">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                    Email hoặc Số điện thoại
                  </span>
                  <span className="mt-1.5 flex h-12 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-white focus-within:border-[#ffcc08] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ffcc08]/30 dark:border-white/10 dark:bg-[#07090e]/90 dark:text-white dark:hover:border-white/20 dark:hover:bg-[#0c1017] dark:focus-within:border-[#ffcc08] dark:focus-within:bg-[#0c1017] dark:focus-within:ring-[#ffcc08]/25">
                    <Mail size={18} className="text-slate-400 dark:text-gray-400 shrink-0" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@gymduongdouble.com hoặc 0901xxxxxx"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm md:text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-gray-500"
                      autoComplete="username"
                      type="text"
                      required
                    />
                  </span>
                </label>

                {/* Password Input */}
                <label className="block">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                    Mật khẩu
                  </span>
                  <span className="mt-1.5 flex h-12 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-white focus-within:border-[#ffcc08] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ffcc08]/30 dark:border-white/10 dark:bg-[#07090e]/90 dark:text-white dark:hover:border-white/20 dark:hover:bg-[#0c1017] dark:focus-within:border-[#ffcc08] dark:focus-within:bg-[#0c1017] dark:focus-within:ring-[#ffcc08]/25">
                    <Lock size={18} className="text-slate-400 dark:text-gray-400 shrink-0" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm md:text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-gray-500"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-1"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs md:text-sm pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded border-slate-400 bg-white text-[#ffcc08] accent-[#ffcc08] dark:border-gray-600 dark:bg-black"
                    />
                    <span>Duy trì đăng nhập</span>
                  </label>

                  <a
                    href="https://zalo.me/0965193907"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#b45309] hover:underline dark:text-[#ffcc08]"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                {/* VIP Shimmer Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || retryAfterSeconds > 0}
                  className="group relative mt-2 inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#ffcc08] via-[#ffd700] to-[#e6b400] px-4 text-sm md:text-base font-black text-black shadow-[0_4px_25px_rgba(255,204,8,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_6px_30px_rgba(255,204,8,0.5)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {/* Animated Light Sweep Shimmer */}
                  <div className="animate-shimmer pointer-events-none absolute inset-0 -top-1/2 h-[200%] w-14 bg-white/40 blur-sm" />

                  <div className="relative flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                        <span>Đang xác thực...</span>
                      </>
                    ) : retryAfterSeconds > 0 ? (
                      <span>Thử lại sau {formatRetryAfter(retryAfterSeconds)}</span>
                    ) : (
                      <>
                        <span>Đăng Nhập</span>
                        <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom Slim Footer */}
      <footer className="relative z-10 shrink-0 border-t border-slate-200/80 bg-white/70 py-2.5 text-center text-xs text-slate-500 backdrop-blur-md transition-colors duration-300 dark:border-white/[0.05] dark:bg-[#06080d]/80 dark:text-gray-400">
        <p>© 2026 Dương Double Gym Management. Hệ thống vận hành thể hình chuyên nghiệp.</p>
      </footer>
    </div>
  )
}
