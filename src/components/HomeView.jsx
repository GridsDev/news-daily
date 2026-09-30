import ShareButtons from './ShareButtons.jsx'

export default function HomeView({ articles, onOpen }) {
  if (articles.length === 0) {
    return (
      <div className="empty">
        <h1>ยังไม่มีบทสรุป</h1>
        <p>รอระบบดึงข่าวรอบถัดไป — บอทจะเขียนไฟล์ให้อัตโนมัติ</p>
      </div>
    )
  }

  const [latest, ...rest] = articles

  return (
    <>
      <section className="hero">
        <p className="hero-label">ฉบับล่าสุด</p>
        <h1 className="hero-title">{latest.title}</h1>
        <p className="hero-meta">
          {latest.weekday} {latest.dateLabel}
          {latest.sourceCount > 0 && ` · ${latest.sourceCount} ข่าว`}
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onOpen(latest.date)}>
            อ่านฉบับนี้ →
          </button>
          <ShareButtons article={latest} compact />
        </div>
      </section>

      {rest.length > 0 && (
        <section className="archive">
          <h2 className="section-title">ฉบับก่อนหน้า</h2>
          <ul className="card-list">
            {rest.map((a) => (
              <li key={a.slug}>
                <button className="card" onClick={() => onOpen(a.date)}>
                  <div className="card-top">
                    <span className="card-date">
                      {a.weekday} {a.dateLabel}
                    </span>
                    {a.sourceCount > 0 && (
                      <span className="card-count">{a.sourceCount} ข่าว</span>
                    )}
                  </div>
                  <h3 className="card-title">{a.title}</h3>
                  {a.tags.length > 0 && (
                    <div className="tags">
                      {a.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
