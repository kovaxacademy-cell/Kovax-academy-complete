import { db, dbReady, uploadImage, signedUpload } from './_db.js';
import crypto from 'node:crypto';
import { checkLogin, makeToken, verifyToken } from './_auth.js';

const PAGES = ['index', 'paiement', 'enskripsyon', 'formulaire', 'merci', 'merci-peman', 'market', '404'];
const day = (d) => new Date(d).toISOString().slice(0, 10);
const enc = encodeURIComponent;

const actions = {
  async stats({ days = 30 }) {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const v = await db(`visits?select=created_at,path,visitor_id,country,device,referrer&created_at=gte.${since}&order=created_at.desc`, { all: true });
    const p = await db(`payments?select=created_at,amount,status,method&created_at=gte.${since}`, { all: true });
    const top = (k, n = 8) => Object.entries(v.reduce((m, x) => ((m[x[k] || '—'] = (m[x[k] || '—'] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).slice(0, n);
    const perDay = {}; for (let i = days - 1; i >= 0; i--) perDay[day(Date.now() - i * 864e5)] = { views: 0, money: 0, set: new Set() };
    v.forEach(x => { const d = perDay[day(x.created_at)]; if (d) { d.views++; d.set.add(x.visitor_id); } });
    p.filter(x => x.status === 'paid').forEach(x => { const d = perDay[day(x.created_at)]; if (d) d.money += +x.amount || 0; });
    const today = day(Date.now());
    return {
      views: v.length, visitors: new Set(v.map(x => x.visitor_id)).size,
      todayViews: perDay[today]?.views || 0, todayVisitors: perDay[today]?.set.size || 0,
      revenue: p.filter(x => x.status === 'paid').reduce((s, x) => s + (+x.amount || 0), 0),
      paid: p.filter(x => x.status === 'paid').length, pending: p.filter(x => x.status === 'pending').length, failed: p.filter(x => x.status === 'failed').length,
      series: Object.entries(perDay).map(([d, o]) => ({ d, views: o.views, visitors: o.set.size, money: o.money })),
      topPages: top('path'), topCountries: top('country'), devices: top('device', 4), referrers: top('referrer'),
      errors24h: (await db(`errors?select=id&resolved=eq.false&created_at=gte.${new Date(Date.now() - 864e5).toISOString()}`)).length
    };
  },
  payments: async ({ status }) => db(`payments?select=*&order=created_at.desc&limit=300${status ? `&status=eq.${enc(status)}` : ''}`),
  paymentStatus: async ({ id, status }) => db(`payments?id=eq.${+id}`, { method: 'PATCH', body: { status } }),
  async addPayment(b) { return db('payments', { method: 'POST', body: { method: b.method || 'zelle', status: b.status || 'paid', amount: +b.amount, email: b.email, name: b.name, course: b.course, ref: b.ref || null } }); },
  errors: async ({ resolved = false }) => db(`errors?select=*&resolved=eq.${!!resolved}&order=created_at.desc&limit=200`),
  resolveErrors: async ({ id }) => db(id ? `errors?id=eq.${+id}` : 'errors?resolved=eq.false', { method: 'PATCH', body: { resolved: true } }),
  async getAll() {
    const [s, c, pg] = await Promise.all([db('settings?select=key,value'), db('content?select=key,value'), db('pages?select=slug,title,published,updated_at&order=updated_at.desc')]);
    return { settings: Object.fromEntries(s.map(x => [x.key, x.value])), content: Object.fromEntries(c.map(x => [x.key, x.value])), pages: pg, staticPages: PAGES };
  },
  async saveSettings({ settings }) {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    return db('settings?on_conflict=key', { method: 'POST', prefer: 'resolution=merge-duplicates', body: rows });
  },
  async saveContent({ items }) {            // items: {key: value}; value '' => retire modifikasyon an (retounen orijinal)
    const up = Object.entries(items).filter(([, v]) => v !== '' && v != null).map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
    const del = Object.entries(items).filter(([, v]) => v === '' || v == null).map(([k]) => k);
    if (up.length) await db('content?on_conflict=key', { method: 'POST', prefer: 'resolution=merge-duplicates', body: up });
    if (del.length) await db(`content?key=in.(${del.map(k => `"${k.replace(/"/g, '')}"`).join(',')})`, { method: 'DELETE' });
    return { saved: up.length, reset: del.length };
  },
  async uploadImage({ filename, data, type }) {
    const buf = Buffer.from(String(data).split(',').pop(), 'base64');
    if (buf.length > 3.5 * 1024 * 1024) throw new Error('Imaj twò gwo (max 3.5MB).');
    const ext = (filename.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    return { url: await uploadImage(`${Date.now()}.${ext}`, buf, type || 'image/png') };
  },
  async signUpload({ filename, type }) {
    const ext = (String(filename).split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!/^(mp4|webm|mov|m4v|mp3|wav|ogg|m4a)$/.test(ext)) throw new Error('Fòma pa aksepte (mp4, webm, mov, mp3, wav, ogg).');
    return signedUpload(`${Date.now()}.${ext}`);
  },
  async clonePage({ from, slug, title }, req) {         // kopye yon paj sit la kòm nouvo paj ak pwòp tèks pa li
    if (!PAGES.includes(from)) throw new Error('Paj orijinal la pa valid.');
    slug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    const r = await fetch(`https://${req.headers.host}/${from === 'index' ? '' : from}`); if (!r.ok) throw new Error('Pa ka li paj la (HTTP ' + r.status + ').');
    const html = (await r.text()).replace(/data-(k|ki)="([^"]+)"/g, (_m, a, k) => `data-${a}="${slug}:${k}"`);
    return actions.savePage({ slug, title: title || slug, html, published: true });
  },
  getPage: async ({ slug }) => (await db(`pages?slug=eq.${enc(slug)}&select=*`))[0] || null,
  async savePage({ slug, title, html, published = true }) {
    slug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    if (!slug || PAGES.includes(slug) || slug === 'admin') throw new Error('Slug envalid oswa rezève.');
    await db('pages?on_conflict=slug', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { slug, title, html, published, updated_at: new Date().toISOString() } });
    return { slug, url: `/p/${slug}` };
  },
  deletePage: async ({ slug }) => db(`pages?slug=eq.${enc(slug)}`, { method: 'DELETE' }),
  async health(_b, req) {
    const origin = `https://${req.headers.host}`; const checks = [];
    const env = (n, label, need = true) => checks.push({ name: label, ok: !!process.env[n], level: need ? 'erè' : 'avètisman', detail: process.env[n] ? 'mete' : `${n} manke sou Vercel` });
    env('SUPABASE_URL', 'Supabase URL'); env('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service key'); env('ADMIN_PASSWORD', 'Modpas admin');
    env('RESEND_API_KEY', 'Resend (email)', false); env('ANTHROPIC_API_KEY', 'Chat AI', false);
    try { await db('settings?select=key&limit=1'); checks.push({ name: 'Baz done Supabase', ok: true, detail: 'konekte' }); } catch (e) { checks.push({ name: 'Baz done Supabase', ok: false, level: 'erè', detail: e.message.slice(0, 160) }); }
    await Promise.all(PAGES.map(async (p) => {
      try { const r = await fetch(`${origin}/${p === 'index' ? '' : p}`, { redirect: 'follow' }); checks.push({ name: `Paj /${p === 'index' ? '' : p}`, ok: r.ok, level: 'erè', detail: `HTTP ${r.status}` }); }
      catch (e) { checks.push({ name: `Paj /${p}`, ok: false, level: 'erè', detail: e.message }); }
    }));
    for (const f of ['analytics.js', 'api/site?a=settings']) { try { const r = await fetch(`${origin}/${f}`); checks.push({ name: `/${f}`, ok: r.ok, level: 'erè', detail: `HTTP ${r.status}` }); } catch (e) { checks.push({ name: `/${f}`, ok: false, level: 'erè', detail: e.message }); } }
    return { checks, at: new Date().toISOString() };
  }
};


// ---- Face ID / Touch ID (WebAuthn / passkey) ----
const hostOf = (req) => String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
const getKeys = async () => (await db('settings?key=eq._passkeys&select=value'))[0]?.value || [];
const putKeys = (list) => db('settings?on_conflict=key', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: '_passkeys', value: list, updated_at: new Date().toISOString() } });
function clientCheck(req, b64, type) {
  const raw = Buffer.from(b64, 'base64url'), c = JSON.parse(raw.toString());
  if (c.type !== type) throw new Error('Rekèt Face ID pa valid.');
  if (c.origin !== `https://${hostOf(req)}`) throw new Error('Domèn pa matche (Face ID mare ak domèn kote ou anrejistre l la).');
  if (!verifyToken(Buffer.from(c.challenge, 'base64url').toString(), 'c')) throw new Error('Defi ekspire. Eseye ankò.');
  return raw;
}
const pk = {
  async passkeyOptions() { return { challenge: makeToken(120e3, 'c'), ids: (await getKeys()).map(k => k.id) }; },
  async passkeyRegister(b, req) {
    clientCheck(req, b.clientDataJSON, 'webauthn.create');
    crypto.createPublicKey({ key: Buffer.from(b.pub, 'base64'), format: 'der', type: 'spki' });   // verifye kle a valid
    const list = (await getKeys()).filter(k => k.id !== b.id).concat({ id: b.id, pub: b.pub, at: new Date().toISOString() });
    await putKeys(list); return { count: list.length };
  },
  async passkeyReset() { await putKeys([]); return { count: 0 }; },
  async passkeyLogin(b, req) {
    const k = (await getKeys()).find(x => x.id === b.id); if (!k) throw new Error('Face ID sa a pa anrejistre.');
    const cd = clientCheck(req, b.clientDataJSON, 'webauthn.get'), ad = Buffer.from(b.authenticatorData, 'base64url');
    const rp = crypto.createHash('sha256').update(hostOf(req).split(':')[0]).digest();
    if (!ad.subarray(0, 32).equals(rp) || !(ad[32] & 1)) throw new Error('Verifikasyon echwe.');
    const data = Buffer.concat([ad, crypto.createHash('sha256').update(cd).digest()]);
    const key = crypto.createPublicKey({ key: Buffer.from(k.pub, 'base64'), format: 'der', type: 'spki' });
    if (!crypto.verify('sha256', data, key, Buffer.from(b.signature, 'base64url'))) throw new Error('Siyati Face ID pa bon.');
    return { token: makeToken() };
  }
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST sèlman' });
  let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch {}
  try {
    if (b.action === 'login') {
      if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD pa mete sou Vercel.' });
      if (!checkLogin(b.email, b.password)) { await new Promise(r => setTimeout(r, 900)); return res.status(401).json({ error: 'Email oswa modpas pa bon.' }); }
      return res.status(200).json({ token: makeToken() });
    }
    if (b.action === 'passkeyOptions' || b.action === 'passkeyLogin') {
      if (!dbReady()) return res.status(500).json({ error: 'Supabase pa konfigire.' });
      try { return res.status(200).json({ data: await pk[b.action](b, req) }); } catch (e) { return res.status(400).json({ error: e.message }); }
    }
    if (!verifyToken(req.headers.authorization)) return res.status(401).json({ error: 'Sesyon fini. Konekte ankò.' });
    if (!dbReady() && b.action !== 'health') return res.status(500).json({ error: 'Supabase pa konfigire (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).' });
    const fn = actions[b.action] || (b.action === 'passkeyRegister' || b.action === 'passkeyReset' ? (x, r) => pk[b.action](x, r) : null); if (!fn) return res.status(400).json({ error: 'Aksyon enkoni.' });
    return res.status(200).json({ data: await fn(b, req) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
