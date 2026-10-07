import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  Video,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../../../shared/api/apiClient'
import {
  createOwnerExercise,
  createOwnerExerciseCategory,
  deleteOwnerExercise,
  listOwnerExerciseCategories,
  listOwnerExercises,
  setOwnerExercisePublished,
  updateOwnerExercise,
} from '../api/exerciseApi'
import { ExerciseFormModal } from '../components/ExerciseFormModal'
import { TikTokEmbedPlayer } from '../components/TikTokEmbedPlayer'
import { VideoPlayerModal } from '../components/VideoPlayerModal'
import type { Exercise, ExerciseCategory, ExerciseLevel, ExercisePayload } from '../types/exercise'

const levelLabels: Record<ExerciseLevel, string> = {
  BEGINNER: 'Người mới',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}

function extractTiktokVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

export function OwnerExercisesPage() {
  const [categories, setCategories] = useState<ExerciseCategory[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [published, setPublished] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Quick Embed State
  const [quickUrl, setQuickUrl] = useState('')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategoryId, setQuickCategoryId] = useState<number>(0)
  const [quickSubmitting, setQuickSubmitting] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)

  const publishedCount = useMemo(() => exercises.filter((e) => e.published).length, [exercises])
  const hiddenCount = exercises.length - publishedCount

  // Detect old demo cards
  const demoTitles = ['Bench Press căn bản', 'Lat Pulldown đúng form', 'Hip Thrust tăng cơ mông', 'Giãn cổ vai gáy văn phòng']
  const demoCards = useMemo(() => {
    return exercises.filter((e) => demoTitles.includes(e.title) || e.tiktokUrl?.includes('735000000000000000'))
  }, [exercises])

  // Reset page when search or category filter changes
  useEffect(() => {
    setPage(0)
  }, [keyword, selectedCategory, published])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let categoryData = await listOwnerExerciseCategories()
      if (categoryData.length === 0) {
        await seedDefaultCategories()
        categoryData = await listOwnerExerciseCategories()
      }
      const exercisePage = await listOwnerExercises({
        keyword: keyword || undefined,
        categorySlug: selectedCategory === 'ALL' ? undefined : selectedCategory,
        published: published === 'ALL' ? undefined : published === 'PUBLISHED',
        page,
        size: pageSize,
      })
      setCategories(categoryData)
      setExercises(exercisePage.items)
      setTotalPages(exercisePage.totalPages)
      setTotalItems(exercisePage.totalItems)
      if (categoryData.length > 0 && quickCategoryId === 0) {
        setQuickCategoryId(categoryData[0].id)
      }
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize, published, quickCategoryId, selectedCategory])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  async function handleSubmit(payload: ExercisePayload) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (editingExercise) {
        await updateOwnerExercise(editingExercise.id, payload)
      } else {
        await createOwnerExercise(payload)
      }
      setFormOpen(false)
      setEditingExercise(null)
      await loadData()
    } catch (caughtError) {
      setFormError(errorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickEmbed(e: React.FormEvent) {
    e.preventDefault()
    if (!quickUrl.trim()) {
      setQuickError('Vui lòng dán link video TikTok.')
      return
    }

    const videoId = extractTiktokVideoId(quickUrl)
    if (!videoId) {
      setQuickError('Link video TikTok không hợp lệ (cần có dạng .../video/123456...).')
      return
    }

    const catId = quickCategoryId || categories[0]?.id
    if (!catId) {
      setQuickError('Vui lòng chọn danh mục bài tập.')
      return
    }

    setQuickSubmitting(true)
    setQuickError(null)

    try {
      await createOwnerExercise({
        categoryId: catId,
        title: quickTitle.trim() || 'Video hướng dẫn kỹ thuật TikTok',
        tiktokUrl: quickUrl.trim(),
        published: true,
        featured: false,
        level: 'BEGINNER',
        authorName: 'TikTok Creator',
      })
      setQuickUrl('')
      setQuickTitle('')
      await loadData()
    } catch (caughtError) {
      setQuickError(errorMessage(caughtError))
    } finally {
      setQuickSubmitting(false)
    }
  }

  async function togglePublished(exercise: Exercise) {
    try {
      await setOwnerExercisePublished(exercise.id, !exercise.published)
      await loadData()
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    }
  }

  async function handleDelete(exercise: Exercise) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa video "${exercise.title}"?`)) {
      return
    }
    try {
      await deleteOwnerExercise(exercise.id)
      await loadData()
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    }
  }

  async function handleClearAllDemoCards() {
    if (demoCards.length === 0) return
    if (!window.confirm(`Xóa toàn bộ ${demoCards.length} video demo mẫu cũ?`)) return
    try {
      for (const d of demoCards) {
        await deleteOwnerExercise(d.id)
      }
      await loadData()
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    }
  }

  function handleCopyLink(exercise: Exercise) {
    if (exercise.tiktokUrl) {
      void navigator.clipboard.writeText(exercise.tiktokUrl)
      setCopiedId(exercise.id)
      window.setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-yellow)]/35 bg-[var(--brand-yellow)]/10 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-[var(--brand-yellow)]">
              <Sparkles size={12} className="text-[var(--brand-yellow)]" />
              Thư viện Video Bài tập • TikTok & Reels Hub
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
              {exercises.length} video trong kho
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--text-strong)] sm:text-3xl">
            Thư viện video bài tập
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">
            Nhúng trực tiếp video TikTok hướng dẫn kỹ thuật, form chuẩn, giải phẫu nhóm cơ để hội viên dễ dàng tra cứu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-black text-[var(--text-strong)] shadow-sm hover:border-[var(--brand-yellow)]/50 hover:bg-[var(--surface-muted)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin text-[var(--brand-yellow)]' : ''} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingExercise(null)
              setFormError(null)
              setFormOpen(true)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] via-amber-500 to-amber-600 px-4 text-xs font-black text-black shadow-[0_4px_16px_rgba(255,204,8,0.25)] hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <Plus size={15} />
            Nhúng video đầy đủ
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
          {error}
        </div>
      ) : null}

      {/* 3 Compact Telemetry Cards (Không tính lượt xem theo yêu cầu) */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <CompactCard
          icon={Video}
          label="Tổng video đã nhúng"
          value={`${exercises.length} video`}
          helper="Kho video bài tập chuẩn phòng tập"
          iconColor="text-sky-400"
          iconBg="bg-sky-500/15 border-sky-500/30"
          glowColor="rgba(56, 189, 248, 0.5)"
        />
        <CompactCard
          icon={CheckCircle2}
          label="Đang hiển thị"
          value={`${publishedCount} video`}
          helper="Học viên xem được trên app"
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15 border-emerald-500/30"
          glowColor="rgba(52, 211, 153, 0.5)"
        />
        <CompactCard
          icon={EyeOff}
          label="Đang tạm ẩn"
          value={`${hiddenCount} video`}
          helper="Bản nháp hoặc cần cập nhật"
          iconColor="text-zinc-400"
          iconBg="bg-zinc-500/15 border-zinc-500/30"
          glowColor="rgba(161, 161, 170, 0.5)"
        />
      </div>

      {/* Fast Quick-Embed Bar (Nhúng link TikTok siêu tốc) */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-amber-500/20 text-amber-500">
              <Zap size={15} />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-strong)]">
              Nhúng link TikTok siêu tốc
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            Dán link TikTok vào đây để nhúng trình chiếu tức thì trên web
          </span>
        </div>

        <form onSubmit={(e) => void handleQuickEmbed(e)} className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr_auto_auto]">
          <input
            value={quickUrl}
            onChange={(e) => {
              setQuickUrl(e.target.value)
              setQuickError(null)
            }}
            placeholder="Dán link TikTok (VD: https://www.tiktok.com/@user/video/7665450123...)"
            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] transition-all"
            required
          />

          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Tên bài tập (VD: Hướng dẫn kỹ thuật Squat...)"
            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] transition-all"
          />

          <select
            value={quickCategoryId || categories[0]?.id || ''}
            onChange={(e) => setQuickCategoryId(Number(e.target.value))}
            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] transition-all min-w-[140px]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={quickSubmitting || !quickUrl.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-5 text-xs font-black text-black shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 shrink-0"
          >
            <Zap size={14} />
            {quickSubmitting ? 'Đang nhúng...' : 'Nhúng video'}
          </button>
        </form>

        {quickError ? (
          <p className="text-[11px] font-bold text-red-500">{quickError}</p>
        ) : null}
      </div>

      {/* Demo Cards Cleanup Notice (If user still has demo cards) */}
      {demoCards.length > 0 ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-red-500/15 text-red-500 font-bold text-xs shrink-0">
              <Trash2 size={15} />
            </span>
            <div>
              <p className="text-xs font-black text-[var(--text-strong)]">
                Phát hiện {demoCards.length} thẻ video demo mẫu cũ trong hệ thống
              </p>
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                Bạn có thể xóa sạch toàn bộ các video mẫu demo này để chỉ giữ video thực tế.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleClearAllDemoCards()}
            className="shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-xs font-black text-white hover:bg-red-700 transition-all shadow-sm active:scale-95"
          >
            <Trash2 size={13} />
            Xóa sạch {demoCards.length} video demo cũ
          </button>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="grid gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_auto_180px]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên bài tập, nhóm cơ, thiết bị..."
            className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-8 pr-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] transition-all"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)] min-w-[180px]"
        >
          <option value="ALL">Tất cả nhóm cơ ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={published}
          onChange={(e) => setPublished(e.target.value)}
          className="h-9 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold outline-none focus:border-[var(--brand-yellow)]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đang hiển thị</option>
          <option value="HIDDEN">Đang ẩn</option>
        </select>
      </div>

      {/* Video Cards Grid */}
      <section>
        {loading ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center text-xs font-semibold text-[var(--text-muted)]">
            Đang tải thư viện video...
          </div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center space-y-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
              <Video size={24} />
            </div>
            <h3 className="text-sm font-black text-[var(--text-strong)]">Chưa có video bài tập nào trong thư viện</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Dán link video TikTok vào thanh nhúng siêu tốc ở trên để bắt đầu thêm video bài tập cho học viên.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 items-start">
            {exercises.map((exercise) => {
              const videoId = exercise.tiktokVideoId || extractTiktokVideoId(exercise.tiktokUrl ?? '')

              return (
                <article
                  key={exercise.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm hover:border-amber-400/40 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 group"
                >
                  {/* Real TikTok Embed Player (Compact Scale) */}
                  <div className="w-full overflow-hidden rounded-xl border border-[var(--line)] bg-black/60 shadow-inner flex justify-center">
                    <TikTokEmbedPlayer
                      url={exercise.tiktokUrl ?? (videoId ? `https://www.tiktok.com/@video/video/${videoId}` : '')}
                      videoId={videoId}
                      title={exercise.title}
                      authorName={exercise.authorName ?? undefined}
                      thumbnailUrl={exercise.thumbnailUrl}
                      onOpenModal={() => setViewingExercise(exercise)}
                    />
                  </div>

                  {/* Video Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3
                        onClick={() => setViewingExercise(exercise)}
                        className="text-xs sm:text-sm font-black text-[var(--text-strong)] leading-snug line-clamp-2 cursor-pointer hover:text-amber-400 transition-colors"
                        title="Bấm để xem video"
                      >
                        {exercise.title}
                      </h3>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                        exercise.published ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}>
                        {exercise.published ? 'Hiện' : 'Ẩn'}
                      </span>
                    </div>

                    {/* Category & Attributes Badges */}
                    <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                      <span className="rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 px-1.5 py-0.5">
                        {exercise.categoryName ?? 'Chưa phân loại'}
                      </span>
                      {exercise.level ? (
                        <span className="rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5">
                          {levelLabels[exercise.level]}
                        </span>
                      ) : null}
                      {exercise.muscleGroup ? (
                        <span className="rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 px-1.5 py-0.5">
                          {exercise.muscleGroup}
                        </span>
                      ) : null}
                    </div>

                    {exercise.description ? (
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {exercise.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between gap-1 border-t border-[var(--line)] pt-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingExercise(exercise)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-400 px-2 text-[11px] font-black hover:bg-amber-400 hover:text-black transition-all active:scale-95"
                        title="Bấm để xem video"
                      >
                        <Play size={11} className="fill-current" />
                        <span>Xem</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePublished(exercise)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 px-2 text-[11px] font-bold text-[var(--text)] hover:border-amber-400 hover:text-amber-400 transition-all"
                        title={exercise.published ? 'Ẩn video' : 'Hiển thị video'}
                      >
                        {exercise.published ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{exercise.published ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(exercise)}
                        className="inline-flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 text-xs font-bold text-[var(--text)] hover:border-amber-400 hover:text-amber-400 transition-all"
                        title="Sao chép link TikTok"
                      >
                        {copiedId === exercise.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingExercise(exercise)
                          setFormError(null)
                          setFormOpen(true)
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-lg bg-[var(--brand-yellow)] text-xs font-black text-black hover:brightness-105 transition-all"
                        title="Sửa thông tin video"
                      >
                        <Edit size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(exercise)}
                        className="inline-flex size-7 items-center justify-center rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Xóa video khỏi thư viện"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-muted)] font-semibold">
            <span>
              Hiển thị <strong className="text-[var(--text-strong)]">{Math.min(page * pageSize + 1, totalItems)}</strong> -{' '}
              <strong className="text-[var(--text-strong)]">{Math.min((page + 1) * pageSize, totalItems)}</strong> trên tổng số{' '}
              <strong className="text-[var(--brand-yellow)]">{totalItems}</strong> video
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="h-8 rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-2 text-xs font-bold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] cursor-pointer"
              >
                <option value={8}>8 video (2 hàng)</option>
                <option value={12}>12 video (3 hàng)</option>
                <option value={16}>16 video (4 hàng)</option>
                <option value={24}>24 video (5-6 hàng)</option>
              </select>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 text-[var(--text)] hover:border-amber-400 hover:text-amber-400 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title="Trang trước"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
                    const isCurrent = p === page
                    if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 0 && p !== totalPages - 1) {
                      if (p === 1 || p === totalPages - 2) {
                        return <span key={p} className="text-neutral-500 px-1">...</span>
                      }
                      return null
                    }

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`size-8 rounded-lg text-xs font-black transition-all ${
                          isCurrent
                            ? 'bg-[var(--brand-yellow)] text-black shadow-sm'
                            : 'border border-[var(--line)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:border-amber-400/50 hover:text-[var(--text-strong)]'
                        }`}
                      >
                        {p + 1}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 text-[var(--text)] hover:border-amber-400 hover:text-amber-400 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title="Trang sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Modal for Edit / Add */}
      {formOpen ? (
        <ExerciseFormModal
          categories={categories}
          initialExercise={editingExercise}
          submitting={submitting}
          error={formError}
          onClose={() => {
            setFormOpen(false)
            setEditingExercise(null)
          }}
          onSubmit={handleSubmit}
          onCategoryCreated={(newCat) => {
            setCategories((prev) => [...prev, newCat])
            void loadData()
          }}
        />
      ) : null}



      {/* Video Player Modal (Xem video trực tiếp không bị lỗi) */}
      {viewingExercise ? (
        <VideoPlayerModal
          exercise={viewingExercise}
          onClose={() => setViewingExercise(null)}
        />
      ) : null}
    </div>
  )
}

