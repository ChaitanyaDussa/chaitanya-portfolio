const { getPool, ensureTable } = require('../lib/db');
const { verifyToken, getBearerToken } = require('../lib/auth');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const session = verifyToken(getBearerToken(req));
  if (!session) {
    res.status(401).json({ error: 'Unauthorized — please log in again.' });
    return;
  }
  try {
    await ensureTable();
    const pool = getPool();
    const { newPassword, reset } = req.body || {};

    if (reset) {
      await pool.query("DELETE FROM portfolio_kv WHERE key = 'adminPasswordHash'");
      res.status(200).json({ ok: true });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }

    const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
    await pool.query(
      `INSERT INTO portfolio_kv (key, value, updated_at)
       VALUES ('adminPasswordHash', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = now()`,
      [JSON.stringify(hash)]
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
