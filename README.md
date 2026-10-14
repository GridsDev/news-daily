# News Daily — หน้าเว็บบทสรุปข่าว

🔗 **เว็บ**: https://news-daily-lemon.vercel.app

เว็บแสดงบทสรุป**ข่าวคริปโต** BTC · ETH · SOL จาก Supabase/ไฟล์สำรอง พร้อม API JSON และ RSS สำหรับข่าวรายวัน

> repo นี้มี UI และ Vercel Serverless API (JavaScript) — โค้ด Python อยู่ที่ Gitea `Ex3-NeoPulse/news-bot` (ห้ามรวมกันตามกฎของทีม)

---

## Flow chart

```mermaid
flowchart TD
    BOT(["🖥️ newsbot บน sv<br/>รัน 05:00 ทุกวัน"]) --> DB[("🗄️ Supabase<br/>daily_summaries · news_items · news_technology · news_economy · news_general")]
    BOT --> MD[("📦 content/news/<br/>บทสรุป-YYYY-MM-DD.md")]
    MD --> GH --> V["▲ Vercel build"] --> SITE

    subgraph SITE["🌐 news-daily-lemon.vercel.app"]
        direction TB
        LOAD(["เปิดหน้า"]) --> CFG{"มี VITE_SUPABASE_*?"}
        CFG -- "ไม่" --> BUNDLE["📦 ใช้ .md ใน bundle<br/>โหมดสำรอง"]
        CFG -- "มี" --> REST["📡 PostgREST<br/>daily_summaries"]
        REST --> Q{"สำเร็จ?"}
        Q -- "DB ว่าง / ล่ม" --> BUNDLE
        Q -- "ได้ข้อมูล" --> MERGE["🔀 รวม DB + bundle"]
        BUNDLE --> LIST["📋 รายการฉบับล่าสุด"]
        MERGE --> LIST
        LIST --> DETAIL["📖 หน้าอ่านเต็ม<br/>react-markdown"]
        DETAIL --> FOOT["🔎 ท้ายหน้า: แหล่งข้อมูล"]
    end

    CLIENTS(["API/RSS clients"]) --> FUNCTIONS["Vercel Functions<br/>/api/news · /api/rss"] --> DB
    SITE -.->|"อ่านสด"| DB

    style SITE fill:#0d1117,stroke:#4f9cf9,color:#e6edf3
    style BUNDLE fill:#1a2029,stroke:#8b949e,color:#e6edf3
    style CFG fill:#21262d,stroke:#d29922,color:#e6edf3
    style Q fill:#21262d,stroke:#d29922,color:#e6edf3
```

---

## การแชร์

ปุ่มแชร์ 3 ปุ่ม ไม่ใช้ API key ใดๆ

| ปุ่ม | วิธีทำงาน |
|---|---|
| **แชร์ Facebook** | เปิด dialog ของ Facebook (ผู้ใช้กดโพสต์เอง) |
| **แชร์** | Web Share API — มือถือขึ้น native share sheet |
| **คัดลอกลิงก์** | clipboard + ขึ้น "คัดลอกแล้ว" |

วางที่: ใต้หัวเรื่อง + ท้ายบทความ (หน้าอ่านเต็ม) · ครั้งเดียว (หน้ารายการ ฉบับล่าสุด)

### เส้นทางของเว็บ

```
/อ่าน/2026-10-01        ← URL จริง (ไม่ใช้ #)
/                       ← หน้ารายการ
```

> **ทำไมไม่ใช้ `#/...`**: Facebook ตัดส่วน `#` ทิ้งตอนแชร์ → คนกดลิงก์จะไปหน้าแรกแทนที่จะไปบทความที่แชร์
> เลยใช้ History API + URL จริง; Vercel rewrite เฉพาะ `/อ่าน/:slug` มาที่ `index.html` และปล่อย `/api/*` ให้ Functions

## โครงสร้าง

```
index.html                        ← จุดเริ่มต้น
vercel.json                       ← framework/build/output ที่ Vercel ใช้
src/
├── main.jsx                      ← mount React
├── App.jsx                       ← theme + โหลดข้อมูล async + แสดงหน้าแรก/บทความ
├── content-source.js             ← ★ ตัวตัดสินใจ: DB หรือ bundle
├── content.js                    ← อ่าน .md ทั้งหมดตอน build (import.meta.glob)
├── lib/
│   ├── supabase.js               ← ★ อ่าน DB ผ่าน PostgREST
│   └── router.js                 ← ★ History API: /อ่าน/YYYY-MM-DD
├── components/
│   ├── ShareButtons.jsx          ← ★ ปุ่มแชร์ 3 ปุ่ม
│   ├── HomeView.jsx              ← หน้ารายการ (ฉบับล่าสุด + ฉบับก่อนหน้า)
│   └── ArticleView.jsx           ← หน้าอ่านเต็ม + front-matter
└── styles.css                    ← ธีมสว่าง/มืด + responsive

content/news/บทสรุป-YYYY-MM-DD.md  ← บอทเขียนไฟล์นี้ (fallback)
api/news.js                        ← GET /api/news (JSON)
api/rss.js                         ← GET /api/rss (RSS 2.0)
api/_lib/news.js                   ← allowlist, query bounds, Supabase server client
```

