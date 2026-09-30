import { SPONSORS, SPONSOR_FOOTER } from '../config/site.js'

/**
 * แบนเนอร์ผู้สนับสนุน
 *
 * ถ้าอาร์เรย์ SPONSORS ใน config/site.js ว่าง → คืน null (ไม่แสดงอะไรเลย)
 * แก้ข้อมูลผู้สนับสนุนได้ที่ src/config/site.js
 */
export default function SponsorBanner() {
  const items = SPONSORS.filter(Boolean)
  if (items.length === 0) return null

  return (
    <aside className="sponsor" aria-label="ผู้สนับสนุน">
      <div className="sponsor-head">
        <span className="sponsor-title">ผู้สนับสนุน</span>
        {SPONSOR_FOOTER && <span className="sponsor-sub">{SPONSOR_FOOTER}</span>}
      </div>

      <ul className="sponsor-list">
        {items.map((s, i) => (
          <li key={s.id ?? s.name ?? i}>
            <a
              className="sponsor-card"
              href={s.url || '#'}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              {s.image ? (
                <img className="sponsor-logo" src={s.image} alt={s.name || ''} loading="lazy" />
              ) : (
                <span className="sponsor-logo sponsor-logo-text">
                  {(s.name || '?').slice(0, 2)}
                </span>
              )}
              <span className="sponsor-text">
                <span className="sponsor-name">{s.name}</span>
                {s.tagline && <span className="sponsor-tagline">{s.tagline}</span>}
              </span>
              {s.badge && <span className="sponsor-badge">{s.badge}</span>}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
