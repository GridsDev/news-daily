import { useState, useEffect } from 'react'
import { articles } from './content.js'
import ArticleView from './components/ArticleView.jsx'
import HomeView from './components/HomeView.jsx'

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return raw ? decodeURIComponent(raw) : ''
}

export default function App() {
  const [slug, setSlug] = useState(parseHash)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const onHash = () => setSlug(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const go = (target) => {
    window.location.hash = target ? `/${encodeURIComponent(target)}` : ''
    setSlug(target)
    window.scrollTo({ top: 0 })
  }

  const current = slug ? articles.find((a) => a.slug === slug) : null

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <a
            className="brand"
            href="#/"
            onClick={(e) => {
              e.preventDefault()
              go('')
            }}
          >
            <span className="brand-mark">ND</span>
            <span className="brand-text">
              <strong>บทสรุปข่าวประจำวัน</strong>
              <small>คริปโต · เทคโนโลยี · ธุรกิจ</small>
            </span>
          </a>

          <div className="header-actions">
            <span className="count-badge">{articles.length} ฉบับ</span>
            <button
              className="theme-toggle"
              onClick={() => setDark((d) => !d)}
              aria-label="สลับธีม"
              title="สลับธีมสว่าง/มืด"
            >
              {dark ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </header>

      <main className="wrap main">
        {current ? (
          <ArticleView article={current} onBack={() => go('')} />
        ) : (
          <HomeView articles={articles} onOpen={go} />
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>สร้างอัตโนมัติโดย newsbot บนเครื่อง sv · อัปเดตทุกวัน 07:00 น.</p>
        </div>
      </footer>
    </>
  )
}
