import { loadNews, sendApiError, setPublicApiHeaders } from './_lib/news.js'

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])
}

function renderRss({ items, meta }, category) {
  let siteUrl = 'https://news-daily-lemon.vercel.app'
  try {
    const configuredUrl = process.env.SITE_URL
    if (configuredUrl) {
      const parsed = new URL(configuredUrl)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') siteUrl = parsed.origin
    }
  } catch {
    // Keep the production URL when SITE_URL is invalid.
  }

  const feedUrl = new URL('/api/rss', siteUrl)
  if (category !== 'all') feedUrl.searchParams.set('category', category)

  const feedItems = items.map((item) => {
    const summary = item.summary.slice(0, 320)
    return `    <item>\n      <title>${escapeXml(item.title)}</title>\n      <link>${escapeXml(item.url)}</link>\n      <guid isPermaLink="false">${escapeXml(item.id)}</guid>\n      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>\n      <source>${escapeXml(item.source)}</source>\n      <category>${escapeXml(item.category)}</category>\n      <description>${escapeXml(summary)}</description>\n    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>News Daily - ${escapeXml(category)} news</title>\n    <link>${escapeXml(siteUrl)}</link>\n    <description>ข่าวจาก News Daily</description>\n    <language>th</language>\n    <lastBuildDate>${new Date(meta.generatedAt).toUTCString()}</lastBuildDate>\n    <atom:link href="${escapeXml(feedUrl.href)}" rel="self" type="application/rss+xml" />\n${feedItems}\n  </channel>\n</rss>\n`
}

export default async function handler(request, response) {
  setPublicApiHeaders(response)
  if (request.method === 'OPTIONS') return response.status(204).end()
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await loadNews(request.url)
    response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    if (request.method === 'HEAD') return response.status(200).end()
    return response.status(200).send(renderRss(result, result.meta.category))
  } catch (error) {
    return sendApiError(response, error)
  }
}

export { escapeXml, renderRss }