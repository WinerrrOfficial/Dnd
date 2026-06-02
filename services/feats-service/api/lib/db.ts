import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.FEATS_DATABASE_URL!)
export default sql
