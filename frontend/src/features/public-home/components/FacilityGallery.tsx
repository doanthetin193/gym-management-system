import {
  Camera,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Pause,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface FacilityImage {
  id: number
  src: string
  label: string
}

const facilityImages: FacilityImage[] = [
  { id: 1, src: '/facility/img-1.jpg', label: 'Hình ảnh phòng tập #01' },
  { id: 2, src: '/facility/img-2.jpg', label: 'Hình ảnh phòng tập #02' },
  { id: 3, src: '/facility/img-3.jpg', label: 'Hình ảnh phòng tập #03' },
  { id: 4, src: '/facility/img-4.jpg', label: 'Hình ảnh phòng tập #04' },
  { id: 5, src: '/facility/img-5.jpg', label: 'Hình ảnh phòng tập #05' },
  { id: 6, src: '/facility/img-6.jpg', label: 'Hình ảnh phòng tập #06' },
  { id: 7, src: '/facility/img-7.jpg', label: 'Hình ảnh phòng tập #07' },
  { id: 8, src: '/facility/img-8.jpg', label: 'Hình ảnh phòng tập #08' },
  { id: 9, src: '/facility/img-9.jpg', label: 'Hình ảnh phòng tập #09' },
  { id: 10, src: '/facility/img-10.jpg', label: 'Hình ảnh phòng tập #10' },
  { id: 11, src: '/facility/img-11.jpg', label: 'Hình ảnh phòng tập #11' },
  { id: 12, src: '/facility/img-12.jpg', label: 'Hình ảnh phòng tập #12' },
]

export function FacilityGallery() {
  const [mode, setMode] = useState<'slider' | 'bento'>('slider')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const currentImage = facilityImages[currentIndex] || facilityImages[0]

  // Auto-play interval with progress bar
  useEffect(() => {
    if (!autoPlay || isHovered || mode !== 'slider' || lightboxIndex !== null) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % facilityImages.length)
          return 0
        }
        return prev + 1.11
      })
    }, 50)

    return () => clearInterval(interval)
  }, [autoPlay, isHovered, mode, lightboxIndex])

  // Scroll active thumbnail to center
  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current
      const activeEl = container.children[currentIndex] as HTMLElement | undefined
      if (activeEl) {
        const offset = activeEl.offsetLeft - container.offsetLeft - (container.clientWidth / 2 - activeEl.clientWidth / 2)
        container.scrollTo({ left: offset, behavior: 'smooth' })
      }
    }
  }, [currentIndex])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((idx) => (idx === null ? 0 : (idx + 1) % facilityImages.length))
      if (e.key === 'ArrowLeft') setLightboxIndex((idx) => (idx === null ? 0 : (idx - 1 + facilityImages.length) % facilityImages.length))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  const goNext = () => {
    setCurrentIndex((idx) => (idx + 1) % facilityImages.length)
    setProgress(0)
  }

  const goPrev = () => {
    setCurrentIndex((idx) => (idx - 1 + facilityImages.length) % facilityImages.length)
    setProgress(0)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
      {/* Gallery Header Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase text-amber-800 dark:text-amber-400">
            <Camera size={12} className="shrink-0" />
            <span>{facilityImages.length} Góc Ảnh Thực Tế</span>
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-0.5 sm:p-1 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
              mode === 'slider'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-amber-400 font-black'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
            ].join(' ')}
            title="Xem dạng Trình chiếu Cinema"
          >
            <SlidersHorizontal size={13} />
            <span>Trình chiếu</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('bento')}
            className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
              mode === 'bento'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-amber-400 font-black'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
            ].join(' ')}
            title={`Xem toàn bộ ${facilityImages.length} ảnh dạng Lưới`}
          >
            <LayoutGrid size={13} />
            <span>Lưới {facilityImages.length} ảnh</span>
          </button>
        </div>
      </div>

      {/* SLIDER VIEW */}
      {mode === 'slider' ? (
        <div
          className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-950 shadow-xl dark:border-white/15 transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.targetTouches[0].clientX
          }}
          onTouchMove={(e) => {
            touchEndX.current = e.targetTouches[0].clientX
          }}
          onTouchEnd={() => {
            if (!touchStartX.current || !touchEndX.current) return
            const diff = touchStartX.current - touchEndX.current
            if (diff > 45) goNext()
            else if (diff < -45) goPrev()
            touchStartX.current = 0
            touchEndX.current = 0
          }}
        >
          {/* Main Photo Container */}
          <div className="relative h-[290px] sm:h-[390px] md:h-[450px] lg:h-[490px] w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center p-2.5 sm:p-5 select-none">
            {/* Background Blur Glow */}
            <img
              key={`glow-${currentImage.id}`}
              src={currentImage.src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover filter blur-3xl scale-125 opacity-25 dark:opacity-35 pointer-events-none transition-opacity duration-700"
            />

            {/* Crisp Foreground Image */}
            <img
              key={currentImage.id}
              src={currentImage.src}
              alt={currentImage.label}
              className="relative z-10 max-h-full max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.01]"
              draggable={false}
            />

            {/* Top Bar inside image */}
            <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between z-20">
              {/* Counter Badge */}
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-slate-950/80 border border-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-black text-amber-400 backdrop-blur-md shadow-lg">
                  Ảnh {currentIndex + 1} / {facilityImages.length}
                </span>
              </div>

              {/* Action Buttons: Pause/Play & Expand */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setAutoPlay((prev) => !prev)}
                  className="flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl border border-white/20 bg-slate-950/70 text-white backdrop-blur-md hover:bg-slate-900 transition shadow-lg cursor-pointer"
                  title={autoPlay ? 'Tạm dừng tự động lướt' : 'Tiếp tục tự động lướt'}
                  aria-label="Play/Pause"
                >
                  {autoPlay ? <Pause size={13} className="sm:size-3.5" /> : <Play size={13} className="sm:size-3.5 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLightboxIndex(currentIndex)}
                  className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-white/20 bg-slate-950/70 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md hover:bg-slate-900 transition shadow-lg cursor-pointer"
                  title="Phóng to xem Full HD"
                >
                  <Maximize2 size={13} className="sm:size-3.5" />
                  <span className="hidden xs:inline sm:inline">Phóng to</span>
                </button>
              </div>
            </div>

            {/* Left Prev Arrow */}
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl border border-white/20 bg-slate-950/75 text-white backdrop-blur-md hover:bg-amber-400 hover:text-slate-950 transition-all hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={18} className="sm:size-5" />
            </button>

            {/* Right Next Arrow */}
            <button
              type="button"
              onClick={goNext}
              className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex size-8 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl border border-white/20 bg-slate-950/75 text-white backdrop-blur-md hover:bg-amber-400 hover:text-slate-950 transition-all hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={18} className="sm:size-5" />
            </button>

            {/* Bottom Progress Bar */}
            {autoPlay && !isHovered ? (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div
                  className="h-full bg-amber-400 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          {/* Thumbnails Strip */}
          <div className="border-t border-white/10 bg-slate-950/95 p-2 sm:p-3">
            <div
              ref={thumbnailsRef}
              className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent max-w-full"
            >
              {facilityImages.map((img, idx) => {
                const isActive = idx === currentIndex
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx)
                      setProgress(0)
                    }}
                    className={[
                      'group relative aspect-[4/3] w-11 sm:w-14 md:w-16 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-300 cursor-pointer',
                      isActive
                        ? 'border-amber-400 shadow-lg shadow-amber-400/30 scale-105 opacity-100 ring-2 ring-amber-400/50 z-10'
                        : 'border-white/10 opacity-55 hover:opacity-100 hover:scale-105 hover:border-white/30',
                    ].join(' ')}
                  >
                    <img src={img.src} alt={img.label} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 text-[7px] sm:text-[8px] font-black text-white">
                      #{img.id}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* BENTO GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-in fade-in duration-300">
          {facilityImages.map((img, idx) => (
            <article
              key={img.id}
              onClick={() => setLightboxIndex(idx)}
              className={[
                'group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-950 shadow-md transition duration-500 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 cursor-pointer',
                idx === 0 ? 'col-span-2 row-span-2 aspect-[4/5] sm:aspect-auto sm:h-full' : 'aspect-[3/4]',
              ].join(' ')}
            >
              <img
                src={img.src}
                alt={img.label}
                className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-3 sm:p-4">
                <div className="w-full">
                  <span className="inline-flex rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">
                    Góc #{img.id}
                  </span>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-white truncate">{img.label}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 size-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>

          <button
            type="button"
            onClick={() => setLightboxIndex((idx) => (idx === null ? 0 : (idx - 1 + facilityImages.length) % facilityImages.length))}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 size-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-amber-400 hover:text-black transition cursor-pointer"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={() => setLightboxIndex((idx) => (idx === null ? 0 : (idx + 1) % facilityImages.length))}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 size-11 grid place-items-center rounded-full bg-white/10 text-white hover:bg-amber-400 hover:text-black transition cursor-pointer"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight size={24} />
          </button>

          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center">
            <img
              src={facilityImages[lightboxIndex].src}
              alt={facilityImages[lightboxIndex].label}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="mt-3 text-sm font-bold text-amber-400">
              Ảnh {lightboxIndex + 1} / {facilityImages.length} · {facilityImages[lightboxIndex].label}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
