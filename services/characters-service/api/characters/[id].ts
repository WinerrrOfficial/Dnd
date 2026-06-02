import type { VercelRequest, VercelResponse } from '@vercel/node'
import sql from '../lib/db'
import { verifyToken } from '../lib/jwt'
import { handlePreflight, setCors } from '../lib/cors'
import { extractToken } from '../lib/token'
import { fetchFeat, fetchRace, fetchSpell } from '../lib/fetch'
import { getRouteId } from '../lib/route'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  const id = getRouteId(req.query)
  if (!id) return res.status(400).json({ error: 'Character ID required' })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = extractToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  let payload
  try {
    payload = await verifyToken(token)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const chars = await sql`
    SELECT * FROM characters
    WHERE id = ${id} AND user_id = ${payload.userId}
  `

  if (chars.length === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  const character = chars[0]

  let race = null
  try {
    race = await fetchRace(token, character.race_id)
    if ((race as { error?: string }).error) race = null
  } catch {
    race = null
  }

  const spellLinks = await sql`
    SELECT spell_id FROM character_spells WHERE character_id = ${id}
  `
  const featLinks = await sql`
    SELECT feat_id FROM character_feats WHERE character_id = ${id}
  `

  const spells = []
  for (const row of spellLinks) {
    try {
      const spell = await fetchSpell(token, row.spell_id)
      if (!(spell as { error?: string }).error) spells.push(spell)
    } catch {
      /* skip */
    }
  }

  const feats = []
  for (const row of featLinks) {
    try {
      const feat = await fetchFeat(token, row.feat_id)
      if (!(feat as { error?: string }).error) feats.push(feat)
    } catch {
      /* skip */
    }
  }

  return res.status(200).json({
    ...character,
    race_name: (race as { name?: string } | null)?.name ?? '—',
    race_traits: (race as { traits?: unknown } | null)?.traits ?? {},
    spells,
    feats,
  })
}
