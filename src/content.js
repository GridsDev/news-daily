/**
 * อ่านไฟล์ .md ทั้งหมดใน content/news/ ตอน build
 * ใช้ import.meta.glob → รวมไฟล์เป็น static bundle ไม่ต้องมี server
 */

const modules = import.meta.glob('/content/news/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: text }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim().replace(/^"|"$/g, '')
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    } else {
      data[key] = value
    }
  }
  return { data, body: text.slice(match[0].length) }
}

function extractTitle(body) {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'ไม่มีชื่อเรื่อง'
}

function thaiDateLabel(iso) {
  if (!iso) return ''
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${months[m - 1]} ${y + 543}`
}

function weekday(iso) {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const d = new Date(iso + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? '' : days[d.getDay()]
}

export const articles = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { data, body } = parseFrontMatter(raw)
    return {
      slug,
      path,
      title: data.title || extractTitle(body),
      date: data.date || slug.replace('บทสรุป-', ''),
      dateLabel: thaiDateLabel(data.date || ''),
      weekday: weekday(data.date || ''),
      tags: Array.isArray(data.tags) ? data.tags : [],
      sourceCount: Number(data.source_count || 0),
      body,
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

export const bySlug = Object.fromEntries(articles.map((a) => [a.slug, a]))
