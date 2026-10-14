import assert from 'node:assert/strict'
import test from 'node:test'
import pg from 'pg'

import { ApiError, loadNews, parseNewsParams } from '../api/_lib/news.js'
import newsHandler from '../api/news.js'
import { escapeXml, renderRss } from '../api/rss.js'
import rssHandler from '../api/rss.js'

function mockResponse() {
  const state = { headers: {}, status: null, body: null, ended: false }
  const response = {
    setHeader(name, value) {
      state.headers[name.toLowerCase()] = value
      return response
    },
    status(code) {
      state.status = code
      return response
    },
    json(body) {
      state.body = body
      return response
    },
    send(body) {
      state.body = body
      return response
    },
    end() {
      state.ended = true
      return response
    },
  }
  return { response, state }
}

test('parses bounded category, limit, and since filters', () => {
  assert.deepEqual(
    parseNewsParams('/api/news?category=economy&limit=50&since=2026-10-01'),
    { category: 'economy', limit: 50, since: '2026-10-01T00:00:00.000Z' },
  )
})

test('rejects unknown categories and unbounded limits', () => {
  assert.throws(() => parseNewsParams('/api/news?category=private'), ApiError)
  assert.throws(() => parseNewsParams('/api/news?limit=101'), ApiError)
  assert.throws(() => parseNewsParams('/api/news?since=not-a-date'), ApiError)
})

test('loads only allowlisted tables and returns normalized news items', async () => {
  const requested = []
  const result = await loadNews('/api/news?category=technology&limit=3&since=2026-10-01', {
    env: { DATABASE_URL: 'postgresql://newsbot:test@db.example/news' },
    queryImpl: async (statement, values) => {
      requested.push({ statement, values })
      return { rows: [{
          url_hash: 'abc',
          url: 'https://source.example/story',
          title: 'ข่าว & เทคโนโลยี',
          summary: 'รายละเอียด',
          source_name: 'Example',
          published_at: '2026-10-14T12:00:00Z',
        }] }
    },
  })

  assert.equal(requested.length, 1)
  assert.match(requested[0].statement, /FROM public\.news_technology/)
  assert.match(requested[0].statement, /published_at >= \$1/)
  assert.deepEqual(requested[0].values, ['2026-10-01T00:00:00.000Z', 3])
  assert.deepEqual(result.items[0], {
    id: 'abc',
    category: 'technology',
    title: 'ข่าว & เทคโนโลยี',
    summary: 'รายละเอียด',
    source: 'Example',
    url: 'https://source.example/story',
    publishedAt: '2026-10-14T12:00:00.000Z',
  })
})

test('requires server-only DATABASE_URL', async () => {
  await assert.rejects(loadNews('/api/news', { env: {} }), ApiError)
  await assert.rejects(loadNews('/api/news', {
    env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'not-used' },
  }), ApiError)
})

test('escapes untrusted RSS fields and emits RSS 2.0', () => {
  assert.equal(escapeXml('A < B & "C"'), 'A &lt; B &amp; &quot;C&quot;')
  const rss = renderRss({
    meta: { category: 'general', generatedAt: '2026-10-14T12:00:00.000Z' },
    items: [{
      id: 'id-1',
      title: 'หัวข้อ <ข่าว>',
      url: 'https://source.example/story?a=1&b=2',
      publishedAt: '2026-10-14T12:00:00.000Z',
      source: 'Source & Co',
      category: 'general',
      summary: 'สรุป',
    }],
  }, 'general')

  assert.match(rss, /<rss version="2\.0"/)
  assert.match(rss, /หัวข้อ &lt;ข่าว&gt;/)
  assert.match(rss, /a=1&amp;b=2/)
})

test('JSON handler returns news and rejects write methods', async () => {
  const oldUrl = process.env.DATABASE_URL
  const oldQuery = pg.Pool.prototype.query
  process.env.DATABASE_URL = 'postgresql://newsbot:test@db.example/news'
  pg.Pool.prototype.query = async () => ({ rows: [{
      url_hash: 'abc',
      url: 'https://source.example/story',
      title: 'ข่าว',
      summary: '',
      source_name: 'Example',
      published_at: '2026-10-14T12:00:00Z',
    }] })

  try {
    const { response, state } = mockResponse()
    await newsHandler({ method: 'GET', url: '/api/news?category=technology' }, response)
    assert.equal(state.status, 200)
    assert.equal(state.body.items[0].category, 'technology')

    const rejected = mockResponse()
    await newsHandler({ method: 'POST', url: '/api/news' }, rejected.response)
    assert.equal(rejected.state.status, 405)
  } finally {
    pg.Pool.prototype.query = oldQuery
    if (oldUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = oldUrl
  }
})

test('JSON handler does not cache configuration errors', async () => {
  const oldUrl = process.env.DATABASE_URL
  delete process.env.DATABASE_URL

  try {
    const { response, state } = mockResponse()
    await newsHandler({ method: 'GET', url: '/api/news' }, response)
    assert.equal(state.status, 503)
    assert.equal(state.headers['cache-control'], 'no-store')
  } finally {
    if (oldUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = oldUrl
  }
})

test('RSS handler returns RSS content type', async () => {
  const oldUrl = process.env.DATABASE_URL
  const oldQuery = pg.Pool.prototype.query
  process.env.DATABASE_URL = 'postgresql://newsbot:test@db.example/news'
  pg.Pool.prototype.query = async () => ({ rows: [] })

  try {
    const { response, state } = mockResponse()
    await rssHandler({ method: 'GET', url: '/api/rss?category=general' }, response)
    assert.equal(state.status, 200)
    assert.match(state.headers['content-type'], /application\/rss\+xml/)
    assert.match(state.body, /<rss version="2\.0"/)
  } finally {
    pg.Pool.prototype.query = oldQuery
    if (oldUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = oldUrl
  }
})