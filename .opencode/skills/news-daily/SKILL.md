---
name: news-daily
description: โครงการเว็บ news-daily (Vite + React + Supabase) แสดงบทสรุปข่าวคริปโต BTC/ETH/SOL รายวัน — ใช้เมื่อต้องแก้ routing, หน้าแชร์ Facebook/LINE/Copy, ปุ่ม Like, แบนเนอร์ผู้สนับสนุน, ตั้งค่า src/config/site.js, อ่านข้อมูลจาก Supabase/PostgREST, หรือแก้ปัญหา Vercel deploy ของเว็บข่าว
---

# news-daily — เว็บแสดงบทสรุปข่าวคริปโต

เว็บ Vite + React อ่านบทสรุปจาก Supabase (PostgREST) มี fallback เป็นไฟล์ `.md`
ใน `content/news/` ที่บอท push มาให้

> ⚠️ **ชื่อจริงคือ `news-daily` (มีขีด)** repo GitHub `GridsDev/news-daily` (public)
> โค้ดบอทที่ผลิตเนื้อหาเป็นคนละโปรเจกต์ — `news-bot` (Python) ดู skill `news-bot`

**Production**: https://news-daily-lemon.vercel.app

---

## เริ่มต้นที่นี่

```bash
cd /home/devg/GridsDev/news-daily

npm run dev      # dev server
npm run build    # ต้องผ่านก่อน push ทุกครั้ง
npm run preview
```

`npm run build` ใช้ ~200 ms · bundle ~405 KB (gzip ~124 KB)

### เรียก production ด้วย curl

```bash
U=https://news-daily-lemon.vercel.app
curl -s -o /dev/null -w "%{http_code}\n" "$U/"
curl -s -o /dev/null -w "%{http_code}\n" --path-as-is "$U/อ่าน/2026-10-01"
```

> path เป็น **ภาษาไทย** → ต้องใช้ `--path-as-is` ไม่งั้น curl encode ผิด

### ดูว่า Vercel deploy สำเร็จไหม

```bash
gh api repos/GridsDev/news-daily/commits/HEAD/status \
  --jq '.statuses[] | "\(.state) — \(.description)"'
```

push แล้วรอ ~30 วินาที · repo **ต้องเป็น public** ไม่งั้น Vercel block

---

## โครงสร้าง

```
src/
├── App.jsx                 router + layout
├── main.jsx                entry
├── styles.css              CSS ทั้งหมด (ไม่มี Tailwind)
├── content.js              อ่านไฟล์ .md จาก content/news/ (fallback)
├── content-source.js       เลือกแหล่งข้อมูล: Supabase หรือไฟล์
├── components/
│   ├── HomeView.jsx        หน้ารายการ + SponsorBanner
│   ├── ArticleView.jsx     หน้าบทความ + Like + Share
│   ├── LikeButton.jsx      ปุ่มไลก์
│   ├── ShareButtons.jsx    Facebook / LINE / Web Share / Copy
│   └── SponsorBanner.jsx   แบนเนอร์ผู้สนับสนุน
├── lib/
│   ├── supabase.js         PostgREST client + headers
│   ├── likes.js            addLike / fetchLikes
│   └── router.js           pushState router
└── config/
    ├── site.js             ★ ตั้งค่าที่พี่แก้ได้
    └── README.md           คู่มือทุกค่า
```

### routing

```
/                    → หน้ารายการวันนี้
/อ่าน/YYYY-MM-DD     → บทความวันนั้น
```

ใช้ History API (`pushState`) · Vercel ตั้ง SPA rewrite แล้วใน `vercel.json`

---

## ★ ไฟล์ที่พี่ฆังแก้ได้: `src/config/site.js`

คู่มือครบทุกค่าอยู่ที่ **`src/config/README.md`**

```js
export const LINE_ID = ''       // เช่น 'abc123' (ไม่ต้องใส่ @)
export const SPONSORS = []      // ว่าง = ไม่แสดงแบนเนอร์
export const HIDE_SHARE = false
export const SPONSOR_FOOTER = '...'
```

> ⚠️ **ไฟล์นี้ public** — ข้อมูลถูกฝังใน bundle มองเห็นได้
> **ห้ามใส่ API key / token / รหัสผ่าน** ที่นี่เด็ดขาด

**LINE**: `LINE_ID` ว่าง → ปุ่มไม่แสดง (ไม่พังเว็บ) ทดสอบแล้วทั้งสองกรณี
URL ที่ใช้: `https://line.me/R/ti/p/@<LINE_ID>`

