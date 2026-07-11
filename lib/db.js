// Shared Postgres connection for all /api routes.
// Works with Vercel Postgres (Neon) out of the box — it sets POSTGRES_URL
// automatically once you add the Postgres integration in the Vercel
// dashboard. Also works with any other Postgres provider (Supabase, Neon,
// Railway, etc.) — just set POSTGRES_URL yourself in that case.
const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('No POSTGRES_URL / DATABASE_URL environment variable set.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS portfolio_kv (
      key TEXT PRIMARY KEY,
      value JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  ensured = true;
}

module.exports = { getPool, ensureTable };
