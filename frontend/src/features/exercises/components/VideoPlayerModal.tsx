import { AlertTriangle, CheckCircle2, Dumbbell, ExternalLink, X } from 'lucide-react'
import { useEffect } from 'react'
import type { Exercise, ExerciseLevel } from '../types/exercise'

type Props = {
  exercise: Exercise
  onClose: () => void
}

const levelLabels: Record<ExerciseLevel, string> = {
  BEGINNER: 'Người mới',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
}

function extractVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

export function VideoPlayerModal({ exercise, onClose }: Props) {
  const videoId = exercise.tiktokVideoId || extractVideoId(exercise.tiktokUrl ?? '')

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 size-9 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white hover:bg-amber-400 hover:text-black flex items-center justify-center transition-all"
        >
          <X size={18} />
        </button>

        {/* Video Player Column */}
        <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-4 min-h-[380px] md:min-h-[580px]">
          {videoId ? (
            <div className="relative aspect-[9/16] h-[360px] sm:h-[480px] md:h-[560px] max-w-[340px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <iframe
                src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={exercise.title}
              />
            </div>
          ) : (
            <div className="text-center p-6 text-neutral-400">
              <Dumbbell size={40} className="mx-auto text-amber-400/50 mb-2" />
              <p className="text-sm font-bold">Không tìm thấy mã video bài tập</p>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="w-full md:w-[360px] p-5 sm:p-6 overflow-y-auto flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 bg-neutral-900/60">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-xs font-black text-amber-400">
                  {exercise.categoryName || 'Bài tập'}
                </span>
                {exercise.level && (
                  <span className="rounded-md bg-sky-400/15 border border-sky-400/30 px-2 py-0.5 text-xs font-bold text-sky-400">
                    {levelLabels[exercise.level]}
                  </span>
                )}
                {exercise.muscleGroup && (
                  <span className="rounded-md bg-purple-400/15 border border-purple-400/30 px-2 py-0.5 text-xs font-bold text-purple-300">
                    {exercise.muscleGroup}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                {exercise.title}
              </h2>
              {exercise.description && (
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {exercise.description}
                </p>
              )}
            </div>

            {/* Technical Instructions */}
            {exercise.instruction && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
                <p className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Kỹ thuật chuẩn form
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                  {exercise.instruction}
                </p>
              </div>
            )}

            {/* Common Mistakes */}
            {exercise.commonMistakes && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-1">
                <p className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Lỗi sai thường gặp
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                  {exercise.commonMistakes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
            {exercise.tiktokUrl && (
              <a
                href={exercise.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Mở trên TikTok <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all ml-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
