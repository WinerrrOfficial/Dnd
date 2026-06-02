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

  const users = await sql`SELECT * FROM users WHERE username = ${username}`
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const user = users[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const userId = String(user.id)
  const token = await createToken(userId, user.username)

  res.setHeader(
    'Set-Cookie',
    `dnd_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  )
  return res.status(200).json({
    token,
    user: { id: userId, username: user.username },
  })
}
