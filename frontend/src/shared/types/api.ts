export type ApiError = {
  code: string
  message: string
  fields: Record<string, string>
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
  error: ApiError | null
  timestamp: string
}
