import { loadNews, sendApiError, setPublicApiHeaders } from './_lib/news.js'

export default async function handler(request, response) {
  setPublicApiHeaders(response)
  if (request.method === 'OPTIONS') return response.status(204).end()
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await loadNews(request.url)
    if (request.method === 'HEAD') return response.status(200).end()
    return response.status(200).json(result)
  } catch (error) {
    return sendApiError(response, error)
  }
}