**SPONSORS**: ใส่โลโก้ไว้ที่ `public/sponsors/xxx.png` แล้วอ้าง `/sponsors/xxx.png`
ไม่ใส่ `image` → ใช้ตัวย่อ 2 ตัวแรกของชื่อ

---

## ⚠️ กฎที่ห้ามลืม

### 1. env ต้องขึ้นต้นด้วย `VITE_`

```bash
# .env.local (ไม่ขึ้น git, perm 600)
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

- **Vite อ่าน env ตอน build** → เพิ่มบน Vercel แล้วต้อง **Redeploy**
- ชื่อไม่ขึ้น `VITE_` → browser มองไม่เห็น
- anon key เป็น public โดย design — ความปลอดภัยอยู่ที่ **RLS**

### 2. repo ต้อง public

Vercel จะบล็อกการ deploy จาก private repo ด้วยข้อความ
`Deployment was blocked` → แก้ที่ GitHub repo settings

### 3. Python ห้ามปนในนี้

`news-bot` (Python) กับ `news-daily` (Vite) แยก repo กัน
ถ้าเจอ `.py` / `requirements.txt` ที่นี่ → **หยุดและรายงาน** อย่าแก้เองเงียบ ๆ

### 4. commit ด้วยอีเมล FahSai เท่านั้น

```bash
git config user.name "FahSai"
git config user.email "grids.developer@gmail.com"
```

ห้ามใช้อีเมลของบัญชีอื่น (ดูกฎใน AGENTS.md ของเครื่อง)

---

## ปุ่ม Like

ตาราง `article_likes` · นับยอดผ่าน `Prefer: count=exact`

RLS: anon อ่าน + INSERT ได้ · **UPDATE/DELETE ไม่ได้**

| ทดสอบ | ผล |
|---|---|
| anon INSERT | ✅ 201 |
| กดซ้ำ (voter เดิม) | ✅ 409 (UNIQUE) |
| anon DELETE ของคนอื่น | ✅ ไม่มีผล |
| anon PATCH ของคนอื่น | ✅ ไม่มีผล |

> ⚠️ **ไม่มี login** — กันซ้ำด้วย `voter_id` ใน `localStorage`
> → ล้าง localStorage / private mode แล้วกดซ้ำได้ · นับ "คนกด" ไม่ใช่ "คนคนเดียว"
> นับเป็นคนจริงต้องเพิ่ม Supabase Auth (ยังไม่ทำ)

`DELETE` ตอบ **204 ไม่ใช่ชัวร์ว่าสำเร็จ** — PostgREST ตอบ 204 แม้ 0 แถว
ต้องเช็ค `Prefer: return=representation` แล้วดูว่าคืน `[]` หรือไม่

---

## PostgREST ตอบอะไร

```
GET  /rest/v1/daily_summaries?select=summary_date,markdown&summary_date=eq.2026-10-01
```
ต้องส่ง header สองอัน: `apikey` + `Authorization: Bearer <anon>`

**PostgREST ให้ count ใน header `Content-Range` ไม่ใช่ในตัวแถว**
`Prefer: count=exact` → `Content-Range: 0-9/42` (42 = จำนวนทั้งหมด)
`select=summary_date` จะ **ไม่มีฟิลด์ `count` ใน response** → อย่าอ่าน `data[0].count`

---

## บั๊กที่เจอแล้ว

- **React Router ไม่ได้ใช้** — เขียน router เองใน `lib/router.js` (pushState)
  เว็บเล็กไม่ต้องพึ่ง dependency เพิ่ม
- **ชื่อไฟล์บอทเป็นภาษาไทย** — ใช้ `--path-as-is` เวลา curl
- **`SPONSOR_POSITION` ยังไม่ได้ใช้จริง** — แบนเนอร์วางท้ายหน้าเสมอ
  ถ้าอยากย้ายไปใต้ header แก้ใน `HomeView.jsx`

---

## ยังรออยู่

- [ ] **LINE ID** จากพี่ฆัง (ไม่ใส่ → ปุ่มซ่อน)
- [ ] **ข้อมูลผู้สนับสนุน**: ชื่อ, คำโปรย, URL, โลโก้
- [ ] **Facebook auto-share** — รอชื่อ Page + Page ID + access token
      (คู่มือ: `/home/devg/Ex3-NeoPulse/news-bot/docs/AUTO-SHARE.md`)
- [ ] Supabase Auth ถ้าจะนับไลก์แบบคนจริง