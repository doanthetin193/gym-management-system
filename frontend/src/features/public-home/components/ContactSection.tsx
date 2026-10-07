import { Sparkles, MapPin, Clock, Phone, Mail, Zap, ExternalLink } from 'lucide-react'

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 sm:scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left Column: Direct info */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-black uppercase text-amber-400">
              <Sparkles size={14} />
              <span>Sẵn Sàng Thay Đổi Bản Thân?</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              Ghé Thăm &amp; Trải Nghiệm Cùng DUONG DOUBLE
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Đừng ngần ngại liên hệ hoặc ghé trực tiếp phòng tập để được <strong>Duong Double</strong> kiểm tra
              thể trạng, tư vấn lộ trình và hướng dẫn trải nghiệm chu đáo!
            </p>

            <div className="space-y-4 pt-2">
              {/* Address */}
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-amber-400 shrink-0">
                  <MapPin size={22} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Địa chỉ phòng tập</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    135L Cần Vương, Quy Nhơn Nam, Gia Lai
                  </p>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 shrink-0">
                  <Clock size={22} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Khung giờ mở cửa</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    Sáng: 05:00 - 10:00 &nbsp;|&nbsp; Chiều: 14:00 - 20:00
                  </p>
                </div>
              </div>

              {/* Hotline & Zalo */}
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-amber-400 shrink-0">
                  <Phone size={22} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Hotline &amp; Zalo DUONG DOUBLE</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    <a href="tel:0965193907" className="text-amber-400 hover:underline">
                      0965.19.39.07
                    </a>{' '}
                    <span className="text-xs text-slate-300">(Duong Double)</span>
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-blue-400 shrink-0">
                  <Mail size={22} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Email liên hệ</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    <a href="mailto:duongdoubleacademy@gmail.com" className="hover:underline">
                      duongdoubleacademy@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: CTA Box */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Zap size={22} className="text-amber-400" />
              <span>Đăng Ký Tư Vấn &amp; Tập Thử</span>
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Nhắn tin trực tiếp qua Zalo hoặc Facebook để nhận lịch hẹn test thể lực và tư vấn bài tập tối ưu
              cho thể trạng &amp; mục tiêu của bạn.
            </p>

            <div className="space-y-3">
              {/* Button 1: Zalo */}
              <a
                href="https://zalo.me/0965193907"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg hover:bg-blue-700 transition cursor-pointer"
              >
                <Phone size={18} />
                <span>Nhắn Zalo: 0965.19.39.07 (Duong Double)</span>
              </a>

              {/* Button 2: Facebook */}
              <a
                href="https://www.facebook.com/duongdouble"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-400/40 bg-blue-600/20 py-3.5 text-sm font-bold text-white hover:bg-blue-600/30 transition cursor-pointer"
              >
                <ExternalLink size={16} />
                <span>Facebook: Duong Double (980+ Followers)</span>
              </a>

              {/* Button 3: TikTok */}
              <a
                href="https://www.tiktok.com/@duong.double"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition cursor-pointer"
              >
                <ExternalLink size={15} />
                <span>Kênh TikTok: @duong.double</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
