import crypto from 'node:crypto';
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
const b64 = (s) => Buffer.from(s).toString('base64url');
const sig = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export function checkLogin(email, password) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || 'kovaxacademy@gmail.com').toLowerCase();
  return same(String(email || '').toLowerCase().trim(), adminEmail) && same(password || '', pw);
}
export function makeToken() { const p = b64(JSON.stringify({ exp: Date.now() + 12 * 3600e3 })); return `${p}.${sig(p)}`; }
export function verifyToken(h = '') {
  const t = String(h).replace(/^Bearer\s+/i, ''); const [p, s] = t.split('.');
  if (!p || !s || !secret() || !same(s, sig(p))) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
