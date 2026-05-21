export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim();
  const name = String(body.name || 'Etidyan').trim();
  const code = String(body.code || Math.floor(100000 + Math.random() * 900000));
  const course = String(body.course || 'Kou Kovax Academy');
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Kovax Academy <onboarding@resend.dev>';
  const admin = process.env.ADMIN_EMAIL || 'kovaxacademy@gmail.com';
  const warnings = [];

  if (!email || !email.includes('@')) return res.status(400).json({ success:false, error:'Email pa valid' });

  const html = `
    <div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px">
      <h2 style="color:#29ABE2;margin-top:0">Kòd Verifikasyon Kovax Academy</h2>
      <p>Bonjou ${escapeHtml(name)},</p>
      <p>Kòd verifikasyon ou se:</p>
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#29ABE2;background:#10183a;padding:18px;border-radius:12px;text-align:center">${code}</div>
      <p style="color:#cbd5e1">Kou: ${escapeHtml(course)}</p>
    </div>`;

  let emailSent = false;
  if (apiKey) {
    try {
      const r = await sendResend(apiKey, { from, to:[email], subject:'Kòd Verifikasyon — Kovax Academy', html });
      if (!r.ok) warnings.push('Etidyan email pa ale: ' + r.text);
      else emailSent = true;
    } catch (e) { warnings.push('Etidyan email error: ' + e.message); }

    // Kopi bay admin pou ou wè kòd la menm si Resend sandbox bloke etidyan an.
    try {
      await sendResend(apiKey, { from, to:[admin], subject:'Kòd etidyan — Kovax Academy', html:`<p>Email etidyan: ${escapeHtml(email)}</p><p>Kòd: <b>${code}</b></p><p>Kou: ${escapeHtml(course)}</p>` });
    } catch (e) { warnings.push('Admin kopi kòd error: ' + e.message); }
  } else {
    warnings.push('RESEND_API_KEY pa mete sou Vercel. Kòd la retounen sou paj la sèlman.');
  }

  return res.status(200).json({ success:true, emailSent, warnings });
}

async function sendResend(apiKey, payload){
  const r = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });
  const text = await r.text();
  return { ok:r.ok, status:r.status, text };
}
function escapeHtml(v){ return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
