import type { VercelRequest, VercelResponse } from '@vercel/node'
import sql from '../lib/db'
import { verifyToken } from '../lib/jwt'
import { handlePreflight, setCors } from '../lib/cors'
import { extractToken } from '../lib/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  const { id } = req.query

  if (req.method === 'GET') {
    const race = await sql`SELECT * FROM races WHERE id = ${id as string}`
    if (race.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(race[0])
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
      DELETE FROM races
      WHERE id = ${id as string} AND source = 'user' AND created_by = ${payload.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return res.status(404).json({ error: 'Not found or not yours' })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
