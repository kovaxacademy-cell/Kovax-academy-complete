// Ti kliyan Supabase (REST) — pa bezwen okenn pakè npm.
const url = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
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
