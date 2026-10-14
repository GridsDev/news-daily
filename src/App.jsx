import { useState, useEffect } from 'react'
import { loadArticles } from './content-source.js'
import { parsePath, navigate } from './lib/router.js'
import ArticleView from './components/ArticleView.jsx'
import HomeView from './components/HomeView.jsx'
import NewsView from './components/NewsView.jsx'

export default function App() {
  const [route, setRoute] = useState(parsePath)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [articles, setArticles] = useState([])
  const [source, setSource] = useState('loading')

  useEffect(() => {
    let alive = true
    loadArticles().then((result) => {
      if (!alive) return
      setArticles(result.articles)
      setSource(result.source)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    // ปุ่มหลัง/หน้าแรก ของเบราว์เซอร์
    const onPop = () => setRoute(parsePath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const go = (target) => {
    navigate(target)
    setRoute(target)
  }

  const isNews = route === 'news'
  const current = route && !isNews
    ? articles.find((a) => a.date === route || a.slug === route)
    : null
  const loading = source === 'loading'

  useEffect(() => {
    document.title = isNews
      ? 'ข่าวล่าสุด · ข่าวประจำวัน'
      : current
      ? `${current.title} · บทสรุปข่าวคริปโต`
      : 'บทสรุปข่าวคริปโตประจำวัน · BTC ETH SOL'
  }, [current, isNews])

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault()
              go('')
            }}
          >
            <span className="brand-mark">ND</span>
            <span className="brand-text">
              <strong>บทสรุปข่าวคริปโต</strong>
              <small>BTC · ETH · SOL</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="เมนูหลัก">
            <a
              href="/"
              aria-current={!isNews && !current ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                go('')
              }}
            >
              บทสรุป
            </a>
            <a
              href="/ข่าว"
              aria-current={isNews ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                go('news')
              }}
            >
              ข่าวล่าสุด
            </a>
          </nav>

          <div className="header-actions">
            {!loading && <span className="count-badge">{articles.length} ฉบับ</span>}
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
        {loading ? (
          <p className="loading">กำลังโหลดบทสรุป…</p>
        ) : isNews ? (
          <NewsView />
        ) : current ? (
          <ArticleView article={current} onBack={() => go('')} />
        ) : (
          <HomeView articles={articles} onOpen={go} />
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>
            สร้างอัตโนมัติโดย newsbot บนเครื่อง sv · อัปเดตทุกวัน 05:00 น.
            {source === 'db' ? ' · ข้อมูลสดจากฐานข้อมูล' : source === 'bundle' ? ' · โหมดสำรอง' : ''}
          </p>
        </div>
      </footer>
    </>
  )
}
