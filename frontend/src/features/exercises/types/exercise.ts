export type ExerciseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type ExerciseCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  iconName: string | null
  sortOrder: number
  active: boolean
}

export type Exercise = {
  id: number
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  title: string
  slug: string
  description: string | null
  instruction: string | null
  commonMistakes: string | null
  level: ExerciseLevel | null
  muscleGroup: string | null
  equipment: string | null
  tiktokUrl: string | null
  tiktokVideoId: string | null
  thumbnailUrl: string | null
  featured: boolean
  published: boolean
}

export type { PageResponse } from '../../../shared/types/pagination'

export type ExercisePayload = {
  categoryId: number
  title: string
  slug?: string
  description?: string
  instruction?: string
  commonMistakes?: string
  level?: ExerciseLevel
  muscleGroup?: string
  equipment?: string
  tiktokUrl: string
  thumbnailUrl?: string
  featured?: boolean
  published?: boolean
}

export type ExerciseCategoryPayload = {
  name: string
  slug?: string
  description?: string
  iconName?: string
  sortOrder?: number
  active?: boolean
}

export type ExerciseListParams = {
  categorySlug?: string
  level?: ExerciseLevel
  keyword?: string
  featured?: boolean
  published?: boolean
  page?: number
  size?: number
}
