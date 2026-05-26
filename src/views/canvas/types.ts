export interface CanvasCover {
  height?: number
  mediaType?: string
  url?: string
  width?: number
}

export interface CanvasTemplate {
  canvasCategory?: string
  canvasName?: string
  canvasUuid?: string
  coverImage?: CanvasCover[]
  gmtModified?: string
  isQuickTemplate?: number
}

export interface CanvasCategory {
  label: string
  value: string
}

export interface CanvasListResponse {
  pageNumber?: number
  pageSize?: number
  records?: CanvasTemplate[]
  totalPage?: number
  totalRow?: number
}

export interface WuliApiResponse<T> {
  code: number
  data: T
  msg: string
  requestId: string
  success: boolean
  userMsg?: string
}