function CompactCard({
  icon: Icon,
  label,
  value,
  helper,
  iconColor,
  iconBg,
  glowColor,
}: {
  icon: typeof Video
  label: string
  value: string
  helper: string
  iconColor: string
  iconBg: string
  glowColor: string
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm hover:border-[var(--brand-yellow)]/40 transition-all flex items-center gap-3.5 group">
      <div
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-xl pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: glowColor }}
      />
      <div className={`grid size-11 place-items-center rounded-xl border ${iconBg} ${iconColor} shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] truncate">{label}</p>
        <p className="text-xl font-black text-[var(--text-strong)] tracking-tight truncate">{value}</p>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] truncate">{helper}</p>
      </div>
    </article>
  )
}

async function seedDefaultCategories() {
  const defaults = [
    { name: 'Ngực', slug: 'nguc', sortOrder: 1 },
    { name: 'Xô', slug: 'xo', sortOrder: 2 },
    { name: 'Tay', slug: 'tay', sortOrder: 3 },
    { name: 'Vai', slug: 'vai', sortOrder: 4 },
    { name: 'Chân', slug: 'chan', sortOrder: 5 },
    { name: 'Bụng', slug: 'bung', sortOrder: 6 },
  ]

  await Promise.all(defaults.map((payload) => createOwnerExerciseCategory({ ...payload, active: true })))
}
