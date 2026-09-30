/**
 * แหล่งข้อมูลบทสรุป — ลองอ่านจาก Supabase ก่อน ถ้าไม่ได้ค่อยใช้ไฟล์ .md ที่ฝังมากับ bundle
 *
 * ทำไมต้องมี fallback:
 *   - ถ้า Supabase ล่มหรือยังไม่ได้ตั้ง env → เว็บยังต้องแสดงผลได้
 *   - ตอน build แรกอาจยังไม่มีข้อมูลใน DB
 *
 * ข้อดีของการฝัง .md ไว้ด้วย: เว็บไม่เสีย แม้ DB มีปัญหา
 * ข้อเสีย: ข้อมูลใน bundle เป็นของตอน build → ไม่อัปเดตจนกว่าจะ build ใหม่
 *           (แต่ fallback ใช้เมื่อ DB ไม่ทำงานเท่านั้น ปกติอ่านจาก DB ได้เรื่อย ๆ)
 */

import { articles as bundled } from './content.js'
import { fetchSummaries, isConfigured } from './lib/supabase.js'

const bundledBySlug = Object.fromEntries(bundled.map((a) => [a.slug, a]))

/** คืนรายการบทสรุป — จาก DB ถ้ามี ไม่งั้นใช้ไฟล์ใน bundle */
export async function loadArticles() {
  if (!isConfigured) {
    console.info('[news] ไม่ได้ตั้ง VITE_SUPABASE_URL — ใช้ไฟล์ .md ใน bundle')
    return { articles: bundled, source: 'bundle' }
  }

  try {
    const rows = await fetchSummaries()
    if (rows.length === 0) {
      console.info('[news] DB ยังไม่มีข้อมูล — ใช้ไฟล์ .md ใน bundle')
      return { articles: bundled, source: 'bundle' }
    }

    // รวมของใหม่ใน DB กับของที่ build ไว้ (กันกรณี DB มีแต่บางวัน)
    const seen = new Set(rows.map((r) => r.slug))
    const missing = bundled.filter((a) => !seen.has(a.slug))
    const merged = [...rows, ...missing].sort((a, b) => b.date.localeCompare(a.date))

    console.info(`[news] อ่านจาก DB ได้ ${rows.length} ฉบับ` + (missing.length ? ` + ${missing.length} จาก bundle` : ''))
    return { articles: merged, source: 'db' }
  } catch (err) {
    console.warn('[news] อ่าน DB ไม่สำเร็จ — ใช้ไฟล์ .md ใน bundle:', err.message)
    return { articles: bundled, source: 'bundle' }
  }
}

export { bundledBySlug }
