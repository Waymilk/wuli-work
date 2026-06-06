export type DownloadMediaOptions = {
  fallbackFilename?: string
}

export function resolveDownloadFilename(src: string, fallbackFilename = 'wuli-download') {
  try {
    const url = new URL(src, window.location.href)
    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    if (lastSegment) return decodeURIComponent(lastSegment)
  } catch {
    const lastSegment = src.split('?')[0].split('#')[0].split('/').filter(Boolean).pop()
    if (lastSegment) return lastSegment
  }
  return fallbackFilename
}

function triggerAnchorDownload(href: string, filename: string, options: { target?: string } = {}) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.rel = 'noopener noreferrer'
  if (options.target) link.target = options.target
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function downloadMediaResource(src: string, options: DownloadMediaOptions = {}) {
  const url = String(src || '').trim()
  if (!url) throw new Error('empty download url')

  const filename = resolveDownloadFilename(url, options.fallbackFilename || 'wuli-download')
  let objectUrl = ''

  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error('download failed')
    const blob = await response.blob()
    if (!blob.size) throw new Error('empty download')
    objectUrl = URL.createObjectURL(blob)
    triggerAnchorDownload(objectUrl, filename)
  } catch {
    triggerAnchorDownload(url, filename, { target: '_blank' })
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}
