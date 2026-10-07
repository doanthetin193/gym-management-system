import {
  ArrowRight,
  Dumbbell,
  Home,
  Menu,
  Moon,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultPathForUser, isMemberOnly } from '../../../app/access'
import { useAuth } from '../../auth/context/authContext'
import { FacilityGallery } from '../components/FacilityGallery'
import { PricingPackages } from '../components/PricingPackages'
import { PhilosophySection } from '../components/PhilosophySection'
import { ContactSection } from '../components/ContactSection'
import { FooterSection } from '../components/FooterSection'

const zaloUrl = 'https://zalo.me/0965193907'
const THEME_KEY = 'gym_duong_double.theme'

export function HomePage() {
  const [activeSection, setActiveSection] = useState<string>('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  // ScrollSpy for Active Nav Link
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['contact', 'philosophy', 'packages', 'space']
      const scrollPos = window.scrollY + 140
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id)
          return
        }
      }
      setActiveSection('home')
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  function scrollToSection(id: string) {
    setMobileOpen(false)
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.pushState(null, '', '/')
      setActiveSection('home')
      return
    }
    const el = document.getElementById(id)
    if (!el) return
    const headerHeight = 72
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerHeight)
    window.scrollTo({ top, behavior: 'smooth' })
    window.history.pushState(null, '', `/#${id}`)
    setActiveSection(id)
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-slate-900 transition-colors duration-200 dark:bg-[#06070b] dark:text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* ========================================================= */}
      {/* EXACT STICKY HEADER MATCHING LIVE REFERENCE               */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-6 gap-2">
          {/* Brand */}
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 focus:outline-none shrink-0 text-left cursor-pointer"
            aria-label="Trang chủ GYM DUONG DOUBLE"
          >
            <img
              src="/logo-ref.png"
              alt="Logo DUONG DOUBLE"
              className="size-11 sm:size-12 shrink-0 rounded-2xl object-cover shadow-sm"
              onError={(e) => {
                // fallback to /logo.jpg if logo-ref.png is unavailable
                e.currentTarget.src = '/logo.jpg'
              }}
            />
            <div className="leading-tight">
              <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                DUONG DOUBLE
              </p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Gym & Fitness Quy Nhơn
              </p>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden items-center gap-0.5 lg:gap-1.5 md:flex shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className={[
                'whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer',
                activeSection === 'home'
                  ? 'bg-amber-500/15 text-amber-950 border border-amber-500/40 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/50 font-black shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent',
              ].join(' ')}
            >
              <Home size={14} className="shrink-0" />
              <span>Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('space')}
              className={[
                'whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer',
                activeSection === 'space'
                  ? 'bg-amber-500/15 text-amber-950 border border-amber-500/40 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/50 font-black shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent',
              ].join(' ')}
            >
              <span>Không gian & Cơ sở vật chất</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('packages')}
              className={[
                'whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer',
                activeSection === 'packages'
                  ? 'bg-amber-500/15 text-amber-950 border border-amber-500/40 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/50 font-black shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent',
              ].join(' ')}
            >
              <span>Gói tập & Dịch vụ</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('philosophy')}
              className={[
                'whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer',
                activeSection === 'philosophy'
                  ? 'bg-amber-500/15 text-amber-950 border border-amber-500/40 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/50 font-black shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent',
              ].join(' ')}
            >
              <span>Triết lý & Giáo án</span>
            </button>

            <Link
              to="/exercises"
              className="whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent"
            >
              <Play size={14} className="shrink-0 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
              <span>Thư viện Video</span>
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className={[
                'whitespace-nowrap shrink-0 rounded-2xl px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer',
                activeSection === 'contact'
                  ? 'bg-amber-500/15 text-amber-950 border border-amber-500/40 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/50 font-black shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white border border-transparent',
              ].join(' ')}
            >
              <span>Liên hệ</span>
            </button>
          </nav>

          {/* Right Action: Dark Toggle & Admin Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition shrink-0 cursor-pointer"
              aria-label="Đổi chế độ sáng tối"
              title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* QUẢN TRỊ Button */}
            <AuthNavButton />

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white md:hidden cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu"
            />
            <div className="absolute right-0 top-0 h-screen w-[min(20rem,85vw)] border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <img src="/logo-ref.png" alt="Logo" className="size-8 rounded-xl object-cover" />
                  <p className="font-black text-sm text-slate-900 dark:text-white">DUONG DOUBLE</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="size-8 grid place-items-center rounded-lg border border-slate-200 dark:border-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 space-y-1.5">
                {[
                  { label: 'Trang chủ', id: 'home' },
                  { label: 'Không gian & Cơ sở vật chất', id: 'space' },
                  { label: 'Gói tập & Dịch vụ', id: 'packages' },
                  { label: 'Triết lý & Giáo án', id: 'philosophy' },
                  { label: 'Liên hệ', id: 'contact' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    {item.label}
                  </button>
                ))}

                <Link
                  to="/exercises"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Play size={14} className="text-amber-500 fill-amber-500" />
                  <span>Thư viện Video</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="space-y-12 sm:space-y-20 pb-16">
        {/* ========================================================= */}
        {/* HERO SECTION - EXACT COPY OF GYM DUONG DOUBLE LIVE HERO   */}
        {/* ========================================================= */}
        <section
          id="home"
          className="relative overflow-hidden bg-slate-950 text-white min-h-[580px] lg:min-h-[660px] flex items-center"
        >
          {/* Gym photo background */}
          <img
            src="/hero-bg.jpg"
            alt="DUONG DOUBLE GYM Background"
            className="absolute inset-0 h-full w-full object-cover opacity-40 filter brightness-90"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              {/* Brand Logo & Chip */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo-ref.png"
                  alt="Logo DUONG DOUBLE"
                  className="size-14 sm:size-20 rounded-2xl object-cover shadow-2xl border border-white/20 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = '/logo.jpg'
                  }}
                />
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black uppercase text-amber-400">
                    <Sparkles size={13} />
                    GYM · FITNESS · REHAB
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    📍 135L Cần Vương, Quy Nhơn Nam, Gia Lai
                  </p>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                DUONG DOUBLE
                <span className="block text-xl sm:text-3xl lg:text-4xl text-amber-400 font-extrabold mt-1 sm:mt-2">
                  Điểm Khởi Đầu Lý Tưởng Cho Người Mới
                </span>
              </h1>

              {/* Mission Statement */}
              <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-medium">
                Sứ mệnh trang bị cho mỗi cá nhân nền tảng để{' '}
                <strong className="text-amber-400 font-bold">
                  &quot;Làm chủ việc tập luyện&quot;
                </strong>
                . Giúp bạn hoàn toàn tự tập luyện chỉ trong 6 tháng. Biến việc tập luyện trở thành một phần thiết yếu và dễ dàng đến trọn đời!
              </p>

              {/* 3 Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
                <a
                  href="#packages"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('packages')
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 sm:px-6 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-400/20 hover:scale-105 transition active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                  <Dumbbell size={18} className="shrink-0 text-slate-950" />
                  <span className="font-black text-slate-950">Xem 5 Chương Trình & Bảng Giá</span>
                </a>

                <Link
                  to="/exercises"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 sm:px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition w-full sm:w-auto"
                >
                  <Play size={16} className="fill-current" />
                  <span>Thư Viện Video Bài Tập</span>
                </Link>

                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600/90 px-4 sm:px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-600 transition w-full sm:w-auto"
                >
                  <Phone size={16} />
                  <span>Zalo: 0965.19.39.07</span>
                </a>
              </div>

              {/* 4 Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xl font-black text-amber-400">Tự tập 6 Tháng</p>
                  <p className="text-xs text-slate-300 font-semibold">Tự tin làm chủ giáo án</p>
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-400">Thảm Cỏ & Máy Mới</p>
                  <p className="text-xs text-slate-300 font-semibold">Sàn cao su êm ái</p>
                </div>
                <div>
                  <p className="text-xl font-black text-sky-400">Kèm 1-1 Anatomy</p>
                  <p className="text-xs text-slate-300 font-semibold">Hiểu rõ chuyển động cơ</p>
                </div>
                <div>
                  <p className="text-xl font-black text-amber-400">Rehab & Thể thao</p>
                  <p className="text-xs text-slate-300 font-semibold">Cổ vai gáy & Hiệu suất</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: KHÔNG GIAN & CƠ SỞ VẬT CHẤT                     */}
        {/* ========================================================= */}
        <section id="space" className="scroll-mt-14 sm:scroll-mt-18 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-black uppercase text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Sparkles size={13} />
              Không Gian Rèn Luyện Thực Tế
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Không Gian & Cơ Sở Vật Chất
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Phòng tập trang bị máy móc mới, hiện đại, nhập khẩu 100%, sàn cỏ nhân tạo và thảm cao su êm ái.
            </p>
          </div>

          <FacilityGallery />
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: BẢNG GIÁ 5 CHƯƠNG TRÌNH TRỌNG TÂM              */}
        {/* ========================================================= */}
        <PricingPackages scrollToSection={scrollToSection} />

        {/* ========================================================= */}
        {/* SECTION 4: TRIẾT LÝ & GIÁO ÁN                             */}
        {/* ========================================================= */}
        <PhilosophySection />

        {/* ========================================================= */}
        {/* SECTION 5: LIÊN HỆ & ĐỊA CHỈ                              */}
        {/* ========================================================= */}
        <ContactSection />
      </main>

      {/* FOOTER */}
      <FooterSection scrollToSection={scrollToSection} />
    </div>
  )
}

function AuthNavButton() {
  const { user } = useAuth()
  const authTarget = defaultPathForUser(user)
  const memberOnly = isMemberOnly(user)
  const authLabel = user ? (memberOnly ? 'TIẾN TRÌNH' : 'QUẢN TRỊ') : 'QUẢN TRỊ'

  return (
    <Link
      to={user ? authTarget : '/login'}
      className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-400 px-3.5 py-2 text-xs lg:text-sm font-black uppercase tracking-wide text-slate-950 shadow-md hover:opacity-90 transition dark:bg-amber-400 dark:text-slate-950 whitespace-nowrap shrink-0"
    >
      <ShieldCheck size={15} />
      <span>{authLabel}</span>
      <ArrowRight size={14} />
    </Link>
  )
}

