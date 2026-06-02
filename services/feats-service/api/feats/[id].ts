import type { VercelRequest, VercelResponse } from '@vercel/node'
import sql from '../lib/db'
import { verifyToken } from '../lib/jwt'
import { handlePreflight, setCors } from '../lib/cors'
import { extractToken } from '../lib/token'
import { getRouteId } from '../lib/route'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  const id = getRouteId(req.query)
  if (!id) return res.status(400).json({ error: 'Feat ID required' })

  if (req.method === 'GET') {
    try {
      const feat = await sql`SELECT * FROM feats WHERE id = ${id}`
      if (feat.length === 0) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(feat[0])
    } catch (e) {
      console.error('GET feat:', e)
      return res.status(500).json({ error: 'Database error' })
    }
  }

  if (req.method === 'DELETE') {
    const token = extractToken(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await sql`
      DELETE FROM feats
      WHERE id = ${id} AND source = 'user' AND created_by = ${payload.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return res.status(404).json({ error: 'Not found or not yours' })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
