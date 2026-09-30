/**
 * ปุ่ม Like — นับความนิยมต่อบทความ
 *
 * ⚠️ ข้อจำกัด (ต้องรู้ ไม่ใช่บั๊ก): เว็บไม่มีระบบ login
 *    กันกดซ้ำด้วย voter_id ที่สุ่มเก็บใน localStorage ของเครื่องผู้ใช้
 *    → ล้าง localStorage = กดซ้ำได้ · เปิด private mode แล้วกดซ้ำได้
 *    → ใครก็ INSERT ได้ แต่ลบ/แก้ของคนอื่นไม่ได้ (RLS ไม่ให้ UPDATE/DELETE)
 *
 *    ถ้าภายหลังอยากนับ "คน" จริง ต้องมีระบบ login (Supabase Auth) — ยังไม่ทำ
 */

import { supabaseHeaders, isConfigured } from './supabase.js'

const VOTER_KEY = 'newsbot.voter_id'

function getVoterId() {
  try {
    let id = localStorage.getItem(VOTER_KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2))
      localStorage.setItem(VOTER_KEY, id)
    }
    return id
  } catch {
    // private mode หรือปิด localStorage — ใช้ id ชั่วคราว (กดซ้ำได้)
    return 'anon-' + Math.random().toString(36).slice(2)
  }
}

const COUNT_COL = 'count'
const HEADER_PREFER = 'count=exact'

/** ดึงจำนวนไลก์ของบทความนั้น */
export async function fetchLikes(summaryDate) {
  if (!isConfigured || !summaryDate) return null
  const url =
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/article_likes` +
    `?select=summary_date&summary_date=eq.${encodeURIComponent(summaryDate)}`

  const res = await fetch(url, {
    headers: { ...supabaseHeaders, Prefer: HEADER_PREFER },
  })
  if (!res.ok) throw new Error(`like count ${res.status}`)
  const data = await res.json()
  return data?.[0]?.[COUNT_COL] ?? 0
}

/** กดไลก์ — คืนจำนวนใหม่ หรือ null ถ้ากดซ้ำ/ล้มเหลว */
export async function addLike(summaryDate) {
  if (!isConfigured || !summaryDate) return null
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/article_likes`

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({ summary_date: summaryDate, voter_id: getVoterId() }),
  })

  // 409 = กดซ้ำแล้ว (UNIQUE constraint)
  if (res.status === 409) return null
  if (!res.ok) throw new Error(`like insert ${res.status}`)

  const rows = await res.json()
  return rows?.[0]?.[COUNT_COL] ?? null
}
