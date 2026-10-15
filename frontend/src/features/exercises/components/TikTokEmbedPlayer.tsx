import { ExternalLink, Maximize2, Video } from 'lucide-react'

interface TikTokEmbedPlayerProps {
  url: string
  videoId?: string | null
  title?: string
  authorName?: string
  thumbnailUrl?: string | null
  onOpenModal?: () => void
}

export function TikTokEmbedPlayer({
  url,
  videoId,
  title,
  onOpenModal,
}: TikTokEmbedPlayerProps) {
  if (!videoId) {
    return (
      <div className="relative aspect-[9/14] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-4 text-center">
        <Video size={36} className="text-amber-400/60 mb-2" />
        <p className="text-xs font-bold text-neutral-400">Chưa nhận diện được mã video</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            Mở link TikTok <ExternalLink size={12} />
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="relative aspect-[9/14] w-full overflow-hidden rounded-xl bg-black border border-white/10 shadow-md group">
      {/* Official TikTok Player v1 iframe - Plays cleanly directly on web with zero overload-protect */}
      <iframe
        src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title={title || 'TikTok Video Player'}
        loading="lazy"
      />

      {/* Floating Action to open Theater Modal */}
      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="absolute top-2.5 right-2.5 z-10 size-8 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-amber-400 hover:text-black transition-all shadow-md"
          title="Xem phóng to toàn màn hình & kỹ thuật"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  )
}
