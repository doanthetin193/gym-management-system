import { Compass, Award, CheckCircle2 } from 'lucide-react'

const keyStrengths = [
  {
    id: 'tu-tap',
    title: '1. Chương Trình "Tự Tập"',
    desc: 'Không giới hạn số buổi trong tháng, hỗ trợ kỹ thuật máy móc ban đầu và tư vấn dinh dưỡng định kỳ.',
  },
  {
    id: 'day-gym',
    title: '2. Chương Trình "Dạy Gym Cá Nhân"',
    desc: 'Kèm cặp 1-1, học giải phẫu chuyển động cơ thể (Anatomy), chuẩn hóa form và tự xây dựng giáo án sau 6 tháng.',
  },
  {
    id: 'tang-co',
    title: '3. Chương Trình "Tăng Cơ - Giảm Mỡ"',
    desc: 'Huấn luyện viên chuẩn Vận Động Viên (>3 năm kinh nghiệm), cam kết chuyển hóa vóc dáng bền vững.',
  },
  {
    id: 'the-thao',
    title: '4. Chương Trình "Nâng Cao Hiệu Suất Thể Thao"',
    desc: 'Tối ưu sức mạnh, tốc độ phản xạ và sức bền chuyên biệt cho Pickleball, Tennis, Golf, Bóng rổ...',
  },
  {
    id: 'van-phong',
    title: '5. Chương Trình "Văn Phòng - Cổ Vai Gáy"',
    desc: 'Trị liệu phục hồi, giải tỏa đau mỏi cổ vai gáy, chỉnh gù lệch vai và phục hồi chuyển động linh hoạt.',
  },
]

export function PhilosophySection() {
  return (
    <section id="philosophy" className="scroll-mt-20 sm:scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-8 sm:p-12 text-white shadow-2xl border border-white/10">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left Column: Vision & Mission */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-black uppercase text-emerald-400 border border-emerald-500/30">
              <Compass size={14} />
              <span>Tầm Nhìn & Sứ Mệnh</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              &quot;Sức Khỏe Không Có Đặc Quyền&quot;
            </h2>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              <strong>DUONG DOUBLE</strong> ra đời với sứ mệnh trang bị cho mỗi cá nhân nền tảng rèn luyện vững
              chắc để tự làm chủ việc tập luyện. Đừng vì tài chính mà bỏ lỡ, hãy biến việc tập luyện trở thành một
              phần thiết yếu và dễ dàng đến trọn đời.
            </p>

            <div className="space-y-4 pt-2">
              {/* Item 1 */}
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 font-bold text-sm">
                  1
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Tầm Nhìn (Vision)</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-0.5">
                    DUONG DOUBLE là <strong>&quot;điểm tựa tin cậy&quot;</strong> đồng hành cùng người mới xây dựng
                    &quot;sức khỏe&quot; và &quot;thể hình&quot; bền vững.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 font-bold text-sm">
                  2
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Sứ Mệnh (Mission)</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-0.5">
                    Giúp bạn hoàn toàn tự tập luyện độc lập chỉ trong 6 tháng với sổ theo dõi, giáo án mẫu và kho
                    video bài tập chuẩn.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 font-bold text-sm">
                  3
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Triết Lý (Philosophy)</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-0.5">
                    <strong>&quot;Sức khỏe không có đặc quyền&quot;</strong> — Bất kỳ ai cũng xứng đáng được tiếp
                    cận kỹ thuật tập luyện an toàn, đúng chuẩn y sinh học và hiệu quả lâu dài.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 5 Điểm Mạnh Trọng Tâm */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-8 backdrop-blur-xl space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
              <Award size={20} />
              <span>5 Điểm Mạnh Trọng Tâm</span>
            </h3>

            <div className="space-y-3">
              {keyStrengths.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:bg-white/[0.08]"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 pl-6 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
