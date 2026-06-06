import request from '@/utils/request'
import type {
  CanvasCategory,
  CanvasListResponse,
  WuliApiResponse,
} from './types'

const API_BASE = 'http://p2vcom.com'

const post = async <T>(url: string, data: unknown) => {
  const response = await request.post<unknown, WuliApiResponse<T>>(`${API_BASE}${url}`, data)
  return response
}

const get = async <T>(url: string) => {
  const response = await request.get<unknown, WuliApiResponse<T>>(`${API_BASE}${url}`)
  return response
}

export const fetchCanvasCategories = async () => {
  const result = await get<{ categoryList: CanvasCategory[] }>('/api/v1/canvas/square/category')
  return result.success ? result.data.categoryList || [] : []
}

export const fetchQuickTemplates = async (pageNumber: number) => {
  const result = await post<CanvasListResponse>('/api/v1/canvas/template/list', { pageNumber, pageSize: 6 })
  return result.success ? result.data.records || [] : []
}

export const fetchSquareTemplates = async (params: {
  category: string
  canvasName?: string
  pageNumber: number
  pageSize?: number
}) => {
  const result = await post<CanvasListResponse>('/api/v1/canvas/square', {
    category: params.category,
    canvasName: params.canvasName,
    pageNumber: params.pageNumber,
    pageSize: params.pageSize ?? 36,
  })

  if (!result.success) {
    return {
      hasMore: false,
      list: [] as CanvasListResponse['records'],
    }
  }

  const data = result.data || {}
  return {
    hasMore: (data.pageNumber || 1) < (data.totalPage || 1),
    list: data.records || [],
  }
}
