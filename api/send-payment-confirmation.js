function cleanPhone(v){
  return String(v || "").replace(/\D/g, "");
}
function moneyText(v){
  if(v === undefined || v === null || v === "") return "—";
  return String(v);
}
function buildMessage(kind, data){
  const now = new Date().toLocaleString("fr-FR", { timeZone: "America/New_York" });
  if(kind === "payment"){
    return [
      "💳 *KOVAX ACADEMY — NOUVO PÈMAN*",
      "",
      "👤 Non: " + (data.fullName || data.name || "—"),
      "📧 Email: " + (data.email || "—"),
      "📚 Kou: " + (data.course || data.kou || "—"),
      "💰 Montan: " + moneyText(data.amount),
      "🧾 Metòd: " + (data.paymentType || data.mode || "—"),
      "🔖 Ref: " + (data.paymentId || data.ref || "—"),
      "🌎 Peyi: " + (data.country || data.peyi || "—"),
      "🕒 Dat: " + (data.date || now),
      "",
      "✅ Pèman konfime sou site Kovax."
    ].join("\n");
  }
  const cityState = [data.vil, data.eta].filter(Boolean).join(", ") || "—";
  return [
    "📝 *KOVAX ACADEMY — NOUVO ENSKRIPSYON*",
    "",
    "👤 Non: " + ((data.name || ((data.prenon || data.prenom || "") + " " + (data.nom || "")).trim()) || "—"),
    "📞 Telefòn: " + (data.telephone || data.phone || "—"),
    "📧 Email: " + (data.email || data.to_email || "—"),
    "📚 Kou: " + (data.course || data.cours || data.kou || "—"),
    "💰 Pri: " + (data.price || data.prix || "—"),
    "🌎 Peyi: " + (data.pays || data.peyi || "—"),
    "🏠 Vil/Eta: " + cityState,
    "🕒 Dat: " + now,
    "",
    "✅ Yon etidyan fè enskripsyon sou site Kovax."
  ].join("\n");
}
async function sendWhatsAppAdmin(kind, data){
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminPhone = cleanPhone(process.env.WHATSAPP_ADMIN_PHONE || process.env.WHATSAPP_TO);
  if(!token) throw new Error("WHATSAPP_TOKEN pa mete sou Vercel.");
  if(!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID pa mete sou Vercel.");
  if(!adminPhone) throw new Error("WHATSAPP_ADMIN_PHONE oswa WHATSAPP_TO pa mete sou Vercel.");
  const message = buildMessage(kind, data || {});
  const metaResp = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: adminPhone,
      type: "text",
      text: { preview_url: false, body: message }
    })
  });
  const metaData = await metaResp.json().catch(() => ({}));
  if(!metaResp.ok){
    const err = new Error(metaData?.error?.message || "WhatsApp message pa voye.");
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

  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Kovax Academy <onboarding@resend.dev>';
  const admin = process.env.ADMIN_EMAIL || 'kovaxacademy@gmail.com';
  const studentEmail = String(d.email || '').trim();
  const fullName = String(d.fullName || 'Etidyan');
  const warnings = [];
  let adminSent=false, studentSent=false, whatsappSent=false;

  const html = tableHtml('Konfimasyon Peman Kovax Academy', {
    Non: fullName, Email: studentEmail, Kou: d.course, Montan: d.amount,
    Tip_Peman: d.paymentType, ID_Peman: d.paymentId, Dat: d.date, Peyi: d.country
  });
  const studentHtml = `<div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px"><h2 style="color:#29ABE2">Peman Konfime Kovax Academy</h2><p>Bonjou ${escapeHtml(fullName)},</p><p>Nou resevwa konfimasyon peman ou.</p><p><b>Kou:</b> ${escapeHtml(d.course || '')}<br><b>Montan:</b> ${escapeHtml(d.amount || '')}</p></div>`;

  if (!apiKey) {
    warnings.push('RESEND_API_KEY pa mete. Email peman pa voye, men WhatsApp ap eseye voye.');
  } else {
    try { const r = await sendResend(apiKey, { from, to:[admin], subject:'Konfimasyon Peman — Kovax Academy', html }); if(!r.ok) warnings.push('Admin peman pa ale: '+r.text); else adminSent=true; } catch(e){ warnings.push('Admin peman error: '+e.message); }
    if (studentEmail && studentEmail.includes('@')) {
      try { const r = await sendResend(apiKey, { from, to:[studentEmail], subject:'Peman Konfime — Kovax Academy', html:studentHtml }); if(!r.ok) warnings.push('Etidyan peman pa ale: '+r.text); else studentSent=true; } catch(e){ warnings.push('Etidyan peman error: '+e.message); }
    }
  }

  try {
    await sendWhatsAppAdmin('payment', d);
    whatsappSent = true;
  } catch(e) {
    warnings.push('WhatsApp peman pa ale: ' + (e.message || 'erè'));
  }

  return res.status(200).json({ success:true, adminSent, studentSent, whatsappSent, warnings });
}
async function sendResend(apiKey, payload){ const r = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}, body:JSON.stringify(payload) }); const text = await r.text(); return { ok:r.ok, text, status:r.status }; }
function tableHtml(title, data){ const rows = Object.entries(data).map(([k,v])=>`<tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>${escapeHtml(k)}</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(v || '—')}</td></tr>`).join(''); return `<div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px"><h2 style="color:#29ABE2">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%">${rows}</table></div>`; }
function escapeHtml(v){ return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
