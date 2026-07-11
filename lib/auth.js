// Small stateless signed-token helper for admin sessions.
// Not a full JWT library — just an HMAC-signed, base64url payload with an
// expiry, which is all we need for a single admin role with no user list.
const crypto = require('crypto');

const SECRET = process.env.ADMIN_TOKEN_SECRET;
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function requireSecret() {
  if (!SECRET) {
    throw new Error('ADMIN_TOKEN_SECRET environment variable is not set.');
  }
}

function issueToken() {
  requireSecret();
  const payload = { role: 'admin', exp: Date.now() + TTL_MS };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(payloadB64).digest());
  return payloadB64 + '.' + sig;
}

function verifyToken(token) {
  try {
    requireSecret();
    if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
    const [payloadB64, sig] = token.split('.');
    const expected = b64url(crypto.createHmac('sha256', SECRET).update(payloadB64).digest());
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(fromB64url(payloadB64).toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

module.exports = { issueToken, verifyToken, getBearerToken };
