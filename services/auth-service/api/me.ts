import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from './lib/jwt'
import { handlePreflight, setCors } from './lib/cors'
import { extractToken } from './lib/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ user: null })
  }

  try {
    const payload = await verifyToken(token)
    return res.status(200).json({
      user: { id: payload.userId, username: payload.username },
    })
  } catch {
    return res.status(401).json({ user: null })
  }
}
