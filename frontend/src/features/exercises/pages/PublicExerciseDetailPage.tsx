import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { defaultPathForUser, isMemberOnly } from '../../../app/access'
import { useAuth } from '../../auth/context/authContext'
import { ApiClientError } from '../../../shared/api/apiClient'
import { getPublicExercise } from '../api/exerciseApi'
import type { Exercise, ExerciseLevel } from '../types/exercise'

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
  return 'Không thể tải video này.'
}

export function PublicExerciseDetailPage() {
  const { user } = useAuth()
  const { slug = '' } = useParams()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    let mounted = true

    async function loadDetail() {
      try {
        const data = await getPublicExercise(slug)
        if (!mounted) return
        setExercise(data)
      } catch (caughtError) {
        if (mounted) setError(errorMessage(caughtError))
      }
    }

    void loadDetail()
    return () => {
      mounted = false
    }
  }, [slug])

  async function copyCurrentLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const authTarget = defaultPathForUser(user)
  const memberOnly = isMemberOnly(user)
  const authLabel = user ? (memberOnly ? 'TIẾN TRÌNH' : 'QUẢN TRỊ') : 'QUẢN TRỊ'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90 transition-colors">
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 text-left group">
            <img
              src="/logo.jpg"
              alt="DUONG DOUBLE"
              className="size-9 sm:size-10 rounded-full object-cover ring-2 ring-amber-400/40 shadow-sm transition group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/logo.jpg'
              }}
            />
            <div className="leading-tight">
              <p className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                DUONG DOUBLE
              </p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Gym &amp; Fitness Quy Nhơn
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/exercises"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white transition shadow-xs"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Thư viện Video</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="grid size-9 sm:size-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 transition shadow-xs cursor-pointer"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            <Link
              to={user ? authTarget : '/login'}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wide text-slate-950 shadow-md hover:brightness-105 transition"
            >
              <ShieldCheck size={15} />
              <span>{authLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/50 dark:bg-slate-900">
            <p className="font-black text-red-600 dark:text-red-400">{error}</p>
            <Link
              to="/exercises"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-md hover:brightness-105 transition"
            >
              <ArrowLeft size={16} />
              Quay lại thư viện video
            </Link>
          </div>
        ) : !exercise ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="size-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-600 dark:text-slate-300">Đang tải chi tiết video...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr] items-start">
            {/* Left: Video Player */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-xl dark:border-white/15">
                <div className="relative aspect-[9/16] max-h-[75vh] w-full max-w-[360px] mx-auto flex items-center justify-center">
                  {exercise.tiktokVideoId ? (
                    <iframe
                      title={exercise.title}
                      src={`https://www.tiktok.com/player/v1/${exercise.tiktokVideoId}?music_info=1&description=1`}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : exercise.thumbnailUrl ? (
                    <img
                      src={exercise.thumbnailUrl}
                      alt={exercise.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-full bg-amber-400 text-slate-950">
                      <Play size={36} className="ml-1 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Exercise Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  <Layers size={13} />
                  {exercise.categoryName ?? 'Bài tập'}
                </span>

                {exercise.level && (
                  <span
                    className={`rounded-xl px-3 py-1 text-xs font-bold ${levelLabels[exercise.level].color}`}
                  >
                    {levelLabels[exercise.level].label}
                  </span>
                )}

                {exercise.featured && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1 text-xs font-black uppercase text-slate-950">
                    <Sparkles size={12} />
                    Nổi bật
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {exercise.title}
                </h1>
                {exercise.description && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {exercise.description}
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid gap-2.5">
                {exercise.muscleGroup && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-sm">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Nhóm cơ:</span>
                    <span className="font-black text-slate-900 dark:text-white">{exercise.muscleGroup}</span>
                  </div>
                )}
                {exercise.equipment && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-sm">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Thiết bị:</span>
                    <span className="font-black text-slate-900 dark:text-white">{exercise.equipment}</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {exercise.instruction && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Lưu ý kỹ thuật:
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {exercise.instruction}
                  </p>
                </div>
              )}

              {/* Common Mistakes */}
              {exercise.commonMistakes && (
                <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <h3 className="font-black text-sm text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">
                    Lỗi thường gặp:
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 whitespace-pre-line leading-relaxed">
                    {exercise.commonMistakes}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {exercise.tiktokUrl && (
                  <a
                    href={exercise.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 px-5 text-sm font-black text-white shadow-md hover:opacity-90 transition cursor-pointer"
                  >
                    <span>Mở trên TikTok</span>
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void copyCurrentLink()}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  <span>{copied ? 'Đã sao chép link' : 'Sao chép link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