| ไฟล์สำคัญ | หน้าที่ |
|---|---|
| `content-source.js` | ลองอ่าน DB ก่อน → ถ้าไม่ได้ (ไม่มี env / DB ว่าง / DB ล่ม) ใช้ไฟล์ `.md` ใน bundle |
| `lib/supabase.js` | เรียก PostgREST ด้วย anon key · ตัด front-matter ออกเพราะ React แสดงเอง |
| `content.js` | ฝังไฟล์ `.md` ทั้งหมดเข้า bundle ตอน build (โหมดสำรอง) |

---

## การอ่านข้อมูล — 2 โหมด

```mermaid
flowchart LR
    START(["เปิดหน้าเว็บ"]) --> A{"ตั้งค่า env?"}

    A -- "ใช่" --> B["อ่านจาก DB"]
    B --> C{"ได้ข้อมูล?"}
    C -- "ใช่" --> D["🎯 โหมด: ข้อมูลสด"]
    C -- "ไม่" --> E["📦 โหมด: สำรอง"]

    A -- "ไม่" --> E
    E --> F["ใช้ .md ที่ฝังใน bundle"]

    D --> G["ข้อดี: อัปเดตทันที<br/>ไม่ต้อง build ใหม่"]
    F --> H["ข้อเสีย: ข้อมูลค้าง<br/>จนกว่าจะ build ใหม่"]

    style D fill:#1a2029,stroke:#3ecf8e,color:#e6edf3
    style E fill:#1a2029,stroke:#8b949e,color:#e6edf3
    style G fill:#0d1117,stroke:#3ecf8e,color:#e6edf3
    style H fill:#0d1117,stroke:#d29922,color:#e6edf3
```

ดูสถานะได้ท้ายหน้า:
- **"ข้อมูลสดจากฐานข้อมูล"** = อ่าน DB สำเร็จ
- **"โหมดสำรอง"** = ใช้ไฟล์ใน bundle

โหมดสำรองใช้เมื่อไม่มี Supabase env, DB ไม่มีข้อมูล หรืออ่าน DB ล้มเหลว และจะรวมบทความจาก bundle ที่ไม่มีใน DB เข้าไปด้วย

---

## ฐานข้อมูล (Supabase)

หน้าเว็บยังอ่านบทสรุปผ่าน **PostgREST** ด้วย anon key ส่วน API/RSS ทำงานผ่าน Vercel Functions และเชื่อม PostgreSQL โดยตรงด้วย `DATABASE_URL` ของ role `newsbot`

| ตัวแปร | ค่า |
|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key (public โดย design) |

ใส่ใน `.env.local` (ไม่ commit) หรือเป็น Environment Variables บน Vercel

### ทำไม anon key ใส่ใน browser ได้

anon key เป็น **public โดย design** — ปลอดภัยเพราะ **RLS** กำหนดสิทธิ์ไว้:

| ตาราง | anon อ่าน | anon เขียน |
|---|---|---|
| `daily_summaries` (บทสรุป) | ✅ | ❌ |
| `summary_news` (ผูก) | ✅ | ❌ |
| `news_items` (ข่าวดิบ) | ❌ | ❌ |
| `news_technology`, `news_economy`, `news_general` | ❌ | ❌ |
| view รวมข่าว | ❌ | ❌ |

> ทดสอบจริงแล้ว: `daily_summaries` → 200 · `news_items` → `[]` · view → 401 · INSERT → 401

### Endpoints ข่าว

| Endpoint | ผลลัพธ์ |
|---|---|
| `/api/news?category=technology&limit=20` | JSON ข่าว |
| `/api/rss?category=technology` | RSS 2.0 |

รองรับ `crypto`, `technology`, `economy`, `general` และ `all` (ค่าเริ่มต้น); `crypto` อ่านจาก `news_items` ส่วนสามหมวดที่เหลืออ่านจากตารางชื่อเดียวกัน (`news_technology`, `news_economy`, `news_general`); `limit` เริ่มต้น 20 สูงสุด 100; `since` รับวันที่/เวลาที่ JavaScript parse ได้ ทั้งสอง endpoint เป็น public read-only, รับ GET/HEAD/OPTIONS, อนุญาต CORS ทุก origin และ cache ที่ edge 5 นาที ปัจจุบันยังไม่มี authentication หรือ rate limit แยกตามผู้เรียก

