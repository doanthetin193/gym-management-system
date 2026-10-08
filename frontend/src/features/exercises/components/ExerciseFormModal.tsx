import { Play, Plus, Save, Video, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { createOwnerExerciseCategory } from '../api/exerciseApi'
import type { Exercise, ExerciseCategory, ExerciseLevel, ExercisePayload } from '../types/exercise'

const levelOptions: Array<{ value: ExerciseLevel; label: string }> = [
  { value: 'BEGINNER', label: 'Người mới' },
  { value: 'INTERMEDIATE', label: 'Trung bình' },
  { value: 'ADVANCED', label: 'Nâng cao' },
]

type Props = {
  categories: ExerciseCategory[]
  initialExercise?: Exercise | null
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: ExercisePayload) => Promise<void>
  onCategoryCreated?: (newCategory: ExerciseCategory) => void
}

function extractTiktokVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function ExerciseFormModal({
  categories,
  initialExercise,
  submitting,
  error,
  onClose,
  onSubmit,
  onCategoryCreated,
}: Props) {
  const [createdCategories, setCreatedCategories] = useState<ExerciseCategory[]>([])
  const categoryList = useMemo(() => {
    const existingIds = new Set(categories.map((category) => category.id))
    return [...categories, ...createdCategories.filter((category) => !existingIds.has(category.id))]
  }, [categories, createdCategories])
  const firstCategoryId = categoryList[0]?.id ?? 0
  const [categoryId, setCategoryId] = useState(initialExercise?.categoryId ?? firstCategoryId)
  const [title, setTitle] = useState(initialExercise?.title ?? '')
  const [description, setDescription] = useState(initialExercise?.description ?? '')
  const [instruction, setInstruction] = useState(initialExercise?.instruction ?? '')
  const [commonMistakes, setCommonMistakes] = useState(initialExercise?.commonMistakes ?? '')
  const [level, setLevel] = useState<ExerciseLevel>(initialExercise?.level ?? 'BEGINNER')
  const [muscleGroup, setMuscleGroup] = useState(initialExercise?.muscleGroup ?? '')
  const [equipment, setEquipment] = useState(initialExercise?.equipment ?? '')
  const [tiktokUrl, setTiktokUrl] = useState(initialExercise?.tiktokUrl ?? '')
  const thumbnailUrl = initialExercise?.thumbnailUrl ?? ''
  const [featured, setFeatured] = useState(initialExercise?.featured ?? false)
  const [published, setPublished] = useState(initialExercise?.published ?? true)

  // State for inline category creation
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  async function handleCreateCategory() {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    setCreatingCategory(true)
    setCategoryError(null)
    try {
      const slug = generateSlug(trimmed)
      const res = await createOwnerExerciseCategory({
        name: trimmed,
        slug,
        sortOrder: categoryList.length + 1,
        active: true,
      })
      setCreatedCategories((prev) => [...prev, res])
      setCategoryId(res.id)
      setNewCategoryName('')
      setShowNewCategoryInput(false)
      onCategoryCreated?.(res)
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'Không thể tạo nhóm cơ mới.')
    } finally {
      setCreatingCategory(false)
    }
  }

  const detectedVideoId = useMemo(() => extractTiktokVideoId(tiktokUrl), [tiktokUrl])
  const canSubmit = useMemo(() => categoryId > 0 && title.trim() && tiktokUrl.trim(), [categoryId, title, tiktokUrl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    await onSubmit({
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      instruction: instruction.trim() || undefined,
      commonMistakes: commonMistakes.trim() || undefined,
      level,
      muscleGroup: muscleGroup.trim() || undefined,
      equipment: equipment.trim() || undefined,
      tiktokUrl: tiktokUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      authorName: 'DUONG DOUBLE',
      authorTiktokUrl: 'https://www.tiktok.com/@duong.double',
      featured,
      published,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Video size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-strong)]">
                {initialExercise ? 'Chỉnh sửa video bài tập' : 'Nhúng video TikTok mới'}
              </h2>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Dán link TikTok để nhúng trực tiếp trình chiếu video vào hệ thống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] transition-all"
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {/* TikTok URL */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Link video TikTok <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
                placeholder="https://www.tiktok.com/@yourfitnessmotivator/video/7665450123220061454..."
                required
              />
              {detectedVideoId ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black">
                  ID: {detectedVideoId}
                </span>
              ) : null}
            </div>
          </div>

          {/* Live Preview if detected */}
          {detectedVideoId ? (
            <div className="md:col-span-2 rounded-2xl border border-amber-500/30 bg-black/80 p-3">
              <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Play size={12} className="fill-amber-400" />
                Xem trước trình chiếu TikTok trực tiếp
              </p>
              <div className="w-full max-w-[320px] aspect-[9/16] max-h-[440px] mx-auto overflow-hidden rounded-xl border border-amber-500/20 shadow-2xl bg-black">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${detectedVideoId}?music_info=1&description=1`}
                  className="h-full w-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="TikTok Preview"
                />
              </div>
            </div>
          ) : null}

          {/* Title */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Tên bài tập / Tiêu đề video <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Ví dụ: Kỹ thuật Squat đúng form tránh đau lưng"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Nhóm cơ / Danh mục <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="h-11 flex-1 min-w-0 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryInput((prev) => !prev)
                  setCategoryError(null)
                }}
                className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                  showNewCategoryInput
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
                title="Thêm nhóm cơ mới"
              >
                <Plus size={15} />
                <span>Thêm</span>
              </button>
            </div>

            {/* Expandable inline creation card - strictly contained within column */}
            {showNewCategoryInput ? (
              <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400">Tạo nhóm cơ mới:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false)
                      setCategoryError(null)
                      setNewCategoryName('')
                    }}
                    className="text-[10px] font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    Đóng
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="VD: Cơ liên sườn, Bụng..."
                    className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-strong)] outline-none focus:border-amber-400 transition-all placeholder:text-[var(--text-muted)]/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleCreateCategory()
                      } else if (e.key === 'Escape') {
                        setShowNewCategoryInput(false)
                        setCategoryError(null)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateCategory()}
                    disabled={creatingCategory || !newCategoryName.trim()}
                    className="h-9 px-3 rounded-lg bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-all disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    {creatingCategory ? 'Đang tạo...' : 'Tạo'}
                  </button>
                </div>
                {categoryError && (
                  <p className="text-[11px] font-semibold text-red-500">{categoryError}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Level */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Cấp độ
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as ExerciseLevel)}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
            >
              {levelOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Muscle Group */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Nhóm cơ chi tiết
            </label>
            <input
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Ngực trên, đùi trước, xô..."
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Thiết bị sử dụng
            </label>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Tạ đơn, tạ đòn, dây kháng lực..."
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] p-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Tóm tắt ngắn gọn nội dung video..."
            />
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Lưu ý kỹ thuật chính
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] p-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Các điểm mấu chốt để tập đúng form..."
            />
          </div>

          {/* Common Mistakes */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
              Lỗi sai thường gặp
            </label>
            <textarea
              value={commonMistakes}
              onChange={(e) => setCommonMistakes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] p-3 text-xs font-semibold text-[var(--text-strong)] outline-none focus:border-[var(--brand-yellow)] transition-all"
              placeholder="Các lỗi sai phổ biến học viên hay mắc..."
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-3 pt-2">
          <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 px-3.5 py-2 text-xs font-bold cursor-pointer hover:border-amber-400/40 transition-all">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-[var(--brand-yellow)] size-4 rounded"
            />
            <span>Hiển thị công khai cho học viên</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 px-3.5 py-2 text-xs font-bold cursor-pointer hover:border-amber-400/40 transition-all">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[var(--brand-yellow)] size-4 rounded"
            />
            <span>Ghim nổi bật đầu thư viện</span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-black text-[var(--text)] hover:bg-[var(--surface-muted)] transition-all"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-yellow)] to-amber-500 px-5 text-xs font-black text-black shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
          >
            <Save size={15} />
            {submitting ? 'Đang lưu...' : 'Lưu video bài tập'}
          </button>
        </div>
      </form>
    </div>
  )
}
