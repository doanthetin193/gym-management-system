import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../../shared/api/apiClient'
import type {
  Exercise,
  ExerciseCategory,
  ExerciseCategoryPayload,
  ExerciseListParams,
  ExercisePayload,
  PageResponse,
} from '../types/exercise'

export function listPublicExerciseCategories() {
  return apiGet<ExerciseCategory[]>('/v1/public/exercise-categories')
}

export function listPublicExercises(params: ExerciseListParams = {}) {
  return apiGet<PageResponse<Exercise>>('/v1/public/exercises', { params })
}

export function getPublicExercise(slugOrId: string) {
  return apiGet<Exercise>(`/v1/public/exercises/${slugOrId}`)
}

export function listOwnerExerciseCategories() {
  return apiGet<ExerciseCategory[]>('/v1/owner/exercise-categories')
}

export function createOwnerExerciseCategory(payload: ExerciseCategoryPayload) {
  return apiPost<ExerciseCategory, ExerciseCategoryPayload>('/v1/owner/exercise-categories', payload)
}

export function listOwnerExercises(params: ExerciseListParams = {}) {
  return apiGet<PageResponse<Exercise>>('/v1/owner/exercises', { params })
}

export function createOwnerExercise(payload: ExercisePayload) {
  return apiPost<Exercise, ExercisePayload>('/v1/owner/exercises', payload)
}

export function updateOwnerExercise(id: number, payload: ExercisePayload) {
  return apiPut<Exercise, ExercisePayload>(`/v1/owner/exercises/${id}`, payload)
}

export function setOwnerExercisePublished(id: number, published: boolean) {
  return apiPatch<Exercise, { published: boolean }>(`/v1/owner/exercises/${id}/published`, { published })
}

export function deleteOwnerExercise(id: number) {
  return apiDelete<void>(`/v1/owner/exercises/${id}`)
}