ตั้ง Environment Variable `DATABASE_URL` ฝั่ง Vercel ให้ชี้ Supabase PostgreSQL โดยใช้ role `newsbot` (ใช้ค่าเดียวกับ `news-bot/.env.local` แต่ตั้งใน Vercel แยกต่างหาก; ห้าม commit หรือวางใน `VITE_*`). API ใช้ `pg` ทำเฉพาะ `SELECT` จากตารางใน allowlist และใช้ bound parameters กับ filter. หาก config ขาด endpoint ตอบ 503; ตารางหมวดต้องมีอยู่และมีข้อมูลก่อนจึงจะคืนข่าวได้ โดย migration อยู่ใน repo `news-bot` ที่ `db/002_category_news.sql`

---

## คำสั่ง

```bash
npm install
npm run dev        # โหมดพัฒนา (port 5173)
npm run build      # build เป็น static → dist/
npm run preview    # ทดสอบ build
npm run test:api   # ทดสอบ API/RSS handlers
```

`npm run dev` และ `npm run preview` เสิร์ฟเฉพาะ Vite frontend ไม่ได้รัน Vercel Functions; หากต้องทดสอบ API ในเครื่องต้องใช้ Vercel CLI (`vercel dev`) และตั้ง server Environment Variables ให้ครบ

### Vite อ่าน env ตอน build

> ⚠️ **ต้อง Redeploy หลังเพิ่ม env บน Vercel**
> Vite อ่านค่า `VITE_*` **ตอน build** เท่านั้น — เพิ่มใน Vercel แล้วไม่ redeploy จะไม่มีผล
>
> ⚠️ **ต้องขึ้นต้นด้วย `VITE_`**
> ตัวแปรชื่อ `SUPABASE_ANON_KEY` (ไม่มี prefix) browser จะมองไม่เห็น

---

## เทคโนโลยี

| ส่วน | เวอร์ชัน | หมายเหตุ |
|---|---|---|
| Vite | 8.3.1 | — |
| React / React DOM | 19.3.0 | เวอร์ชันที่ติดตั้งตาม lockfile |
| react-markdown | 10.1.0 | + remark-gfm (ตาราง/ลิสต์) |
| เส้นทาง | History API | `/อ่าน/YYYY-MM-DD` · Vercel rewrite ไป `index.html` |
| Main JavaScript bundle | 724.74 kB (gzip 195.88 kB) | ผลจาก Vite build ล่าสุด; Vite เตือนว่าเกิน 500 kB; API แยกเป็น Vercel Functions |

---

## การแยกบัญชีและอีเมล

| บัญชี | ที่อยู่ | อีเมลที่ commit | ดูแลอะไร |
|---|---|---|---|
| **FahSai** (ฟ้า) | sv | `grids.developer@gmail.com` | repo นี้ — UI + ผลลัพธ์ `.md` |
| **Ex3-NeoPulse** | Gitea | `2024.3xxx@gmail.com` | โค้ด Python บอท |

ตามกฎอีเมลใน `AGENTS.md` — ฟ้าใช้ `grids.developer@gmail.com` เท่านั้น
ส่วนโค้ด Python เป็นของ Ex3-NeoPulse (Python Tools) ตาม `company-org-structure`

---

## กฎที่ต้องยึด

- **ห้ามมี Python ใน repo นี้** — แยกจากโค้ดบอทตามกฎของทีม
- **repo ต้องเป็น PUBLIC** — ถ้าเป็น private จะถูก Vercel block deployment
  > พิสูจน์แล้ว 2026-09-30: เปลี่ยนเป็น public → `success — Deployment has completed` ทันที
- **ห้าม commit `.env.local`** — อยู่ใน `.gitignore` แล้ว
- **ห้าม commit secret** — `DATABASE_URL` ต้องตั้งเป็น server Environment Variable ใน Vercel และห้ามใช้ในตัวแปร `VITE_*`

---

## เอกสารที่เกี่ยวข้อง

| ไฟล์ | ที่อยู่ |
|---|---|
| โค้ดบอท + flow chart ทั้งหมด | Gitea `Ex3-NeoPulse/news-bot` → `docs/FLOWCHART.md` |
| คู่มือฐานข้อมูล | `Ex3-NeoPulse/news-bot` → `docs/DATABASE.md` |
