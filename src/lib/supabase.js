/**
 * อ่านข้อมูลบทสรุปจาก Supabase (PostgREST) — ฝั่ง browser
 *
 * ใช้ anon key ตัวเดียว ซึ่งเป็น public โดย design ของ Supabase
 * ปลอดภัยเพราะ RLS จำกัดไว้ว่าอ่านได้แค่ daily_summaries
 * (ข่าวดิบ / view รวมข่าว = anon อ่านไม่ได้)
 *
 * ถ้าตั้ง env ไม่ครบ → โมดูลนี้จะคืน null แล้วเว็บ fallback ไปอ่านไฟล์ .md ที่ฝังใน bundle
 */

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(URL && KEY)

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
}

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

function thaiDateLabel(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y + 543}`
}

function weekday(iso) {
  if (!iso) return ''
  const date = new Date(iso + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? '' : DAYS[date.getDay()]
}

async function query(path, params) {
  const res = await fetch(`${URL}/rest/v1/${path}?${params}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json()
}

/** ดึงบทสรุปทั้งหมด (เก่า → ใหม่) พร้อมเนื้อหา markdown เต็ม */
export async function fetchSummaries() {
  const rows = await query(
    'daily_summaries',
    new URLSearchParams({
      select: 'summary_date,title,markdown,file_name,source_count,word_count,model_used,updated_at',
      order: 'summary_date.desc',
    }),
  )

  return rows.map((r) => ({
    slug: r.file_name?.replace(/\.md$/, '') ?? r.summary_date,
    title: r.title,
    date: r.summary_date,
    dateLabel: thaiDateLabel(r.summary_date),
    weekday: weekday(r.summary_date),
    sourceCount: r.source_count ?? 0,
    wordCount: r.word_count ?? 0,
    model: r.model_used,
    body: stripFrontMatter(r.markdown),
  }))
}

/** ตัด YAML front-matter ออก เพราะ React แสดงเองจาก field แยกแล้ว */
function stripFrontMatter(markdown) {
  if (!markdown) return ''
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}
