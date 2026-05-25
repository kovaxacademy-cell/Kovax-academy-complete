function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

async function sendResend(apiKey, payload){
  const r = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch(e) {
    return res.status(400).json({ success:false, error:'Body JSON pa valid.' });
  }

  const email  = String(body.email || '').trim();
  const name   = String(body.name || 'Etidyan').trim();
  const code   = String(body.code || Math.floor(100000 + Math.random() * 900000));
  const course = String(body.course || 'Kou Kovax Academy');

  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM || 'Kovax Academy <onboarding@resend.dev>';
  const admin  = process.env.ADMIN_EMAIL  || 'kovaxacademy@gmail.com';
  const warnings = [];

  // Valide email
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success:false, error:'Email pa valid.' });
  }

  if (!apiKey) {
    return res.status(500).json({ success:false, error:'RESEND_API_KEY pa mete sou Vercel.' });
  }

  // HTML pou etidyan
  const studentHtml = `
    <div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:32px;border-radius:16px;max-width:480px;margin:0 auto">
      <h2 style="color:#29ABE2;margin-top:0;text-align:center">🔐 Kòd Verifikasyon</h2>
      <p style="color:#cbd5e1">Bonjou <b>${escapeHtml(name)}</b>,</p>
      <p style="color:#cbd5e1">Men kòd verifikasyon ou pou <b>${escapeHtml(course)}</b>:</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#29ABE2;background:#10183a;padding:20px;border-radius:12px;text-align:center;margin:24px 0">
        ${escapeHtml(code)}
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center">
        Kòd sa valid pou <b>10 minit</b>.<br>
        Pa pataje li ak okenn moun.
      </p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0">
      <p style="color:#64748b;font-size:12px;text-align:center">Kovax Academy — Depase Tout Limit ak Teknoloji</p>
    </div>`;

  // HTML pou admin (kopi)
  const adminHtml = `
    <div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px">
      <h2 style="color:#29ABE2">Kòd Verifikasyon Voye — Kovax Academy</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Email Etidyan</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Non</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Kòd</b></td><td style="padding:8px;border:1px solid #334155;font-size:20px;font-weight:bold;letter-spacing:4px">${escapeHtml(code)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Kou</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(course)}</td></tr>
      </table>
    </div>`;

  let emailSent = false;

  // Voye bay etidyan
  try {
    const r = await sendResend(apiKey, { 
      from, 
      to: [email], 
      subject: `${code} — Kòd Verifikasyon Kovax Academy`, 
      html: studentHtml 
    });
    if (!r.ok) warnings.push('Email etidyan pa ale: ' + r.text);
    else emailSent = true;
  } catch(e) { 
    warnings.push('Email etidyan error: ' + e.message); 
  }

  // Kopi bay admin (silensman, pa bloke repons)
  try {
    await sendResend(apiKey, { 
      from, 
      to: [admin], 
      subject: `Kòd voye pou ${email} — Kovax Academy`, 
      html: adminHtml 
    });
  } catch(e) { 
    warnings.push('Admin kopi pa ale: ' + e.message); 
  }

  if (!emailSent && warnings.length > 0) {
    return res.status(500).json({ success:false, error:'Email pa voye.', warnings });
  }

  return res.status(200).json({ 
    success: true, 
    emailSent,
    // Retounen kòd la pou frontend ka verifye lokal (opsyonèl — retire si ou vle plis sekirite)
    code,
    warnings 
  });
}
