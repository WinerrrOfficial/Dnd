import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.SPELLS_DATABASE_URL!)
export default sql
