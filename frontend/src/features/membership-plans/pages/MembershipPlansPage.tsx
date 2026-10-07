import {
  Check,
  Dumbbell,
  Flame,
  Gift,
  HeartPulse,
  Layers,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import { useAuth } from '../../auth/context/authContext'
import { createMembershipPlan, listAllMembershipPlans, listMembershipPlans, updateMembershipPlanActive } from '../api/planApi'
import { MembershipPlanFormModal } from '../components/MembershipPlanFormModal'
import type { MembershipPlan, MembershipPlanPayload } from '../types/membershipPlan'

export type BusinessCategory = 'all' | 'tu-tap' | 'day-gym' | 'tang-co' | 'the-thao' | 'tri-lieu'
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

interface CategoryMeta {
  value: BusinessCategory
  label: string
  shortLabel: string
  icon: LucideIcon
  tone: 'gold' | 'sky' | 'amber' | 'rose' | 'emerald' | 'violet'
}

const CATEGORIES: CategoryMeta[] = [
  {
    value: 'all',
    label: 'Tất cả 21 gói tập',
    shortLabel: 'Tất cả gói',
    icon: Sparkles,
    tone: 'gold',
  },
  {
    value: 'tu-tap',
    label: '1. Tự Tập & VIP',
    shortLabel: '1. Tự Tập & VIP',
    icon: Dumbbell,
    tone: 'sky',
  },
  {
    value: 'day-gym',
    label: '2. Dạy Gym Cá Nhân',
    shortLabel: '2. Dạy Gym 1-1',
    icon: Trophy,
    tone: 'amber',
  },
  {
    value: 'tang-co',
    label: '3. Tăng Cơ - Giảm Mỡ',
    shortLabel: '3. Tăng Cơ Giảm Mỡ',
    icon: Flame,
    tone: 'rose',
  },
  {
    value: 'the-thao',
    label: '4. Hiệu Suất Thể Thao',
    shortLabel: '4. Thể Thao',
    icon: Zap,
    tone: 'emerald',
  },
  {
    value: 'tri-lieu',
    label: '5. Cổ Vai Gáy Rehab',
    shortLabel: '5. Cổ Vai Gáy',
    icon: HeartPulse,
    tone: 'violet',
  },
]

interface StandardPlanSpec {
  order: number
  category: BusinessCategory
  tag?: string
  bonusGift?: string
  savingsText?: string
  highlights: string[]
}

const CANONICAL_PLANS: Record<string, StandardPlanSpec> = {
  // 1. Tự Tập & VIP (8 gói)
  'Tự Tập - Full 1 Tháng': {
    order: 1,
    category: 'tu-tap',
    highlights: [
      'Tập không giới hạn số buổi trong tháng',
      'Hỗ trợ kỹ thuật máy móc & form tập ban đầu',
      'Tư vấn "Tập Luyện & Dinh Dưỡng" cuối tuần',
    ],
  },
  'Tự Tập - Full 2 Tháng': {
    order: 2,
    category: 'tu-tap',
    savingsText: 'Tiết kiệm 40.000 ₫',
    highlights: [
      'Tập không giới hạn 60 ngày liên tục',
      'Hỗ trợ kỹ thuật máy móc ban đầu',
      'Tư vấn "Tập Luyện & Dinh Dưỡng" cuối tuần',
    ],
  },
  'Tự Tập - Full 4 Tháng': {
    order: 3,
    category: 'tu-tap',
    savingsText: 'Tiết kiệm 200.000 ₫',
    highlights: [
      'Tập không giới hạn 120 ngày liên tục',
      'Hỗ trợ kỹ thuật máy móc ban đầu',
      'Tư vấn định hướng vóc dáng định kỳ',
    ],
  },
  'Tự Tập - Full 6 Tháng': {
    order: 4,
    category: 'tu-tap',
    savingsText: 'Tiết kiệm 480k • Chỉ ~220k/tháng',
    highlights: [
      'Tập không giới hạn 180 ngày (6 tháng)',
      'Mức giá tiết kiệm nhất phân khúc tự tập',
      'Tư vấn "Tập Luyện & Dinh Dưỡng" cuối tuần',
    ],
  },
  'Tự Tập VIP - Full 1 Tháng': {
    order: 5,
    category: 'tu-tap',
    tag: '👑 VIP',
    bonusGift: 'Tặng Sổ Buổi Tập Mẫu & Ebook Gym',
    highlights: [
      'Trọn gói tự tập không giới hạn 30 ngày',
      'Sổ "Buổi Tập Mẫu" chuẩn form kỹ thuật',
      'Tặng File & Sổ theo dõi tập luyện cá nhân',
    ],
  },
  'Tự Tập VIP - Full 2 Tháng': {
    order: 6,
    category: 'tu-tap',
    tag: '👑 VIP',
    savingsText: 'Tiết kiệm 120.000 ₫',
    bonusGift: 'Tặng Bộ Giáo Án & Sổ Theo Dõi',
    highlights: [
      'Trọn gói tự tập không giới hạn 60 ngày',
      'Sổ "Buổi Tập Mẫu" + Sổ theo dõi tiến độ',
      'File tài liệu giáo trình Gym Căn Bản',
    ],
  },
  'Tự Tập VIP - Full 4 Tháng': {
    order: 7,
    category: 'tu-tap',
    tag: '👑 VIP',
    savingsText: 'Tiết kiệm 480.000 ₫',
    bonusGift: 'Tặng Bộ Giáo Án & Sổ Theo Dõi',
    highlights: [
      'Trọn gói tự tập không giới hạn 120 ngày',
      'Sổ "Buổi Tập Mẫu" + Sổ theo dõi tiến độ',
      'File tài liệu giáo trình Gym Căn Bản',
    ],
  },
  'Tự Tập VIP - Full 6 Tháng': {
    order: 8,
    category: 'tu-tap',
    tag: '👑 VIP',
    savingsText: 'Tiết kiệm 1.080k • Chỉ ~460k/tháng',
    bonusGift: 'Trọn Bộ VIP Tool & Ebook',
    highlights: [
      'Trọn gói tự tập không giới hạn 180 ngày',
      'Sổ "Buổi Tập Mẫu" + Sổ theo dõi tiến độ',
      'File tài liệu giáo trình Gym Căn Bản',
    ],
  },

  // 2. Dạy Gym Cá Nhân (2 gói)
  'Dạy Gym Cá Nhân - 12 PT + 12 Thực Nghiệm': {
    order: 9,
    category: 'day-gym',
    tag: '🏆 Kèm 1-1 Từ Số 0',
    highlights: [
      '12 buổi PT 1-1 + 12 buổi tự tập thực nghiệm',
      'Giải phẫu Anatomy chuẩn hóa từng nhóm cơ',
      'Tự tính toán khẩu phần Calo & Macro dinh dưỡng',
    ],
  },
  'Dạy Gym Cá Nhân - 24 PT + 24 Thực Nghiệm': {
    order: 10,
    category: 'day-gym',
    tag: '🏆 Làm Chủ Tạ Nặng',
    highlights: [
      '24 buổi PT 1-1 + 24 buổi tự tập thực nghiệm',
      'Làm chủ toàn bộ kỹ thuật Compound tạ nặng an toàn',
      'Tự xây dựng giáo án & kế hoạch dinh dưỡng trọn đời',
    ],
  },

  // 3. Tăng Cơ - Giảm Mỡ (6 gói)
  'Tăng Cơ Giảm Mỡ (PT Chuẩn) - 2 Tháng (20 PT + 20 Hướng Dẫn)': {
    order: 11,
    category: 'tang-co',
    tag: '⭐ HLV Chuẩn >3 Năm',
    highlights: [
      '20 buổi PT 1-1 + 20 buổi Hướng dẫn thực hành',
      'HLV chuẩn >3 năm kinh nghiệm / VĐV thi đấu',
      'Cam kết cải thiện chỉ số InBody & vóc dáng',
    ],
  },
  'Tăng Cơ Giảm Mỡ (PT Chuẩn) - 4 Tháng (40 PT + 40 Hướng Dẫn)': {
    order: 12,
    category: 'tang-co',
    tag: '⭐ HLV Chuẩn >3 Năm',
    bonusGift: '🎁 Tặng 02 buổi Giãn Cơ Full Body',
    savingsText: 'Tiết kiệm 800.000 ₫',
    highlights: [
      '40 buổi PT 1-1 chuyên sâu + 40 buổi Hướng dẫn',
      'Tặng 02 buổi Giãn Cơ Trị Liệu Full Body',
      'Thiết kế thực đơn dinh dưỡng cá nhân hóa',
    ],
  },
  'Tăng Cơ Giảm Mỡ (PT Chuẩn) - 6 Tháng (60 PT + 60 Hướng Dẫn)': {
    order: 13,
    category: 'tang-co',
    tag: '⭐ HLV Chuẩn >3 Năm',
    bonusGift: '🎁 Tặng 04 buổi Giãn Cơ Full Body',
    savingsText: 'Tiết kiệm 2.400.000 ₫',
    highlights: [
      '60 buổi PT 1-1 + 60 buổi Hướng dẫn thực hành',
      'Tặng 04 buổi Giãn Cơ Full Body chuyên sâu',
      'Transform toàn diện lột xác thể hình',
    ],
  },
  'Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 2 Tháng': {
    order: 14,
    category: 'tang-co',
    tag: '🌱 HLV Junior',
    savingsText: 'Tiết kiệm 35% so với PT Chuẩn',
    highlights: [
      '20 buổi PT 1-1 + 20 buổi Hướng dẫn',
      'HLV trẻ nhiệt huyết, chỉnh sửa từng rep tập',
      'Giám sát chuyên môn trực tiếp bởi HLV Trưởng',
    ],
  },
  'Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 4 Tháng': {
    order: 15,
    category: 'tang-co',
    tag: '🌱 HLV Junior',
    bonusGift: '🎁 Tặng 02 buổi Giãn Cơ Full Body',
    savingsText: 'Tiết kiệm 35% so với PT Chuẩn',
    highlights: [
      '40 buổi PT 1-1 + 40 buổi Hướng dẫn',
      'Tặng kèm 02 buổi Giãn Cơ Full Body',
      'Chi phí siêu tối ưu, theo dõi sát InBody',
    ],
  },
  'Tăng Cơ Giảm Mỡ (PT Mới Ra Nghề) - 6 Tháng': {
    order: 16,
    category: 'tang-co',
    tag: '🌱 HLV Junior',
    bonusGift: '🎁 Tặng 04 buổi Giãn Cơ Full Body',
    savingsText: 'Tiết kiệm 35% so với PT Chuẩn',
    highlights: [
      '60 buổi PT 1-1 + 60 buổi Hướng dẫn',
      'Tặng kèm 04 buổi Giãn Cơ Full Body',
      'Lộ trình giảm mỡ tăng cơ dài hạn tiết kiệm',
    ],
  },

  // 4. Hiệu Suất Thể Thao (2 gói)
  'Hiệu Suất Thể Thao - 1,5 Tháng (10 Kĩ Thuật + 10 Thể Lực)': {
    order: 17,
    category: 'the-thao',
    tag: '⚡ Thể Thao Thi Đấu',
    highlights: [
      '10 buổi Kỹ thuật + 10 buổi Thể lực bộc phát',
      'Tăng tốc độ di chuyển & phản xạ nhanh nhạy',
      'Chuyên Pickleball, Tennis, Golf, Bóng rổ, Bóng đá',
    ],
  },
  'Hiệu Suất Thể Thao - 3 Tháng (20 Kĩ Thuật + 20 Thể Lực)': {
    order: 18,
    category: 'the-thao',
    tag: '⚡ VĐV & Thể Thao Đỉnh Cao',
    bonusGift: '🎁 Tặng 01 buổi Giãn Cơ Full Body',
    savingsText: 'Tiết kiệm 400.000 ₫',
    highlights: [
      '20 buổi Kỹ thuật + 20 buổi Thể lực thi đấu',
      'Tặng kèm 01 buổi Giãn Cơ Full Body',
      'Tối ưu chuyển động & hạn chế chấn thương',
    ],
  },

  // 5. Cổ Vai Gáy Rehab (3 gói)
  'Văn Phòng Cổ Vai Gáy - 1 Trị Liệu + 3 Hướng Dẫn': {
    order: 19,
    category: 'tri-lieu',
    tag: '🩺 Trị Liệu Cấp Tốc',
    highlights: [
      '1 buổi Trị liệu giãn cơ + 3 buổi Hướng dẫn',
      'Giảm đau mỏi cấp tính cổ, vai, gáy tức thì',
      'Thả lỏng các dải cơ bó cứng lâu ngày',
    ],
  },
  'Văn Phòng Cổ Vai Gáy - 5 Trị Liệu + 15 Hướng Dẫn': {
    order: 20,
    category: 'tri-lieu',
    tag: '🩺 Phục Hồi Chức Năng',
    savingsText: 'Tiết kiệm 250.000 ₫',
    highlights: [
      '5 buổi Trị liệu + 15 buổi Hướng dẫn phục hồi',
      'Cải thiện tư thế, giảm gù lưng và lệch vai',
      'Tăng biên độ linh hoạt của khớp cổ & vai',
    ],
  },
  'Văn Phòng Cổ Vai Gáy - 10 Trị Liệu + 30 Hướng Dẫn': {
    order: 21,
    category: 'tri-lieu',
    tag: '🩺 Trị Liệu Toàn Diện',
    savingsText: 'Tiết kiệm 1.000.000 ₫',
    highlights: [
      '10 buổi Trị liệu + 30 buổi Hướng dẫn',
      'Tăng cường nhóm cơ lưng trên & cơ cổ',
      'Giải quyết triệt để đau mỏi, ngừa tái phát',
    ],
  },
}

function normalizeStr(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function getPlanSpec(plan: MembershipPlan): StandardPlanSpec | null {
  if (CANONICAL_PLANS[plan.name]) {
    return CANONICAL_PLANS[plan.name]
  }
  const norm = normalizeStr(plan.name)
  for (const [name, spec] of Object.entries(CANONICAL_PLANS)) {
    if (normalizeStr(name) === norm) {
      return spec
    }
  }
  for (const [name, spec] of Object.entries(CANONICAL_PLANS)) {
    const kNorm = normalizeStr(name)
    if (norm.includes(kNorm) || kNorm.includes(norm)) {
      return spec
    }
  }
  return null
}

export function classifyPlan(plan: MembershipPlan): Exclude<BusinessCategory, 'all'> {
  const spec = getPlanSpec(plan)
  if (spec && spec.category !== 'all') {
    return spec.category
  }
  const name = plan.name.toLowerCase()
  if (name.includes('dạy gym') || name.includes('day gym')) return 'day-gym'
  if (name.includes('tăng cơ') || name.includes('tang co') || name.includes('giảm mỡ') || name.includes('giam mo')) return 'tang-co'
  if (name.includes('hiệu suất') || name.includes('hieu suat') || name.includes('thể thao') || name.includes('the thao')) return 'the-thao'
  if (name.includes('cổ vai gáy') || name.includes('co vai gay') || name.includes('văn phòng') || name.includes('van phong') || name.includes('trị liệu')) return 'tri-lieu'
  return 'tu-tap'
}

function sortPlans(a: MembershipPlan, b: MembershipPlan) {
  const specA = getPlanSpec(a)
  const specB = getPlanSpec(b)
  if (specA && specB) {
    return specA.order - specB.order
  }
  if (specA) return -1
  if (specB) return 1
  return (a.defaultPrice ?? 0) - (b.defaultPrice ?? 0)
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

function monthlyEquivalent(plan: MembershipPlan) {
  if (!plan.durationDays || !plan.defaultPrice || plan.durationDays < 45) {
    return null
  }
  const months = plan.durationDays / 30
  return Math.round(plan.defaultPrice / months)
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
}

export function MembershipPlansPage() {
  const { user } = useAuth()
  const canManagePlans = user?.roles.includes('OWNER') ?? false

  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<BusinessCategory>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [keyword, setKeyword] = useState('')
  const [updatingPlanId, setUpdatingPlanId] = useState<number | null>(null)

  const counts = useMemo(() => {
    return CATEGORIES.reduce<Record<BusinessCategory, number>>((result, category) => {
      result[category.value] = category.value === 'all'
        ? plans.length
        : plans.filter((plan) => classifyPlan(plan) === category.value).length
      return result
    }, {} as Record<BusinessCategory, number>)
  }, [plans])

  const filteredPlans = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return plans
      .filter((plan) => activeCategory === 'all' || classifyPlan(plan) === activeCategory)
      .filter((plan) => statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? plan.active : !plan.active))
      .filter((plan) => {
        if (!normalizedKeyword) return true
        const nameMatches = plan.name.toLowerCase().includes(normalizedKeyword)
        const spec = getPlanSpec(plan)
        const tagMatches = spec?.tag?.toLowerCase().includes(normalizedKeyword) ?? false
        return nameMatches || tagMatches
      })
      .sort(sortPlans)
  }, [activeCategory, keyword, plans, statusFilter])

  const stats = useMemo(() => {
    const activePlans = plans.filter((plan) => plan.active)
    return {
      total: plans.length,
      active: activePlans.length,
      inactive: plans.length - activePlans.length,
    }
  }, [plans])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPlans(await (canManagePlans ? listAllMembershipPlans() : listMembershipPlans()))
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [canManagePlans])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  async function handleCreatePlan(payload: MembershipPlanPayload) {
    setSubmitting(true)
    setFormError(null)
    try {
      await createMembershipPlan(payload)
      setFormOpen(false)
      await loadPlans()
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePlan(plan: MembershipPlan) {
    if (!canManagePlans) return
    setUpdatingPlanId(plan.id)
    setError(null)
    try {
      const updatedPlan = await updateMembershipPlanActive(plan.id, !plan.active)
      setPlans((currentPlans) => currentPlans.map((item) => (item.id === updatedPlan.id ? updatedPlan : item)))
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setUpdatingPlanId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* 1. Header Section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Chuẩn Hóa 21 Gói Tập • 5 Chương Trình Độc Quyền
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Gói Tập & Bảng Giá
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            Hệ thống biểu phí 100% chuẩn hóa theo định hướng vận hành DUONG DOUBLE GYM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadPlans()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--brand-yellow)] hover:bg-[var(--surface-muted)]"
            title="Tải lại bảng giá"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {canManagePlans ? (
            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setFormOpen(true)
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 text-sm font-black text-white shadow-md shadow-red-950/20 transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
            >
              <Plus size={18} />
              Thêm gói tập mới
            </button>
          ) : null}
        </div>
      </section>

      {/* 2. Program Tabs (5 Programs + All) - Balanced, larger text, optimal layout */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.value
          const count = counts[cat.value] ?? 0

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={[
                'group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition-all duration-200',
                isActive
                  ? 'border-amber-500/80 bg-gradient-to-br from-amber-500/15 via-[var(--surface)] to-[var(--surface)] text-[var(--text-strong)] shadow-md shadow-amber-950/15 ring-1 ring-amber-500/40'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-amber-500/40 hover:bg-[var(--surface-muted)]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    'grid size-8 sm:size-9 place-items-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:text-amber-500',
                  ].join(' ')}
                >
                  <Icon size={17} />
                </span>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-black',
                    isActive
                      ? 'bg-amber-500 text-black'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)] group-hover:text-[var(--text-strong)]',
                  ].join(' ')}
                >
                  {count}
                </span>
              </div>
              <div className="mt-2.5">
                <p className="text-sm font-black tracking-tight text-[var(--text-strong)] sm:text-base">
                  {cat.shortLabel}
                </p>
              </div>
            </button>
          )
        })}
      </section>

      {/* 3. Controls Toolbar: Status Pills + Search Input */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-black transition',
              statusFilter === 'ALL'
                ? 'bg-[var(--surface-muted)] text-[var(--text-strong)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition',
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-emerald-400',
            ].join(' ')}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Đang bán ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition',
              statusFilter === 'INACTIVE'
                ? 'bg-slate-500/15 text-slate-300 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            <span className="size-1.5 rounded-full bg-slate-400" />
            Đã ẩn ({stats.inactive})
          </button>
        </div>

        <div className="relative flex h-10 w-full items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm sm:w-80">
          <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên gói tập..."
            className="ml-2.5 w-full bg-transparent text-xs font-semibold text-[var(--text-strong)] placeholder:text-[var(--text-muted)] outline-none"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="rounded-md p-1 text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              aria-label="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </section>

      {/* 4. Error banner */}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
          {error}
        </div>
      ) : null}

      {/* 5. Plan Cards Grid */}
      {loading ? (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
          <div className="inline-flex size-10 animate-spin items-center justify-center rounded-full border-2 border-amber-500 border-t-transparent text-amber-500" />
          <p className="mt-3 text-sm font-bold text-[var(--text-muted)]">
            Đang tải dữ liệu chuẩn 21 gói tập...
          </p>
        </section>
      ) : filteredPlans.length === 0 ? (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
          <Layers size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="mt-3 text-base font-black text-[var(--text-strong)]">
            Không tìm thấy gói tập phù hợp
          </h3>
          <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn nhóm chương trình khác.
          </p>
          {(activeCategory !== 'all' || statusFilter !== 'ALL' || keyword) && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all')
                setStatusFilter('ALL')
                setKeyword('')
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--brand-yellow)]"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              canManage={canManagePlans}
              updating={updatingPlanId === plan.id}
              onToggle={() => void handleTogglePlan(plan)}
            />
          ))}
        </section>
      )}

      {/* 6. Create Plan Modal */}
      {formOpen ? (
        <MembershipPlanFormModal
          submitting={submitting}
          error={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreatePlan}
        />
      ) : null}
    </div>
  )
}

