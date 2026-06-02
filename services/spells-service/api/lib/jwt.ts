import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET)
  return payload as { userId: string; username: string }
}
