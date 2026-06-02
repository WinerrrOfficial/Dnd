import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import sql from '../lib/db'
import { createToken } from '../lib/jwt'
import { handlePreflight, setCors } from '../lib/cors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return
  setCors(res)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body || {}

  if (!username || !password || password.length < 4) {
    return res.status(400).json({ error: 'Username and password (min 4 chars) required' })
  }

  const existing = await sql`SELECT id FROM users WHERE username = ${username}`
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Username already taken' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const result = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username
  `

  const user = result[0]
  const userId = String(user.id)
  const token = await createToken(userId, user.username)

  res.setHeader(
    'Set-Cookie',
    `dnd_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  )
  return res.status(201).json({
    token,
    user: { id: userId, username: user.username },
  })
}
