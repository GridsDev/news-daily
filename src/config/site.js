/**
 * ค่าตั้งเว็บไซต์ — แก้ที่ไฟล์นี้ไฟล์เดียวจบ
 *
 * ⚠️ ไม่ใช่ไฟล์ secret — ข้อมูลในไฟล์นี้จะถูกฝังใน bundle และเห็นได้
 *    ห้ามใส่ API key / token / รหัสผ่านใดๆ ที่นี่
 */

/**
 * LINE ID สำหรับปุ่ม "เพิ่มเพื่อนใน LINE"
 *
 * หาจากไหน:
 *   เปิดแอป LINE → โปรไฟล์ของตัวเอง → ตั้งค่า → โปรไฟล์ → ID ผู้ใช้
 *   หรือหน้า: https://line.me/R/ti/p/@xxxxxx
 *
 * ⚠️ ถ้ายังไม่ได้ตั้ง — ปุ่มจะซ่อนตัวเองอัตโนมัติ (ไม่ทำให้เว็บพัง)
 */
export const LINE_ID = ''

/** URL ของเพจ Facebook (ถ้าต้องการผูกไว้ที่ไหน) */
export const FACEBOOK_PAGE_URL = ''

/** ปิดปุ่มแชร์ทั้งหมด (true = ซ่อนปุ่มแชร์) */
export const HIDE_SHARE = false

/**
 * แบนเนอร์ผู้สนับสนุน
 *
 * เพิ่ม/ลบรายการในอาร์เรย์นี้ · อาร์เรย์ว่าง = ไม่แสดงแบนเนอร์
 *
 * ตัวอย่าง:
 * {
 *   name: 'ชื่อผู้สนับสนุน',
 *   tagline: 'คำโปรยสั้นๆ',
 *   url: 'https://example.com',
 *   image: '/sponsors/logo.png',   // ใส่ไฟล์ไว้ใน public/sponsors/
 *   badge: 'ผู้สนับสนุนทอง',
 * }
 */
export const SPONSORS = []

/** ตำแหน่งแบนเนอร์: 'top' = ใต้ header · 'bottom' = ท้ายหน้า · 'both' = ทั้งสองที่ */
export const SPONSOR_POSITION = 'bottom'

/** ข้อความท้ายแบนเนอร์ */
export const SPONSOR_FOOTER = 'สนับสนุนเราเพื่อให้บทสรุปข่าวอัปเดตทุกวัน'
