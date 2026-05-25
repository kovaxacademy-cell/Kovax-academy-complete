function cleanPhone(v){
  return String(v || "").replace(/\D/g, "");
}
function moneyText(v){
  if(v === undefined || v === null || v === "") return "—";
  return String(v);
}
function escapeHtml(v){ 
  return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); 
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
    headers: { 
      "Authorization": `Bearer ${token}`, 
      "Content-Type": "application/json" 
    },
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

async function sendResend(apiKey, payload){
  const r = await fetch('https://api.resend.com/emails', { 
    method:'POST', 
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}, 
    body:JSON.stringify(payload) 
  });
  const text = await r.text(); 
  return { ok: r.ok, text, status: r.status };
}

function tableHtml(title, data){
  const rows = Object.entries(data)
    .filter(([,v]) => v !== undefined && v !== null && v !== '')
    .map(([k,v])=>`<tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>${escapeHtml(k)}</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(v || '—')}</td></tr>`)
    .join('');
  return `<div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px"><h2 style="color:#29ABE2">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%">${rows}</table></div>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

  let d;
  try {
    d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch(e) {
    return res.status(400).json({ success:false, error:'Body JSON pa valid.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Kovax Academy <onboarding@resend.dev>';
  const admin = process.env.ADMIN_EMAIL || 'kovaxacademy@gmail.com';
  const studentEmail = String(d.email || d.to_email || '').trim();
  const fullName = String(d.name || `${d.prenon || ''} ${d.nom || ''}`).trim() || 'Etidyan';
  const warnings = [];
  let adminSent = false, studentSent = false, whatsappSent = false;

  // --- EMAIL (Resend) ---
  const adminHtml = tableHtml('Nouvo Enskripsyon Kovax Academy', {
    Non: fullName, 
    Email: studentEmail, 
    Telefon: d.telephone || d.phone, 
    Kou: d.kou || d.cours || d.course,
    Pri: d.prix || d.price, 
    Detay: d.detail, 
    Peyi: d.peyi || d.pays, 
    Seks: d.sex,
    Dat_Nesans: d.birthdate, 
    Email_Verifye: d.email_verified,
    Adres: d.adresse1, 
    Adres_2: d.adresse2, 
    Vil: d.vil, 
    Eta: d.eta, 
    ZIP: d.zip, 
    Peyi_Adres: d.pays_adresse
  });

  const studentHtml = `
    <div style="font-family:Arial,sans-serif;background:#06091A;color:#fff;padding:24px;border-radius:16px">
      <h2 style="color:#29ABE2;margin-top:0">Enskripsyon Konfime — Kovax Academy</h2>
      <p>Bonjou ${escapeHtml(fullName)},</p>
      <p>Nou resevwa enskripsyon ou avèk siksè. Ekip nou an ap kontakte ou trè byento.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Kou</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(d.kou || d.cours || d.course || '—')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Pri</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(d.prix || d.price || '—')}</td></tr>
        ${d.detail ? `<tr><td style="padding:8px;border:1px solid #334155;color:#29ABE2"><b>Detay</b></td><td style="padding:8px;border:1px solid #334155">${escapeHtml(d.detail)}</td></tr>` : ''}
      </table>
      <p style="color:#94a3b8;font-size:13px">Kovax Academy — Depase Tout Limit ak Teknoloji.</p>
    </div>`;

  if (!apiKey) {
    warnings.push('RESEND_API_KEY pa mete. Email yo pa voye.');
  } else {
    // Email bay admin
    try {
      const r = await sendResend(apiKey, { 
        from, to:[admin], 
        subject:'Nouvo Enskripsyon — Kovax Academy', 
        html: adminHtml 
      });
      if (!r.ok) warnings.push('Admin email pa ale: ' + r.text); 
      else adminSent = true;
    } catch(e){ 
      warnings.push('Admin email error: ' + e.message); 
    }

    // Email bay etidyan
    if (studentEmail && studentEmail.includes('@')) {
      try {
        const r = await sendResend(apiKey, { 
          from, to:[studentEmail], 
          subject:'Enskripsyon Konfime — Kovax Academy', 
          html: studentHtml 
        });
        if (!r.ok) warnings.push('Etidyan email pa ale: ' + r.text); 
        else studentSent = true;
      } catch(e){ 
        warnings.push('Etidyan email error: ' + e.message); 
      }
    } else {
      warnings.push('Email etidyan pa valid oswa pa bay — email konfirmasyon pa voye.');
    }
  }

  // --- WHATSAPP (Admin notifikasyon sèlman) ---
  try {
    await sendWhatsAppAdmin('registration', { 
      ...d, 
      name: fullName, 
      course: d.kou || d.cours || d.course, 
      price: d.prix || d.price 
    });
    whatsappSent = true;
  } catch(e) {
    // WhatsApp pa obligatwa — jis ajoute nan warnings
    warnings.push('WhatsApp admin notifikasyon pa ale: ' + (e.message || 'erè enkoni'));
  }

  return res.status(200).json({ 
    success: true, 
    adminSent, 
    studentSent, 
    whatsappSent, 
    warnings 
  });
}
