import axios from 'axios'

type ApiErrorBody = {
  code?: string
  message?: string
}

export const getApiErrorBody = (error: unknown): ApiErrorBody => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return {}
  return error.response?.data ?? {}
}

export const getApiErrorMessage = (error: unknown, fallback: string) =>
  getApiErrorBody(error).message || fallback
