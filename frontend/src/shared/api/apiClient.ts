import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { clearAccessToken, readAccessToken } from '../lib/authStorage'
import type { ApiResponse } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export class ApiClientError extends Error {
  status: number
  code?: string
  fields?: Record<string, string>

  constructor(message: string, status: number, code?: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

type UnboxedAxiosInstance = Omit<AxiosInstance, 'get' | 'post' | 'put'> & {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<T>
  put<T, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<T>
}

function unboxApiResponse(response: AxiosResponse<ApiResponse<unknown>>) {
  const payload = response.data

  if (!payload || typeof payload.success !== 'boolean') {
    throw new ApiClientError('Phản hồi từ máy chủ không hợp lệ.', response.status)
  }

  if (!payload.success) {
    throw new ApiClientError(
      payload.error?.message ?? 'Yêu cầu không thành công.',
      response.status,
      payload.error?.code,
      payload.error?.fields,
    )
  }

  return payload.data
}

function normalizeApiError(error: AxiosError<ApiResponse<unknown>>) {
  const status = error.response?.status ?? 0
  const payload = error.response?.data

  if (status === 401) {
    clearAccessToken()
  }

  throw new ApiClientError(
    payload?.error?.message ?? 'Không thể kết nối đến máy chủ.',
    status,
    payload?.error?.code,
    payload?.error?.fields,
  )
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = readAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  unboxApiResponse as unknown as (response: AxiosResponse) => AxiosResponse,
  normalizeApiError,
)

export const apiClient = axiosInstance as UnboxedAxiosInstance

export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.get<T>(url, config)
}

export function apiPost<T, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig<TBody>,
): Promise<T> {
  return apiClient.post<T, TBody>(url, data, config)
}

export function apiPut<T, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: AxiosRequestConfig<TBody>,
): Promise<T> {
  return apiClient.put<T, TBody>(url, data, config)
}
