const { getPool, ensureTable } = require('../lib/db');
const { issueToken } = require('../lib/auth');
const crypto = require('crypto');

// sha256("chaitanya-nxtwave") — only used the very first time, before anyone
// has changed the password via the Security tab (which then stores a hash
// in the database and this constant stops being used).
const DEFAULT_HASH = '26c5e113951dea22a6a66c152b7838fcb1792d08b7386b59b0fc92f06f3fccba';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password required' });
      return;
    }
    await ensureTable();
    const pool = getPool();
    const result = await pool.query("SELECT value FROM portfolio_kv WHERE key = 'adminPasswordHash'");
    const storedHash = result.rows.length ? result.rows[0].value : DEFAULT_HASH;
    const enteredHash = crypto.createHash('sha256').update(password).digest('hex');

    if (enteredHash !== storedHash) {
      // Small delay to make brute-forcing painfully slow.
      await new Promise((r) => setTimeout(r, 400));
      res.status(401).json({ error: 'Wrong password.' });
      return;
    }

    const token = issueToken();
    res.status(200).json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
