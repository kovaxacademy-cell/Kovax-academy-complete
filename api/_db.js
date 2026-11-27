// Ti kliyan Supabase (REST) — pa bezwen okenn pakè npm.
const url = () => {                 // aksepte nenpot fòm: https://xxx.supabase.co, .../rest/v1/, oswa lyen dashboard la
  let u = (process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  if (!u) return '';
  const d = u.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i); if (d) return `https://${d[1]}.supabase.co`;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u).origin; } catch { return u.replace(/\/+$/, ''); }
};
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const dbReady = () => !!(url() && key());

export async function db(path, { method = 'GET', body, prefer, all } = {}) {
  if (!dbReady()) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY pa mete sou Vercel.');
  const headers = { apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const run = async (extra = {}) => {
    const r = await fetch(`${url()}/rest/v1/${path}`, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text();
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : null;
  };
  if (!all) return run();
  let out = [];                       // paginasyon (Supabase limite 1000 ranje)
  for (let o = 0; o < 20000; o += 1000) {
    const page = await run({ Range: `${o}-${o + 999}` });
    out = out.concat(page || []);
    if (!page || page.length < 1000) break;
  }
  return out;
}

export async function uploadImage(name, buffer, contentType) {
  const r = await fetch(`${url()}/storage/v1/object/site-media/${name}`, {
    method: 'POST', headers: { apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': contentType, 'x-upsert': 'true' }, body: buffer });
  if (!r.ok) throw new Error('Upload echwe: ' + (await r.text()).slice(0, 200));
  return `${url()}/storage/v1/object/public/site-media/${name}`;
}

export async function signedUpload(name) {       // navigatè a voye fichye a dirèk bay Supabase (jis 50MB)
  const r = await fetch(`${url()}/storage/v1/object/upload/sign/site-media/${name}`, { method: 'POST', headers: { apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', 'x-upsert': 'true' }, body: '{}' });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.url) throw new Error('Pa ka prepare upload: ' + (j.message || r.status));
  return { uploadUrl: `${url()}/storage/v1${j.url}`, publicUrl: `${url()}/storage/v1/object/public/site-media/${name}` };
}

const H = () => ({ apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' });
export async function mediaList() {
  const r = await fetch(`${url()}/storage/v1/object/list/site-media`, { method: 'POST', headers: H(), body: JSON.stringify({ prefix: '', limit: 300, sortBy: { column: 'created_at', order: 'desc' } }) });
  const j = await r.json().catch(() => []); if (!r.ok) throw new Error('Pa ka li medya: ' + (j.message || r.status));
  return j.filter(f => f.name && f.id).map(f => ({ name: f.name, url: `${url()}/storage/v1/object/public/site-media/${f.name}` }));
}
export async function mediaDelete(name) {
  const r = await fetch(`${url()}/storage/v1/object/site-media`, { method: 'DELETE', headers: H(), body: JSON.stringify({ prefixes: [String(name)] }) });
  if (!r.ok) throw new Error('Pa ka efase fichye a.'); return { ok: true };
}
