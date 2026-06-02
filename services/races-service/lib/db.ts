import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.RACES_DATABASE_URL!)
export default sql
