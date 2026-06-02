import type { VercelRequest } from '@vercel/node'

export function getRouteId(query: VercelRequest['query']): string | null {
  const raw = query.id
  const id = Array.isArray(raw) ? raw[0] : raw
  return typeof id === 'string' ? id : null
}
