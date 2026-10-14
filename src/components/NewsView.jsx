import { useEffect, useState } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'crypto', label: 'คริปโต' },
  { id: 'technology', label: 'เทคโนโลยี' },
  { id: 'economy', label: 'เศรษฐกิจ' },
  { id: 'general', label: 'ทั่วไป' },
]

const DATE_FORMAT = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
})

export default function NewsView() {
  const [category, setCategory] = useState('all')
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')

    fetch(`/api/news?category=${category}&limit=50`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('News request failed')
        return response.json()
      })
      .then((result) => {
        if (!Array.isArray(result.items)) throw new Error('Invalid news response')
        setItems(result.items)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [category, refresh])

  return (
    <section className="news-page">
      <header className="news-heading">
        <div>
          <p className="hero-label">อัปเดตจากแหล่งข่าว</p>
          <h1 className="news-title">ข่าวล่าสุด</h1>
          <p className="news-description">ข่าวใหม่จากคริปโต เทคโนโลยี และเศรษฐกิจ</p>
        </div>
        {status === 'ready' && <span className="news-total">{items.length} ข่าว</span>}
      </header>

      <div className="news-filters" role="group" aria-label="กรองหมวดข่าว">
        {CATEGORIES.map((item) => (
          <button
            className="news-filter"
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {status === 'loading' ? (
        <p className="loading news-state" role="status">กำลังโหลดข่าว…</p>
      ) : status === 'error' ? (
        <div className="news-state news-error" role="alert">
          <p>โหลดข่าวไม่สำเร็จ ลองใหม่อีกครั้ง</p>
          <button className="btn-back" type="button" onClick={() => setRefresh((value) => value + 1)}>
            โหลดใหม่
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="news-state" role="status">ยังไม่มีข่าวในหมวดนี้</p>
      ) : (
        <ol className="news-list">
          {items.map((item) => (
            <li className="news-item" key={item.id}>
              <div className="news-item-meta">
                <span>{item.source || 'แหล่งข่าว'}</span>
                <time dateTime={item.publishedAt}>
                  {DATE_FORMAT.format(new Date(item.publishedAt))}
                </time>
                {item.asset && <span className="news-asset">{item.asset}</span>}
              </div>
              <h2>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h2>
              {item.summary && <p>{item.summary}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}