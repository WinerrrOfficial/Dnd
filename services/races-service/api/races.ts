import type { VercelRequest, VercelResponse } from '@vercel/node'
import sql from './lib/db'
import { verifyToken } from './lib/jwt'
import { handlePreflight, setCors } from './lib/cors'
import { extractToken } from './lib/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  if (req.method === 'GET') {
    const token = extractToken(req)
    let userId: string | null = null

    if (token) {
      try {
        const payload = await verifyToken(token)
        userId = payload.userId
      } catch {
        /* guest: only system races */
      }
    }

    const races = userId
      ? await sql`
          SELECT * FROM races
          WHERE source = 'system' OR created_by = ${userId}
          ORDER BY source, name
        `
      : await sql`SELECT * FROM races WHERE source = 'system' ORDER BY name`

    return res.status(200).json(races)
  }

  if (req.method === 'POST') {
    const token = extractToken(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, description, traits } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Name required' })

    const result = await sql`
      INSERT INTO races (name, description, traits, source, created_by)
      VALUES (${name}, ${description || ''}, ${JSON.stringify(traits || {})}, 'user', ${payload.userId})
      RETURNING *
    `

    return res.status(201).json(result[0])
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
