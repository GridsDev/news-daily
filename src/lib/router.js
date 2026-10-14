/**
 * เส้นทางของเว็บ (History API แบบ SPA)
 *
 * ทำไมไม่ใช้ hash (#/...): Facebook ตัดส่วน # ทิ้งตอนแชร์
 * → คนกดลิงก์จะไปหน้าแรกแทนที่จะไปบทความที่แชร์
 * → เลยใช้ URL จริง /อ่าน/YYYY-MM-DD (vercel.json มี rewrite ให้ทุก path มาที่ index.html)
 */

export const READ_PREFIX = '/อ่าน'
export const NEWS_PATH = '/ข่าว'

/** '/อ่าน/2026-09-30' → '2026-09-30' | '/' → '' */
export function parsePath(pathname = window.location.pathname) {
  const decoded = safeDecode(pathname)
  if (decoded === NEWS_PATH || decoded === `${NEWS_PATH}/`) return 'news'
  const match = decoded.match(/^\/อ่าน\/([^/]+)\/?$/)
  return match ? match[1] : ''
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** URL เต็มของบทความ — ใช้ตอนแชร์ */
export function articleUrl(date) {
  if (!date) return window.location.origin + '/'
  return `${window.location.origin}${READ_PREFIX}/${encodeURIComponent(date)}`
}

export function homeUrl() {
  return window.location.origin + '/'
}

/** เปลี่ยนหน้าโดยไม่ reload (ใช้ pushState) */
export function navigate(date) {
  const url = date === 'news'
    ? NEWS_PATH
    : date ? `${READ_PREFIX}/${encodeURIComponent(date)}` : '/'
  if (window.location.pathname !== url) {
    window.history.pushState({}, '', url)
  }
  window.scrollTo({ top: 0 })
}
