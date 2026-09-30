import { useState, useCallback } from 'react'
import { articleUrl } from '../lib/router.js'
import { LINE_ID } from '../config/site.js'

/**
 * ปุ่มแชร์ + เพิ่มเพื่อน LINE — ไม่ใช้ API key ใดๆ ทั้งสิ้น
 * · Facebook → เปิด dialog ของ Facebook (ผู้ใช้กดโพสต์เอง)
 * · LINE → ลิงก์ทางการของ LINE: line.me/R/ti/p/@<id>
 * · แชร์ → Web Share API (มือถือขึ้น native share sheet)
 * · คัดลอกลิงก์ → clipboard
 */
export default function ShareButtons({ article, compact = false }) {
  const [copied, setCopied] = useState(false)
  const [nativeShare, setNativeShare] = useState(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  )

  const url = articleUrl(article?.date)
  const title = article?.title || 'บทสรุปข่าวคริปโตประจำวัน'

  const shareText = [title, url].join('\n')

  const onFacebook = useCallback(() => {
    const sharer = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(sharer, '_blank', 'noopener,noreferrer,width=600,height=640')
  }, [url])

  const onLine = useCallback(() => {
    window.open(`https://line.me/R/ti/p/@${LINE_ID}`, '_blank', 'noopener,noreferrer')
  }, [])

  const onNative = useCallback(async () => {
    try {
      await navigator.share({ title, text: title, url })
    } catch (err) {
      // ผู้ใช้กดยกเลิก — ไม่ต้องทำอะไร
      if (err?.name !== 'AbortError') console.warn('[share]', err)
    }
  }, [title, url])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // เบราว์เซอร์ไม่อนุญาต clipboard (เช่น http) → ให้เลือกเอง
      window.prompt('คัดลอกลิงก์นี้', url)
    }
  }, [url])

  return (
    <div className={`share-bar${compact ? ' share-bar-compact' : ''}`}>
      <span className="share-label">แชร์</span>

      <button className="share-btn share-fb" onClick={onFacebook} title="แชร์ไป Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
          <path
            fill="currentColor"
            d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
          />
        </svg>
        Facebook
      </button>

      {LINE_ID && (
        <button className="share-btn share-line" onClick={onLine} title="เพิ่มเป็นเพื่อนใน LINE">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
            <path
              fill="currentColor"
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 4.57 3.14 8.47 7.47 9.88.27.06.63-.15.63-.42v-1.7c-3.04.66-3.68-1.29-3.68-1.29-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.66.08-.66 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.57 1.19 3.2.91.1-.71.38-1.19.7-1.46-2.43-.28-4.98-1.21-4.98-5.38 0-1.19.42-2.16 1.12-2.92-.11-.28-.49-1.39.11-2.9 0 0 .91-.29 2.99 1.12a10.4 10.4 0 0 1 5.44 0c2.08-1.41 2.99-1.12 2.99-1.12.6 1.51.22 2.62.11 2.9.7.76 1.12 1.73 1.12 2.92 0 4.18-2.56 5.1-4.99 5.37.39.34.74 1.01.74 2.04v3.03c0 .27.36.49.63.42a9.92 9.92 0 0 0 7.46-9.88C21.95 6.45 17.5 2 12.04 2Z"
            />
          </svg>
          เพิ่มเพื่อน LINE
        </button>
      )}

      {nativeShare && (
        <button className="share-btn" onClick={onNative} title="แชร์ผ่านแอปอื่น">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
            <path
              fill="currentColor"
              d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 2.92-2.92Z"
            />
          </svg>
          แชร์
        </button>
      )}

      <button className="share-btn" onClick={onCopy} title="คัดลอกลิงก์">
        <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
          <path
            fill="currentColor"
            d="M16 1a2 2 0 0 0-2 2v10a2 2 0 1 0 4 0V3a2 2 0 0 0-2-2Zm-8 4a2 2 0 0 0-2 2v12a2 2 0 1 0 4 0V7a2 2 0 0 0-2-2Z"
          />
          <path
            fill="currentColor"
            d="M9 4H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-2v2h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V4Z"
          />
        </svg>
        {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
      </button>
    </div>
  )
}
