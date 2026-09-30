import { useState, useEffect, useCallback } from 'react'
import { fetchLikes, addLike } from '../lib/likes.js'

/**
 * ปุ่ม Like — นับความนิยมต่อบทความ
 *
 * ข้อจำกัด: เว็บไม่มี login → กันกดซ้ำด้วย localStorage (ล้างแล้วกดซ้ำได้)
 * ดูรายละเอียดใน src/lib/likes.js
 */
export default function LikeButton({ date, compact = false }) {
  const [count, setCount] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    if (!date) return
    fetchLikes(date)
      .then((n) => alive && setCount(n))
      .catch((err) => {
        console.warn('[like] โหลดยอดไม่สำเร็จ:', err.message)
        if (alive) setCount(0)
      })
    return () => {
      alive = false
    }
  }, [date])

  const onLike = useCallback(async () => {
    if (busy || !date) return
    setBusy(true)
    setError(null)
    try {
      const next = await addLike(date)
      if (next === null) {
        setError('กดไลก์ของเครื่องนี้ไปแล้ว')
        setTimeout(() => setError(null), 2500)
      } else if (next !== null) {
        setCount(next)
      }
    } catch (err) {
      console.warn('[like] กดไม่สำเร็จ:', err.message)
      setError('กดไลก์ไม่สำเร็จ ลองใหม่อีกครั้ง')
      setTimeout(() => setError(null), 2500)
    } finally {
      setBusy(false)
    }
  }, [busy, date])

  return (
    <div className={`like-wrap${compact ? ' like-wrap-compact' : ''}`}>
      <button
        className="like-btn"
        onClick={onLike}
        disabled={busy || count === null}
        title={count === null ? 'กำลังโหลด' : 'ถูกใจบทความนี้'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
          <path
            fill="currentColor"
            d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
          />
        </svg>
        {count === null ? '…' : count}
      </button>
      {error && <span className="like-note">{error}</span>}
    </div>
  )
}
