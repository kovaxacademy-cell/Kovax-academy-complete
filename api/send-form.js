export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Kovax Academy <onboarding@resend.dev>';
  const admin = process.env.ADMIN_EMAIL || 'kovaxacademy@gmail.com';
  const studentEmail = String(d.email || d.to_email || '').trim();
  const fullName = String(d.name || `${d.prenon || ''} ${d.nom || ''}`).trim() || 'Etidyan';
  const warnings = [];

  const adminHtml = tableHtml('Nouvo Enskripsyon Kovax Academy', {
    Non: fullName, Email: studentEmail, Telefon: d.telephone, Kou: d.kou || d.cours,
    Pri: d.prix, Detay: d.detail, Peyi: d.peyi || d.pays, Seks: d.sex,
    Dat_Nesans: d.birthdate, Email_Verifye: d.email_verified,
    Adres: d.adresse1, Adres_2: d.adresse2, Vil: d.vil, Eta: d.eta, ZIP: d.zip, Peyi_Adres: d.pays_adresse
  });

  const studentHtml = `
    <div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px">
      <h2 style="color:#29ABE2;margin-top:0">Enskripsyon Konfime Kovax Academy</h2>
      <p>Bonjou ${escapeHtml(fullName)},</p>
      <p>Nou resevwa enskripsyon ou avèk siksè.</p>
      <p><b>Kou:</b> ${escapeHtml(d.kou || d.cours || '')}<br><b>Pri:</b> ${escapeHtml(d.prix || '')}<br><b>Detay:</b> ${escapeHtml(d.detail || '')}</p>
      <p>Kovax Academy — Depase Tout Limit ak Teknoloji.</p>
    </div>`;

  if (!apiKey) return res.status(200).json({ success:true, warnings:['RESEND_API_KEY pa mete. Fòmilè a pa ka voye pa email sou Vercel.'] });

  let adminSent = false;
  try {
    const r = await sendResend(apiKey, { from, to:[admin], subject:'Nouvo Enskripsyon — Kovax Academy', html:adminHtml });
    if (!r.ok) warnings.push('Admin email pa ale: ' + r.text); else adminSent = true;
  } catch(e){ warnings.push('Admin email error: ' + e.message); }

  let studentSent = false;
  if (studentEmail && studentEmail.includes('@')) {
    try {
      const r = await sendResend(apiKey, { from, to:[studentEmail], subject:'Enskripsyon Konfime — Kovax Academy', html:studentHtml });
      if (!r.ok) warnings.push('Etidyan email pa ale: ' + r.text); else studentSent = true;
    } catch(e){ warnings.push('Etidyan email error: ' + e.message); }
  }

  return res.status(200).json({ success:true, adminSent, studentSent, warnings });
}
async function sendResend(apiKey, payload){
  const r = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}, body:JSON.stringify(payload) });
  const text = await r.text(); return { ok:r.ok, text, status:r.status };
}
function tableHtml(title, data){
  const rows = Object.entries(data).map(([k,v])=>`<tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>${escapeHtml(k)}</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(v || '—')}</td></tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px"><h2 style="color:#29ABE2">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%">${rows}</table></div>`;
}
function escapeHtml(v){ return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
