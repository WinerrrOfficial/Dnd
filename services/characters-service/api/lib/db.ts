import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.CHARACTERS_DATABASE_URL!)
export default sql
