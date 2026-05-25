function cleanPhone(v){
  return String(v || "").replace(/\D/g, "");
}

function escapeHtml(v){
  return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
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

async function sendWhatsAppCode({ phone, code, name, course }){
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = cleanPhone(phone);

  if(!to) return { skipped:true, reason:'Pa gen nimewo WhatsApp etidyan.' };
  if(!token) throw new Error('WHATSAPP_TOKEN pa mete sou Vercel.');
  if(!phoneNumberId) throw new Error('WHATSAPP_PHONE_NUMBER_ID pa mete sou Vercel.');

  const msg = [
    '🔐 *KOVAX ACADEMY — KÒD VERIFIKASYON*',
    '',
    `Bonjou ${name || 'Etidyan'},`,
    `Kòd verifikasyon ou se: *${code}*`,
    '',
    `Kou: ${course || 'Kovax Academy'}`,
    'Pa pataje kòd sa ak okenn moun.'
  ].join('\n');

  const metaResp = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url:false, body: msg }
    })
  });
  const metaData = await metaResp.json().catch(() => ({}));
  if(!metaResp.ok){
    const err = new Error(metaData?.error?.message || 'WhatsApp kòd la pa voye.');
    err.status = metaResp.status;
    err.details = metaData;
    throw err;
  }
  return metaData;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim();
  const phone = String(body.phone || body.telephone || '').trim();
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
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#29ABE2;background:#10183a;padding:18px;border-radius:12px;text-align:center">${escapeHtml(code)}</div>
      <p style="color:#cbd5e1">Kou: ${escapeHtml(course)}</p>
      <p style="color:#94a3b8;font-size:13px">Menm kòd sa voye sou WhatsApp ou tou si nimewo a valid.</p>
    </div>`;

  let emailSent = false;
  let whatsappSent = false;

  if (apiKey) {
    try {
      const r = await sendResend(apiKey, { from, to:[email], subject:'Kòd Verifikasyon — Kovax Academy', html });
      if (!r.ok) warnings.push('Etidyan email pa ale: ' + r.text);
      else emailSent = true;
    } catch (e) { warnings.push('Etidyan email error: ' + e.message); }

    try {
      await sendResend(apiKey, { from, to:[admin], subject:'Kòd etidyan — Kovax Academy', html:`<p>Email etidyan: ${escapeHtml(email)}</p><p>WhatsApp: ${escapeHtml(phone || '—')}</p><p>Kòd: <b>${escapeHtml(code)}</b></p><p>Kou: ${escapeHtml(course)}</p>` });
    } catch (e) { warnings.push('Admin kopi kòd error: ' + e.message); }
  } else {
    warnings.push('RESEND_API_KEY pa mete sou Vercel. Email pa voye.');
  }

  try {
    const w = await sendWhatsAppCode({ phone, code, name, course });
    if(w?.skipped) warnings.push(w.reason);
    else whatsappSent = true;
  } catch (e) {
    warnings.push('WhatsApp kòd pa ale: ' + (e.message || 'erè'));
  }

  return res.status(200).json({ success:true, emailSent, whatsappSent, warnings });
}
