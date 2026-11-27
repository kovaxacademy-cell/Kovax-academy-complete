// Endpoint piblik: ?a=settings | track | error | payment | page
import { db, dbReady } from './_db.js';
const cut = (v, n = 300) => String(v ?? '').slice(0, n);
const body = (req) => { try { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch { return {}; } };
const device = (ua = '') => /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop';

export default async function handler(req, res) {
  const a = req.query.a;
  try {
    if (a === 'settings') {
      res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
      if (!dbReady()) return res.status(200).json({ settings: {}, content: {} });
      const [s, c] = await Promise.all([db('settings?select=key,value'), db('content?select=key,value')]);
      return res.status(200).json({ settings: Object.fromEntries(s.map(x => [x.key, x.value])), content: Object.fromEntries(c.map(x => [x.key, x.value])) });
    }
    if (a === 'page') {
      const rows = await db(`pages?slug=eq.${encodeURIComponent(cut(req.query.slug, 60))}&published=eq.true&select=title,html`);
      if (!rows?.length) return res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send('<h1>404</h1><a href="/">Retounen</a>');
      let h = rows[0].html;
      if (!/analytics\.js/.test(h)) h = h.replace(/<\/body>/i, '<script defer src="/analytics.js"></script></body>') + (/<\/body>/i.test(h) ? '' : '<script defer src="/analytics.js"></script>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 's-maxage=20');
      return res.status(200).send(h);
    }
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    if (!dbReady()) return res.status(200).json({ ok: false, reason: 'db' });
    const b = body(req), ua = cut(req.headers['user-agent'], 250);
    if (a === 'track') {
      await db('visits', { method: 'POST', body: { path: cut(b.path, 200), visitor_id: cut(b.vid, 40), session_id: cut(b.sid, 40), referrer: cut(b.ref, 200), country: cut(req.headers['x-vercel-ip-country'], 4), device: device(ua), ua } });
    } else if (a === 'error') {
      await db('errors', { method: 'POST', body: { kind: cut(b.kind, 30) || 'js', message: cut(b.message, 500), page: cut(b.page, 200), stack: cut(b.stack, 1500), ua } });
    } else if (a === 'payment') {
      const amount = parseFloat(b.amount); const ref = cut(b.ref, 80) || null;
      const method = cut(b.method, 40) || 'paypal';
      const status = /zelle/i.test(method) ? 'pending' : (b.status === 'failed' ? 'failed' : 'paid');
      await db('payments?on_conflict=ref', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: { method, status, amount: isNaN(amount) ? null : amount, ref, email: cut(b.email, 120), name: cut(b.name, 120), course: cut(b.course, 60), country: cut(b.country, 60) || cut(req.headers['x-vercel-ip-country'], 4) } });
    } else return res.status(400).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(200).json({ ok: false, error: e.message }); }   // pa janm kase sit la
}
