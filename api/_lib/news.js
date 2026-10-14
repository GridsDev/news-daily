import pg from 'pg'

const { Pool } = pg
const NEWS_TABLES = Object.freeze({
  crypto: { table: 'news_items', hasAsset: true },
  technology: { table: 'news_technology', hasAsset: false },
  economy: { table: 'news_economy', hasAsset: false },
  general: { table: 'news_general', hasAsset: false },
})

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const NEWS_FIELDS = 'url_hash,url,title,summary,source_name,published_at'
let pool

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function parseNewsParams(requestUrl) {
  const url = new URL(requestUrl, 'https://news-daily.invalid')
  const category = url.searchParams.get('category') || 'all'
  if (category !== 'all' && !Object.hasOwn(NEWS_TABLES, category)) {
    throw new ApiError(400, 'Unsupported category')
  }

  const rawLimit = url.searchParams.get('limit')
  const limit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ApiError(400, `limit must be an integer from 1 to ${MAX_LIMIT}`)
  }

  const rawSince = url.searchParams.get('since')
  let since = null
  if (rawSince !== null) {
    const timestamp = Date.parse(rawSince)
    if (!Number.isFinite(timestamp)) throw new ApiError(400, 'since must be a valid date')
    since = new Date(timestamp).toISOString()
  }

  return { category, limit, since }
}

function getPool(env) {
  if (!env.DATABASE_URL) throw new ApiError(503, 'News API is not configured')
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 2,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    })
  }
  return pool
}

function normalizeItem(row, category, hasAsset) {
  let url
  try {
    url = new URL(row.url)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const publishedAt = new Date(row.published_at)
  if (!Number.isFinite(publishedAt.getTime())) return null

  return {
    id: row.url_hash,
    category,
    ...(hasAsset && row.category ? { asset: row.category } : {}),
    title: String(row.title || ''),
    summary: String(row.summary || '').slice(0, 1000),
    source: String(row.source_name || ''),
    url: url.href,
    publishedAt: publishedAt.toISOString(),
  }
}

async function fetchTable({ category, table, hasAsset }, { limit, since }, queryImpl) {
  const selectedFields = hasAsset ? `${NEWS_FIELDS},category` : NEWS_FIELDS
  const where = since ? 'WHERE published_at >= $1' : ''
  const limitParameter = since ? '$2' : '$1'
  const values = since ? [since, limit] : [limit]
  const statement = `
    SELECT ${selectedFields}
    FROM public.${table}
    ${where}
    ORDER BY published_at DESC NULLS LAST
    LIMIT ${limitParameter}
  `

  try {
    const result = await queryImpl(statement, values)
    const rows = Array.isArray(result) ? result : result?.rows
    if (!Array.isArray(rows)) throw new Error('invalid query result')
    return rows.map((row) => normalizeItem(row, category, hasAsset)).filter(Boolean)
  } catch (error) {
    console.error('[news-api] PostgreSQL query failed', error?.code || error?.name || 'Error')
    throw new ApiError(502, 'Unable to load news')
  }
}

export async function loadNews(requestUrl, {
  env = process.env,
  queryImpl,
} = {}) {
  const params = parseNewsParams(requestUrl)
  const connectionPool = queryImpl ? null : getPool(env)
  const database = queryImpl || connectionPool.query.bind(connectionPool)
  const categories = params.category === 'all'
    ? Object.keys(NEWS_TABLES)
    : [params.category]

  const resultSets = await Promise.all(categories.map((category) =>
    fetchTable({ category, ...NEWS_TABLES[category] }, params, database),
  ))

  const items = resultSets.flat()
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, params.limit)

  return {
    items,
    meta: {
      category: params.category,
      count: items.length,
      limit: params.limit,
      since: params.since,
      generatedAt: new Date().toISOString(),
    },
  }
}

export function setPublicApiHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type')
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
}

export function sendApiError(response, error) {
  response.setHeader('Cache-Control', 'no-store')
  const status = error instanceof ApiError ? error.status : 500
  const message = error instanceof ApiError ? error.message : 'Internal server error'
  if (status >= 500 && !(error instanceof ApiError)) console.error('[news-api] request failed')
  return response.status(status).json({ error: message })
}

export { NEWS_TABLES }