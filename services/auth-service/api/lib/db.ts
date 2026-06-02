import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.AUTH_DATABASE_URL!)
export default sql
