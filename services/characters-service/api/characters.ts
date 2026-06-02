import type { VercelRequest, VercelResponse } from '@vercel/node'
import sql from '../lib/db'
import { verifyToken } from '../lib/jwt'
import { validateCharacterData } from '../lib/validate'
import { handlePreflight, setCors } from '../lib/cors'
import { extractToken } from '../lib/token'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  if (req.method === 'GET') {
    const token = extractToken(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const chars = await sql`
      SELECT * FROM characters WHERE user_id = ${payload.userId}
      ORDER BY created_at DESC
    `

    return res.status(200).json(chars)
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

    const { name, race_id, class: cls, level, stats, spell_ids, feat_ids } = req.body || {}

    if (!name || !race_id) {
      return res.status(400).json({ error: 'Name and race_id required' })
    }

    const validationError = await validateCharacterData(
      token,
      race_id,
      spell_ids,
      feat_ids
    )
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const charResult = await sql`
      INSERT INTO characters (user_id, name, race_id, class, level, stats)
      VALUES (
        ${payload.userId},
        ${name},
        ${race_id},
        ${cls || ''},
        ${level || 1},
        ${JSON.stringify(stats || {})}
      )
      RETURNING *
    `
    const character = charResult[0]

    if (spell_ids?.length > 0) {
      for (const sid of spell_ids) {
        await sql`
          INSERT INTO character_spells (character_id, spell_id)
          VALUES (${character.id}, ${sid})
          ON CONFLICT DO NOTHING
        `
      }
    }

    if (feat_ids?.length > 0) {
      for (const fid of feat_ids) {
        await sql`
          INSERT INTO character_feats (character_id, feat_id)
          VALUES (${character.id}, ${fid})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return res.status(201).json(character)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
