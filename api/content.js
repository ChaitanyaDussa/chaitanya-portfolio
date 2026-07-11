const { getPool, ensureTable } = require('../lib/db');
const { verifyToken, getBearerToken } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    await ensureTable();
    const pool = getPool();

    if (req.method === 'GET') {
      const result = await pool.query('SELECT key, value FROM portfolio_kv');
      const out = {};
      result.rows.forEach((row) => {
        if (row.key === 'adminPasswordHash') return; // never expose this
        out[row.key] = row.value;
      });
      res.status(200).json(out);
      return;
    }

    if (req.method === 'POST') {
      const session = verifyToken(getBearerToken(req));
      if (!session) {
        res.status(401).json({ error: 'Unauthorized — please log in again.' });
        return;
      }
      const { key, value } = req.body || {};
      if (!key || typeof key !== 'string') {
        res.status(400).json({ error: 'key required' });
        return;
      }
      if (key === 'adminPasswordHash') {
        res.status(400).json({ error: 'Use /api/change-password for that.' });
        return;
      }

      if (value === null || value === undefined) {
        await pool.query('DELETE FROM portfolio_kv WHERE key = $1', [key]);
      } else {
        await pool.query(
          `INSERT INTO portfolio_kv (key, value, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now()`,
          [key, JSON.stringify(value)]
        );
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
