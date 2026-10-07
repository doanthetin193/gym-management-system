import {
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Home,
  Layers,
  Moon,
  Play,
  Search,
  ShieldCheck,
  Sun,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultPathForUser, isMemberOnly } from '../../../app/access'
import { useAuth } from '../../auth/context/authContext'
import { ApiClientError } from '../../../shared/api/apiClient'
import { listPublicExerciseCategories, listPublicExercises } from '../api/exerciseApi'
import type { Exercise, ExerciseCategory, ExerciseLevel } from '../types/exercise'

const THEME_KEY = 'gym_duong_double.theme'

const levelLabels: Record<ExerciseLevel, { label: string; color: string }> = {
  BEGINNER: { label: 'Người mới', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  INTERMEDIATE: { label: 'Trung bình', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ADVANCED: { label: 'Nâng cao', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
}

function errorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message
  }
  return 'Không thể tải thư viện video. Vui lòng thử lại.'
}

export function PublicExercisesPage() {
  const { user } = useAuth()
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<ExerciseCategory[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Exercise | null>(null)

  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  // Initial load of categories and base list for accurate persistent counts
  useEffect(() => {
    void listPublicExercises({ size: 100 })
      .then((res) => {
        setAllExercises(res.items)
      })
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [categoryData, exercisePage] = await Promise.all([
        listPublicExerciseCategories(),
        listPublicExercises({
          categorySlug: activeCategory || undefined,
          keyword: keyword.trim() || undefined,
          size: 60,
        }),
      ])
      setCategories(categoryData)
      setExercises(exercisePage.items)
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [activeCategory, keyword])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 200)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  // Persistent category counts
  const categoryCounts = useMemo(() => {
    const sourceList = allExercises.length > 0 ? allExercises : exercises
    const map = new Map<string, number>()
    for (const ex of sourceList) {
      if (ex.categorySlug) {
        map.set(ex.categorySlug, (map.get(ex.categorySlug) || 0) + 1)
      }
    }
    return map
  }, [allExercises, exercises])

  const authTarget = defaultPathForUser(user)
  const memberOnly = isMemberOnly(user)
  const authLabel = user ? (memberOnly ? 'TIẾN TRÌNH' : 'QUẢN TRỊ') : 'QUẢN TRỊ'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* ========================================================= */}
      {/* STICKY HEADER                                             */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90 transition-colors">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 text-left group">
            <img
              src="/logo.jpg"
              alt="DUONG DOUBLE"
              className="size-8.5 sm:size-10 rounded-full object-cover ring-2 ring-amber-400/40 shadow-xs transition group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/logo.jpg'
              }}
            />
            <div className="leading-tight">
              <p className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                DUONG DOUBLE
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Thư Viện Video Bài Tập
              </p>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition shadow-2xs"
            >
              <Home size={15} />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 transition shadow-2xs cursor-pointer"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* Admin / Portal Link */}
            <Link
              to={user ? authTarget : '/login'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wide text-slate-950 shadow-sm hover:brightness-105 transition"
            >
              <ShieldCheck size={15} />
              <span>{authLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT                                              */}
      {/* ========================================================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5 pb-16">
        {/* Compact, Symmetrical & Balanced Header & Filter Section */}
        <div className="mx-auto max-w-3xl text-center space-y-3.5">
          {/* Title Row with enhanced readability */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight inline-flex items-center justify-center gap-2.5">
              <Play size={22} className="fill-amber-400 text-amber-400 shrink-0" />
              <span>Thư Viện Video Bài Tập</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                {exercises.length} video
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Kỹ thuật form chuẩn & hướng dẫn chi tiết theo từng nhóm cơ
            </p>
          </div>

          {/* Centered Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm bài tập theo tên hoặc nhóm cơ..."
              className="w-full h-11 rounded-xl border border-slate-200 bg-white py-2 pl-11 pr-11 text-sm sm:text-base font-medium shadow-2xs transition placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white text-center sm:text-left"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Balanced & Centered Category Pills with larger text and easy tap targets */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveCategory('')}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeCategory === ''
                  ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeCategory === ''
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                }`}
              >
                {allExercises.length > 0 ? allExercises.length : exercises.length}
              </span>
            </button>

            {categories.map((category) => {
              const count = categoryCounts.get(category.slug) ?? 0
              const isActive = activeCategory === category.slug
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-black shadow-amber-400/20'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <span>{category.name}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-black ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900 shadow-2xs"
              >
                <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3.5 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-4/5 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : exercises.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs dark:border-white/15 dark:bg-slate-900">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500">
              <Video size={28} />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Không tìm thấy video bài tập phù hợp
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {keyword
                ? `Không có bài tập nào khớp với từ khóa "${keyword}".`
                : 'Chưa có video hướng dẫn cho danh mục này.'}
            </p>
            {(keyword || activeCategory) && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  setActiveCategory('')
                }}
                className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-sm hover:brightness-105 transition cursor-pointer"
              >
                Xem tất cả video
              </button>
            )}
          </div>
        ) : (
          /* Video Grid Cards: Compact 3-4 columns */
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {exercises.map((exercise) => (
              <VideoCard
                key={exercise.id}
                exercise={exercise}
                onPlay={() => setSelectedVideo(exercise)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* VIDEO LIGHTBOX MODAL                                      */}
      {/* ========================================================= */}
      {selectedVideo && (
        <VideoPlayerModal
          exercise={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}

function VideoCard({
  exercise,
  onPlay,
}: {
  exercise: Exercise
  onPlay: () => void
}) {
  const levelInfo = exercise.level ? levelLabels[exercise.level] : null

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400/60 dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
      {/* Thumbnail with overlay & Play button */}
      <div
        onClick={onPlay}
        className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {exercise.thumbnailUrl ? (
          <img
            src={exercise.thumbnailUrl}
            alt={exercise.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black p-3 text-center">
            <div className="size-11 rounded-xl border border-white/20 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-cyan-400 shadow-sm mb-1.5">
              <Dumbbell size={20} />
            </div>
            <span className="text-xs font-bold text-slate-300">Video Kỹ Thuật Form Chuẩn</span>
          </div>
        )}

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Centered Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xl shadow-black/60 transition duration-300 group-hover:scale-115 group-hover:bg-amber-300">
            <Play size={20} className="ml-0.5 fill-current" />
          </span>
        </div>

        {/* Category Pill (bottom left) */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/85 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-amber-400 backdrop-blur-md border border-white/15 shadow-2xs">
            <Layers size={13} />
            {exercise.categoryName || 'Bài tập'}
          </span>
        </div>

        {/* TikTok / Featured Badge (top right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {exercise.featured && (
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-2xs">
              Nổi bật
            </span>
          )}
          {exercise.tiktokVideoId && (
            <span className="rounded-md bg-gradient-to-r from-cyan-400 to-pink-500 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-2xs">
              TikTok
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Level Pill & Muscle Group */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {levelInfo ? (
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${levelInfo.color}`}>
                {levelInfo.label}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">Cơ bản</span>
            )}
            {exercise.muscleGroup && (
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {exercise.muscleGroup}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={onPlay}
            className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-amber-500 dark:text-white dark:group-hover:text-amber-400 transition cursor-pointer"
            title={exercise.title}
          >
            {exercise.title}
          </h3>

          {/* Description */}
          {exercise.description && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {exercise.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex items-center gap-1.5 text-sm font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer"
          >
            <Play size={15} className="fill-current" />
            <span>Xem Video</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/exercises/${exercise.slug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 transition"
            >
              <span>Chi tiết</span>
              <ChevronRight size={13} />
            </Link>

            {exercise.tiktokUrl && (
              <a
                href={exercise.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 transition"
                title="Mở trên TikTok"
                aria-label="Mở trên TikTok"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function VideoPlayerModal({
  exercise,
  onClose,
}: {
  exercise: Exercise
  onClose: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const hasTiktokId = Boolean(exercise.tiktokVideoId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl ${
          hasTiktokId ? 'max-w-sm sm:max-w-md' : 'max-w-2xl sm:max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                {exercise.categoryName || 'Bài tập'}
              </span>
              {hasTiktokId && (
                <span className="rounded-md bg-gradient-to-r from-cyan-400 to-pink-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  TikTok
                </span>
              )}
            </div>
            <h3 className="truncate text-sm sm:text-base font-bold text-white mt-1.5">
              {exercise.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {exercise.tiktokUrl && (
              <a
                href={exercise.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
                title="Mở xem trên TikTok"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Body */}
        <div className="relative bg-black flex items-center justify-center">
          {hasTiktokId ? (
            <div className="aspect-[9/16] w-full max-w-[320px] mx-auto overflow-hidden">
              <iframe
                src={`https://www.tiktok.com/player/v1/${exercise.tiktokVideoId}?music_info=1&description=1`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={exercise.title}
              />
            </div>
          ) : exercise.thumbnailUrl ? (
            <div className="relative aspect-video w-full">
              <img
                src={exercise.thumbnailUrl}
                alt={exercise.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center">
              <Video size={36} className="text-amber-400 mb-2" />
              <p className="text-xs font-bold text-slate-300">Video đang được cập nhật</p>
            </div>
          )}
        </div>

        {/* Footer info in Modal */}
        <div className="p-4 border-t border-white/10 space-y-2 max-h-40 overflow-y-auto">
          {exercise.description && (
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {exercise.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-slate-400 pt-0.5">
            <span>
              Nhóm cơ: <strong className="text-white">{exercise.muscleGroup || 'Toàn thân'}</strong>
            </span>
            <Link
              to={`/exercises/${exercise.slug}`}
              className="text-amber-400 text-sm font-bold hover:underline"
            >
              Xem trang bài tập đầy đủ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
