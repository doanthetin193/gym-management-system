import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Award,
  Flame,
  Trophy,
  Activity,
  CheckCircle2,
  ArrowRight,
  Crown,
  HeartPulse,
  QrCode,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react'
import { getVietQrSetting } from '../../settings/api/settingsApi'
import { buildVietQrImageUrl } from '../../settings/lib/vietQr'
import type { VietQrSetting } from '../../settings/types/settings'

export type ProgramKey = 'tu-tap' | 'day-gym' | 'tang-co' | 'the-thao' | 'tri-lieu'

interface PricingPackagesProps {
  scrollToSection: (id: string) => void
}

const DEFAULT_PAYMENT = {
  enabled: true,
  bankCode: 'MB',
  bankName: 'MBBank - Quân đội',
  accountNumber: '0965193907',
  accountName: 'DUONG CONG LAI',
  transferPrefix: 'GYMDD',
  template: 'compact2',
}

export function PricingPackages({ scrollToSection }: PricingPackagesProps) {
  const [activeTab, setActiveTab] = useState<ProgramKey>('tu-tap')
  const [paymentInfo, setPaymentInfo] = useState<Partial<VietQrSetting>>(DEFAULT_PAYMENT)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getVietQrSetting()
      .then((res) => {
        if (res && res.accountNumber) {
          setPaymentInfo({
            enabled: res.enabled,
            bankCode: res.bankCode || DEFAULT_PAYMENT.bankCode,
            bankName: res.bankName || DEFAULT_PAYMENT.bankName,
            accountNumber: res.accountNumber || DEFAULT_PAYMENT.accountNumber,
            accountName: res.accountName || DEFAULT_PAYMENT.accountName,
            transferPrefix: res.transferPrefix || DEFAULT_PAYMENT.transferPrefix,
            template: res.template || DEFAULT_PAYMENT.template,
          })
        }
      })
      .catch(() => {
        // Fallback to default
      })
  }, [])

  const handleCopyAccount = () => {
    const acc = paymentInfo.accountNumber || DEFAULT_PAYMENT.accountNumber
    if (navigator.clipboard) {
      navigator.clipboard.writeText(acc)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection('contact')
  }

  const tabs = [
    { key: 'tu-tap' as ProgramKey, label: '1. Tự Tập & VIP', icon: Dumbbell },
    { key: 'day-gym' as ProgramKey, label: '2. Dạy Gym Cá Nhân', icon: Award },
    { key: 'tang-co' as ProgramKey, label: '3. Tăng Cơ - Giảm Mỡ', icon: Flame },
    { key: 'the-thao' as ProgramKey, label: '4. Hiệu Suất Thể Thao', icon: Trophy },
    { key: 'tri-lieu' as ProgramKey, label: '5. Cổ Vai Gáy (Rehab)', icon: Activity },
  ]

  const activeBank = paymentInfo.bankCode || DEFAULT_PAYMENT.bankCode
  const activeBankName = paymentInfo.bankName || DEFAULT_PAYMENT.bankName
  const activeAcc = paymentInfo.accountNumber || DEFAULT_PAYMENT.accountNumber
  const activeName = paymentInfo.accountName || DEFAULT_PAYMENT.accountName
  const activePrefix = paymentInfo.transferPrefix || DEFAULT_PAYMENT.transferPrefix
  const activeTemplate = paymentInfo.template || DEFAULT_PAYMENT.template

  const qrUrl =
    buildVietQrImageUrl({
      setting: {
        enabled: true,
        bankCode: activeBank,
        bankName: activeBankName,
        accountNumber: activeAcc,
        accountName: activeName,
        transferPrefix: activePrefix,
        template: activeTemplate,
      },
      addInfo: activePrefix,
    }) ||
    `https://img.vietqr.io/image/${activeBank}-${activeAcc}-${activeTemplate}.png?accountName=${encodeURIComponent(
      activeName
    )}&addInfo=${encodeURIComponent(activePrefix)}`

  return (
    <section id="packages" className="scroll-mt-20 sm:scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
          <Dumbbell size={14} />
          5 Chương Trình Trọng Tâm
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Bảng Giá Gói Tập & Dịch Vụ Chính Thức
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Chương trình được thiết kế chuẩn mực, minh bạch học phí và tối ưu cho từng nhu cầu rèn luyện.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 justify-start sm:justify-center no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/25'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {/* ========================================================= */}
        {/* TAB 1: TỰ TẬP & VIP                                       */}
        {/* ========================================================= */}
        {activeTab === 'tu-tap' && (
          <div className="grid gap-6 md:grid-cols-2 transition-all">
            {/* GÓI TỰ TẬP THƯỜNG */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    Chương trình Tự Tập
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Tiết kiệm & Linh hoạt
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Gói Tự Tập</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Chủ động thời gian, máy móc mới, hiện đại, nhập khẩu 100%.
                </p>

                <div className="mt-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-white/5 pt-4">
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Không giới hạn số buổi trong tháng</span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Hỗ trợ kĩ thuật máy móc ban đầu</span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Tư vấn &quot;Tập Luyện và Dinh Dưỡng&quot; vào cuối tuần</span>
                  </p>
                </div>

                <div className="mt-6 space-y-2.5 bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    BẢNG HỌC PHÍ TỰ TẬP:
                  </p>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200/50 dark:border-white/5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Full 1 Tháng:</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">300.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200/50 dark:border-white/5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Full 2 Tháng:</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">560.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200/50 dark:border-white/5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Full 4 Tháng:</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">1.000.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Full 6 Tháng:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                      1.320.000 đ
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <span>Đăng Ký Gói Tự Tập</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* GÓI TỰ TẬP VIP */}
            <div className="rounded-3xl border-2 border-amber-400 bg-slate-950 text-white p-6 sm:p-8 shadow-2xl shadow-amber-400/10 flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 rounded-full bg-amber-400 text-slate-950 px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                <Crown size={14} /> GÓI TỰ TẬP VIP
              </span>

              <div>
                <span className="rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  Có Giáo Án & Sổ Theo Dõi
                </span>
                <h3 className="mt-3 text-2xl font-black text-white">Gói Tự Tập VIP</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Dành cho học viên muốn tự tập nhưng có lộ trình giáo án khoa học chuẩn mực.
                </p>

                <div className="mt-5 space-y-2 text-xs sm:text-sm text-slate-200 border-t border-white/10 pt-4">
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Bao gồm Gói tự tập</span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Sử dụng sổ &quot;Buổi Tập Mẫu&quot;</span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Tặng File/Sổ Theo Dõi Tập Luyện</span>
                  </p>
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Tặng File &quot;Gym Căn Bản&quot;</span>
                  </p>
                </div>

                <div className="mt-6 space-y-2.5 bg-white/[0.06] p-4 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold uppercase text-amber-400">BẢNG HỌC PHÍ TỰ TẬP VIP:</p>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                    <span className="font-semibold text-slate-200">Full 1 Tháng:</span>
                    <span className="font-black text-white text-base">640.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                    <span className="font-semibold text-slate-200">Full 2 Tháng:</span>
                    <span className="font-black text-white text-base">1.160.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                    <span className="font-semibold text-slate-200">Full 4 Tháng:</span>
                    <span className="font-black text-white text-base">2.080.000 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="font-semibold text-slate-200">Full 6 Tháng:</span>
                    <span className="font-black text-amber-400 text-base">2.760.000 đ</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-black w-full py-3.5 text-sm flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-amber-400/20 transition cursor-pointer"
                >
                  <span>Đăng Ký Gói Tự Tập VIP</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DẠY GYM CÁ NHÂN                                     */}
        {/* ========================================================= */}
        {activeTab === 'day-gym' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-white/10 dark:bg-slate-900 transition-all">
            <div className="max-w-3xl space-y-3">
              <span className="rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-3.5 py-1 text-xs font-black uppercase">
                Chương Trình Kèm Cặp 1-1
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chương Trình &quot;Dạy Gym Cá Nhân&quot;
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Trang bị kiến thức khoa học thể hình chuẩn mực, giúp bạn làm chủ cơ thể và hoàn toàn độc lập tập
                luyện bền vững trọn đời.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Left Column: Benefits */}
              <div className="space-y-3 bg-slate-50 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    Quyền Lợi & Nội Dung Khóa Học:
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Kèm 1 - 1</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Thực nghiệm thực tế</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Chuẩn hóa Kĩ Thuật Tập Luyện</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Hiểu từng nhóm cơ được kích hoạt thông qua hình ảnh/video Anatomy</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Hiểu về dinh dưỡng =&gt; Biết tính toán và theo dõi thực đơn</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Hiểu nền tảng xây dựng chương trình tập luyện cho bản thân</strong>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Pricing Options & CTA */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Card 1 */}
                  <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">SỐ BUỔI</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        12 PT + 12 Thực Nghiệm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">HỌC PHÍ</p>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                        5.000.000 đ
                      </p>
                    </div>
                  </div>

                  {/* Card 2 (Featured) */}
                  <div className="p-5 sm:p-6 rounded-3xl border-2 border-amber-400 bg-amber-400/5 dark:bg-amber-400/10 flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-400">
                        Lựa Chọn Toàn Diện
                      </span>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        24 PT + 24 Thực Nghiệm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 uppercase">
                        HỌC PHÍ
                      </p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                        9.000.000 đ
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 text-sm flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-red-600/20 transition cursor-pointer"
                >
                  <span>Đăng Ký Khóa Dạy Gym Cá Nhân</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TĂNG CƠ - GIẢM MỠ                                   */}
        {/* ========================================================= */}
        {activeTab === 'tang-co' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-white/10 dark:bg-slate-900 transition-all">
            <div className="max-w-3xl space-y-3">
              <span className="rounded-full bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-3.5 py-1 text-xs font-black uppercase">
                Chương Trình Chuyển Hóa Vóc Dáng
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chương Trình &quot;Tăng Cơ Giảm Mỡ&quot;
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Lộ trình huấn luyện khoa học, siết mỡ tăng cơ chuẩn form thể hình với đội ngũ HLV Vận Động Viên
                giàu kinh nghiệm.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-12">
              {/* Left Column: PT CHUẨN */}
              <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] p-6 flex flex-col justify-between">
                <div>
                  <span className="inline-block rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                    PT CHUẨN
                  </span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    PT chuẩn đạt các tiêu chí:
                  </p>
                  <div className="mt-3 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-500 font-black text-base">+</span>
                      <span>PT đầy đủ chứng chỉ</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-500 font-black text-base">+</span>
                      <span>PT là Vận Động Viên</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-500 font-black text-base">+</span>
                      <span>PT có kinh nghiệm trên 3 năm</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-500 font-black text-base">+</span>
                      <span>PT có nhiều Transform tốt</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                  💡 Đội ngũ PT kiểm tra định kỳ form dáng & dinh dưỡng hàng tuần.
                </div>
              </div>

              {/* Right Column: Pricing list */}
              <div className="lg:col-span-8 space-y-3">
                <div className="hidden sm:grid grid-cols-12 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <div className="col-span-7">SỐ BUỔI</div>
                  <div className="col-span-5 text-right">HỌC PHÍ</div>
                </div>

                {/* Row 1: 2 Tháng */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-blue-500 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-base underline decoration-blue-500 underline-offset-4">
                        • 2 Tháng
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      20 PT + 20 Hướng Dẫn
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl font-black text-slate-900 dark:text-white">6.000.000 đ</p>
                  </div>
                </div>

                {/* Row 2: 4 Tháng (Yellow border) */}
                <div className="rounded-2xl border-2 border-amber-400 bg-slate-50 dark:bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md relative">
                  <span className="sm:hidden inline-block bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full w-fit mb-1">
                    Tặng 2 buổi Giãn Cơ Full Body
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-base underline decoration-amber-400 underline-offset-4">
                        • 4 Tháng
                      </span>
                      <span className="hidden sm:inline-block bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Tặng 2 buổi Giãn Cơ Full Body
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      40 PT + 40 Hướng Dẫn
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-amber-500 dark:text-amber-400">11.200.000 đ</p>
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">
                      Tặng 2 buổi Giãn Cơ Full Body
                    </p>
                  </div>
                </div>

                {/* Row 3: 6 Tháng (Green border) */}
                <div className="rounded-2xl border border-emerald-500/50 bg-slate-50 dark:bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm relative">
                  <span className="sm:hidden inline-block bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full w-fit mb-1">
                    Tặng 4 buổi Giãn Cơ Full Body
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-base underline decoration-emerald-500 underline-offset-4">
                        • 6 Tháng
                      </span>
                      <span className="hidden sm:inline-block bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        Tặng 4 buổi Giãn Cơ Full Body
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      60 PT + 60 Hướng Dẫn
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">15.600.000 đ</p>
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">
                      Tặng 4 buổi Giãn Cơ Full Body
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Banner: PT Mới Ra Nghề */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-white/10 dark:bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider shrink-0">
                  PT mới ra nghề
                </span>
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    65% Gói Tập PT Chuẩn
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chi phí tiết kiệm: 2 Tháng chỉ 3.900.000 đ • 4 Tháng chỉ 7.280.000 đ • 6 Tháng chỉ 10.140.000 đ
                  </p>
                </div>
              </div>

              <a
                href="#contact"
                onClick={handleContactClick}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black py-3 px-6 rounded-xl shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition cursor-pointer"
              >
                <span>Đăng Ký Tư Vấn Gói Tập</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: HIỆU SUẤT THỂ THAO                                  */}
        {/* ========================================================= */}
        {activeTab === 'the-thao' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-white/10 dark:bg-slate-900 transition-all">
            <div className="max-w-3xl space-y-3">
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400 px-3.5 py-1 text-xs font-black uppercase">
                Thể Thao Chuyên Biệt
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chương Trình &quot;Nâng Cao Hiệu Suất Thể Thao&quot;
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Thiết kế chuyên sâu bổ trợ cho người chơi{' '}
                <strong>Pickleball, Tennis, Golf, Bóng rổ, Bóng đá, Chạy bộ</strong>... giúp bứt phá sức mạnh,
                tốc độ và phòng ngừa chấn thương.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Left Column: Benefits */}
              <div className="space-y-3 bg-slate-50 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <Trophy size={18} className="text-amber-500 shrink-0" />
                    Mục Tiêu & Quyền Lợi Huấn Luyện:
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                      <span>
                        <strong>Tăng sức mạnh – Cải thiện thể lực.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                      <span>
                        <strong>Tăng tốc độ – Nâng cao phản xạ.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                      <span>
                        <strong>Tăng sức bền – Duy trì hiệu suất.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                      <span>
                        <strong>Cải thiện kỹ thuật – Tối ưu vận động.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Phục hồi tốt hơn – Hạn chế chấn thương.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                      <span>
                        <strong>Cá nhân hóa – Theo mục tiêu riêng.</strong>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Pricing Options */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Card 1: 1.5 Tháng */}
                  <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">SỐ BUỔI</p>
                      <p className="font-black text-slate-900 dark:text-white text-base underline decoration-blue-500 underline-offset-4 mt-0.5">
                        • 1,5 Tháng
                      </p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                        10 Kĩ Thuật + 10 Thể Lực
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">HỌC PHÍ</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">3.000.000 đ</p>
                    </div>
                  </div>

                  {/* Card 2: 3 Tháng (Yellow Border) */}
                  <div className="p-5 sm:p-6 rounded-3xl border-2 border-amber-400 bg-slate-50 dark:bg-white/[0.04] flex items-center justify-between shadow-md relative">
                    <span className="absolute -top-3 right-6 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      TẶNG 1 BUỔI GIÃN CƠ FULL BODY
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">SỐ BUỔI</p>
                      <p className="font-black text-slate-900 dark:text-white text-base underline decoration-amber-400 underline-offset-4 mt-0.5">
                        • 3 Tháng
                      </p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                        20 Kĩ Thuật + 20 Thể Lực
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 uppercase">
                        HỌC PHÍ
                      </p>
                      <p className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-0.5">
                        5.600.000 đ
                      </p>
                      <p className="text-[11px] italic text-slate-500 dark:text-slate-400 mt-0.5">
                        (Tặng 1 buổi Giãn Cơ Full Body)
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 text-sm flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-red-600/20 transition cursor-pointer"
                >
                  <span>Đăng Ký Khóa Hiệu Suất Thể Thao</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CỔ VAI GÁY (REHAB)                                  */}
        {/* ========================================================= */}
        {activeTab === 'tri-lieu' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-white/10 dark:bg-slate-900 transition-all">
            <div className="max-w-3xl space-y-3">
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-3.5 py-1 text-xs font-black uppercase">
                Trị Liệu & Phục Hồi Chức Năng
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chương Trình &quot;Văn Phòng - Cổ Vai Gáy&quot;
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Giải pháp trị liệu chuyên sâu cho người ngồi máy tính nhiều, giải phóng chèn ép cơ, căn chỉnh tư
                thế và phục hồi linh hoạt vận động.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Left Column: Benefits */}
              <div className="space-y-3 bg-slate-50 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <HeartPulse size={18} className="text-emerald-500 shrink-0" />
                    Quyền Lợi & Hiệu Quả Liệu Trình:
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Giảm đau mỏi – Cổ, vai, gáy.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Cải thiện tư thế – Giảm gù, lệch vai.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Tăng độ linh hoạt – Cổ và vai.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Thả lỏng cơ – Giảm căng cứng.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Tăng sức mạnh – Cơ cổ và lưng.</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Ngừa tái phát – Duy trì vận động tốt.</strong>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: 3 Course Tiers */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Tier 1: 1 Trị Liệu + 3 Hướng Dẫn */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">SỐ BUỔI</p>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        1 Trị Liệu + 3 Hướng Dẫn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">HỌC PHÍ</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">560.000 đ</p>
                    </div>
                  </div>

                  {/* Tier 2: 5 Trị Liệu + 15 Hướng Dẫn (Green border, Featured) */}
                  <div className="p-5 rounded-3xl border-2 border-emerald-500 bg-slate-50 dark:bg-white/[0.04] flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                        Khóa Phổ Biến
                      </span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        5 Trị Liệu + 15 Hướng Dẫn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase">
                        HỌC PHÍ
                      </p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        2.550.000 đ
                      </p>
                    </div>
                  </div>

                  {/* Tier 3: 10 Trị liệu + 30 Hướng Dẫn */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-500">Khóa Toàn Diện</span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        10 Trị liệu + 30 Hướng Dẫn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">HỌC PHÍ</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">4.600.000 đ</p>
                    </div>
                  </div>
                </div>

                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 text-sm flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-red-600/20 transition cursor-pointer"
                >
                  <span>Đăng Ký Khóa Văn Phòng - Cổ Vai Gáy</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* VIETQR PAYMENT TRANSFER BOX                               */}
      {/* ========================================================= */}
      {paymentInfo.enabled !== false && activeAcc && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-6 sm:p-8 text-white shadow-2xl transition-all">
          <div className="grid gap-8 md:grid-cols-[220px_1fr] items-center">
            {/* VietQR Code */}
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white text-slate-900 shadow-xl border border-white/20">
              <img
                src={qrUrl}
                alt="Mã VietQR DUONG DOUBLE GYM"
                className="w-full aspect-square object-contain rounded-xl"
                loading="lazy"
              />
              <span className="mt-2 text-[11px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1">
                <QrCode size={13} /> Quét mã Napas 247
              </span>
            </div>

            {/* Transfer details */}
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-0.5 text-xs font-black uppercase text-amber-400">
                  <CreditCard size={14} /> Chuyển Khoản Nhanh 24/7
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-white">
                  Thông Tin Chuyển Khoản & Đặt Cọc Gói Tập
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Học viên có thể chuyển khoản giữ chỗ hoặc đóng học phí trực tiếp qua mã VietQR tự động.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Ngân hàng thụ hưởng</p>
                  <p className="font-bold text-white text-sm sm:text-base mt-0.5">
                    {activeBank} {activeBankName && activeBankName !== activeBank ? `· ${activeBankName}` : ''}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Số tài khoản</p>
                    <p className="font-mono font-black text-amber-400 text-sm sm:text-base mt-0.5">
                      {activeAcc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-400 hover:text-slate-950 transition shrink-0 cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Đã chép' : 'Copy'}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Chủ tài khoản</p>
                  <p className="font-bold text-white text-sm sm:text-base uppercase mt-0.5">{activeName}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Cú pháp chuyển khoản mẫu</p>
                  <p className="font-mono font-bold text-amber-300 text-xs sm:text-sm mt-0.5">
                    {activePrefix} [Họ Tên] [SĐT]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
