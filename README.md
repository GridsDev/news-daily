# News Daily

บทสรุปข่าวประจำวัน — คริปโต · เทคโนโลยี · ธุรกิจ

หน้าเว็บนี้แสดงบทสรุปข่าวที่ระบบ `newsbot` บนเครื่อง `sv` สร้างอัตโนมัติ

## โครงสร้าง

```
content/news/บทสรุป-YYYY-MM-DD.md   ← บอทเขียนไฟล์นี้ทุกวัน
src/content.js                      ← อ่าน .md ทั้งหมดตอน build
src/App.jsx                         ← เส้นทางแบบ hash (#/บทสรุป-2026-09-30)
```

ระบบอ่านไฟล์ `.md` ทั้งหมดด้วย `import.meta.glob` ตอน build
จึงได้เป็นเว็บ static ล้วน ไม่ต้องมี server และไม่ต้องใช้ API key ใดๆ

## คำสั่ง

```bash
npm install
npm run dev      # โหมดพัฒนา (port 5173)
npm run build    # build เป็น static → dist/
npm run preview  # ทดสอบ build
```

## การอัปเดต

เมื่อบอท push ไฟล์ใหม่เข้า `content/news/` → Vercel build อัตโนมัติ → หน้าเว็บอัปเดต

รายการฉบับเก่าจะถูกลบทิ้งเมื่อเกิน 30 วัน (กำหนดที่ `KEEP_DAYS` ในโค้ดบอท)

## การแยกบัญชีและอีเมล

| บัญชี | ที่อยู่ | อีเมลที่ commit | ดูแลอะไร |
|---|---|---|---|
| **FahSai** (ฟ้า) | sv | `grids.developer@gmail.com` | repo นี้ — UI + ผลลัพธ์ `.md` |
| **Ex3-NeoPulse** | Gitea | `2024.3xxx@gmail.com` | โค้ด Python บอท (`Ex3-NeoPulse/news-bot`) |

ตามกฎอีเมลใน `AGENTS.md` — ฟ้าใช้ `grids.developer@gmail.com` เท่านั้น
ส่วนโค้ด Python เป็นของ Ex3-NeoPulse (Python Tools) ตาม `company-org-structure`

## หมายเหตุ

- โค้ดเว็บนี้ **ไม่มี Python** เด็ดขาด (แยกจากโค้ดบอทตามกฎของทีม)
- บอทเก็บอยู่ที่ Gitea `Ex3-NeoPulse/news-bot` และรันบน `sv` เท่านั้น
- ไม่มีการเก็บ secret ใดๆ ใน repo นี้
- ต้องเป็น **PUBLIC** — repo ที่เป็น private จะถูก Vercel block deployment
