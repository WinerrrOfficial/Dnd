import type { VercelRequest } from '@vercel/node'

export function extractToken(req: VercelRequest): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  const cookie = req.headers.cookie
  if (cookie) {
    const match = cookie.match(/dnd_token=([^;]+)/)
    return match?.[1]
  }
}
