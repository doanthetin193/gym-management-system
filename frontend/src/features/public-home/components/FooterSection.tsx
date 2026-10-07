import { ExternalLink, Play, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FooterSectionProps {
  scrollToSection: (id: string) => void
}

export function FooterSection({ scrollToSection }: FooterSectionProps) {
  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Intro */}
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <img
                src="/logo.jpg"
                alt="DUONG DOUBLE"
                className="size-9 rounded-full object-cover ring-2 ring-amber-400/40"
                onError={(e) => {
                  e.currentTarget.src = '/logo.jpg'
                }}
              />
              <div className="leading-tight">
                <p className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  DUONG DOUBLE
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Gym &amp; Fitness Quy Nhơn
                </p>
              </div>
            </button>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Phòng tập Gym &amp; Fitness thân thiện, thoải mái và hiện đại lý tưởng cho người mới tại Quy
              Nhơn. Triết lý <em>&quot;Sức khỏe không có đặc quyền&quot;</em> – hướng dẫn tận tâm để bạn tự
              tin làm chủ con đường tự tập luyện độc lập!
            </p>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mở cửa: 05:00 - 10:00 &amp; 14:00 - 20:00</span>
            </div>
          </div>

          {/* Column 2: Dịch Vụ Tại Phòng */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Dịch vụ tại phòng
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• Kèm riêng PT 1-1 Cá nhân hoá</li>
              <li>• Kèm đôi PT 1-2 &amp; Nhóm nhỏ 1-3</li>
              <li>• Giáo án có sổ theo dõi tiến độ chi tiết</li>
              <li>• Khắc phục đau mỏi cổ vai gáy &amp; cột sống</li>
              <li>• Hội viên tự tập linh hoạt mọi khung giờ</li>
              <li>• Thư viện Video chuẩn form miễn phí</li>
            </ul>
          </div>

          {/* Column 3: Kết Nối Với Duong Double */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Kết nối với DUONG DOUBLE
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.facebook.com/duongdouble"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  <ExternalLink size={14} />
                  <span>Facebook: Duong Double</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@duong.double"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition font-semibold"
                >
                  <ExternalLink size={14} />
                  <span>TikTok: @duong.double</span>
                </a>
              </li>
              <li>
                <Link
                  to="/exercises"
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition font-semibold"
                >
                  <Play size={14} className="text-amber-500 fill-amber-500" />
                  <span>Thư viện Video bài tập</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 hover:text-amber-500 dark:hover:text-amber-400 transition font-bold text-slate-800 dark:text-slate-200"
                >
                  <LogIn size={14} />
                  <span>Cổng Đăng nhập Quản lý</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Thông Tin Liên Hệ */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Thông tin liên hệ
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Địa chỉ:</strong> 135L Cần Vương, Quy Nhơn
              Nam, Gia Lai
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Hotline / Zalo:</strong>{' '}
              <a
                href="tel:0965193907"
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                0965.19.39.07
              </a>{' '}
              <span className="text-xs text-slate-400">(Duong Double)</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Email:</strong>{' '}
              <a href="mailto:duongdoubleacademy@gmail.com" className="hover:underline">
                duongdoubleacademy@gmail.com
              </a>
            </p>
            <div className="pt-1 flex items-center gap-2">
              <a
                href="https://zalo.me/0965193907"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
              >
                <span>Nhắn Zalo: 0965.19.39.07</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-slate-200/80 pt-6 text-center text-xs sm:text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} GYM DUONG DOUBLE. All rights reserved.</p>
          <p>135L Cần Vương, Quy Nhơn Nam, Gia Lai • Duong Double</p>
        </div>
      </div>
    </footer>
  )
}