function PlanCard({
  plan,
  canManage,
  updating,
  onToggle,
}: {
  plan: MembershipPlan
  canManage: boolean
  updating: boolean
  onToggle: () => void
}) {
  const categoryValue = classifyPlan(plan)
  const categoryMeta = CATEGORIES.find((item) => item.value === categoryValue) ?? CATEGORIES[1]
  const CategoryIcon = categoryMeta.icon
  const spec = getPlanSpec(plan)
  const monthly = monthlyEquivalent(plan)

  // Color theme per category
  const themeBadge = {
    'tu-tap': 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    'day-gym': 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    'tang-co': 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    'the-thao': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    'tri-lieu': 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  }[categoryValue] ?? 'border-amber-500/30 bg-amber-500/10 text-amber-400'

  const iconTint = {
    'tu-tap': 'bg-sky-500/10 text-sky-400',
    'day-gym': 'bg-amber-500/10 text-amber-400',
    'tang-co': 'bg-rose-500/10 text-rose-400',
    'the-thao': 'bg-emerald-500/10 text-emerald-400',
    'tri-lieu': 'bg-violet-500/10 text-violet-400',
  }[categoryValue] ?? 'bg-amber-500/10 text-amber-400'

  return (
    <article
      className={[
        'group relative flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-yellow)]/50 hover:shadow-xl',
        plan.active ? '' : 'opacity-70 grayscale-[0.4]',
      ].join(' ')}
    >
      <div>
        {/* Top Header: Badge + Subtag + Status Switch */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex flex-wrap items-center gap-1.5">
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${themeBadge}`}>
              <CategoryIcon size={12} />
              {categoryMeta.shortLabel}
            </span>

            {spec?.tag ? (
              <span className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-black text-amber-400">
                {spec.tag}
              </span>
            ) : null}
          </div>

          {/* Toggle Switch with shrink-0 and whitespace-nowrap - ZERO text overflow */}
          <button
            type="button"
            onClick={onToggle}
            disabled={!canManage || updating}
            className={[
              'shrink-0 whitespace-nowrap inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
              plan.active
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-slate-600/30 bg-[var(--surface-muted)] text-[var(--text-muted)]',
            ].join(' ')}
            title={plan.active ? 'Bấm để ẩn gói tập này' : 'Bấm để mở bán gói tập này'}
            aria-label={plan.active ? 'Gói đang bán' : 'Gói đã ẩn'}
          >
            <span
              className={[
                'h-3.5 w-6 rounded-full p-0.5 transition-colors shrink-0',
                plan.active ? 'bg-emerald-500' : 'bg-slate-600',
              ].join(' ')}
            >
              <span
                className={[
                  'block size-2.5 rounded-full bg-white shadow-sm transition-transform',
                  plan.active ? 'translate-x-2.5' : 'translate-x-0',
                ].join(' ')}
              />
            </span>
            <span className="shrink-0 whitespace-nowrap leading-none">
              {updating ? 'Lưu...' : plan.active ? 'Đang bán' : 'Đã ẩn'}
            </span>
          </button>
        </div>

        {/* Plan Title & Duration */}
        <div className="mt-3.5 flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconTint}`}>
            <CategoryIcon size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black leading-snug tracking-tight text-[var(--text-strong)] group-hover:text-[var(--brand-yellow)] transition-colors">
              {plan.name}
            </h3>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1 text-[var(--text)]">
                ⏱️ {plan.durationDays ? `${plan.durationDays} ngày` : 'Không giới hạn'}
                {plan.durationDays && plan.durationDays >= 30 ? ` (${Math.round(plan.durationDays / 30)} tháng)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions summary chips */}
        {(plan.ptSessionCount || plan.practiceSessionCount || plan.guidanceSessionCount) ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {plan.ptSessionCount ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-400">
                🏋️ {plan.ptSessionCount} PT 1-1
              </span>
            ) : null}
            {plan.practiceSessionCount ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
                🎯 {plan.practiceSessionCount} Hướng dẫn/thực nghiệm
              </span>
            ) : null}
            {plan.guidanceSessionCount ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-400">
                💆 {plan.guidanceSessionCount} Buổi trị liệu & phục hồi
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Special Bonus Gift Tag if applicable */}
        {spec?.bonusGift ? (
          <div className="mt-3 inline-flex w-full items-center gap-1.5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent px-3 py-1.5 text-xs font-black text-amber-400 shadow-sm">
            <Gift size={14} className="shrink-0 text-amber-400" />
            <span className="truncate">{spec.bonusGift}</span>
          </div>
        ) : null}

        {/* Pricing Box */}
        <div className="mt-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/70 px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl font-black tracking-tight text-[var(--brand-red)]">
                {formatMoney(plan.defaultPrice)}
              </p>
            </div>

            <div className="text-right">
              {monthly ? (
                <span className="inline-block rounded-md bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-muted)]">
                  ~{formatMoney(monthly)} / tháng
                </span>
              ) : null}
              {spec?.savingsText ? (
                <p className="mt-0.5 text-[11px] font-bold text-emerald-400">
                  {spec.savingsText}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Highlights / Special Features from Spec - Clean & Compact */}
        <div className="mt-3.5 space-y-1.5 text-xs">
          {(spec?.highlights ?? [plan.description ?? 'Sử dụng đầy đủ tiện ích phòng tập']).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[var(--text)]">
              <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[11px] font-semibold text-[var(--text-muted)]">
        <span>Mã gói: #{plan.id}</span>
        <span>
          {plan.contentAccessLevel === 'PREMIUM'
            ? 'Quyền VIP Premium'
            : plan.contentAccessLevel === 'BASIC'
              ? 'Quyền Cơ bản'
              : 'Tiêu chuẩn'}
        </span>
      </div>
    </article>
  )
}
