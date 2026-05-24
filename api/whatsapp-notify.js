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

  return [
    "📝 *KOVAX ACADEMY — NOUVO ENSKRIPSYON*",
    "",
    "👤 Non: " + ((data.name || ((data.prenon || data.prenom || "") + " " + (data.nom || "")).trim()) || "—"),
    "📞 Telefòn: " + (data.telephone || data.phone || "—"),
    "📧 Email: " + (data.email || "—"),
    "📚 Kou: " + (data.course || data.cours || data.kou || "—"),
    "💰 Pri: " + (data.price || data.prix || "—"),
    "🌎 Peyi: " + (data.pays || data.peyi || "—"),
    "🏠 Vil/Eta: " + [data.vil, data.eta].filter(Boolean).join(", ") || "—",
    "🕒 Dat: " + now,
    "",
    "✅ Yon etidyan fè enskripsyon sou site Kovax."
  ].join("\n");
}

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

  try{
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1178734638649555";
    const adminPhone = cleanPhone(process.env.WHATSAPP_ADMIN_PHONE || "19542124813");

    if(!token){
      return res.status(500).json({ success:false, error:"WHATSAPP_TOKEN pa mete sou Vercel." });
    }
    if(!phoneNumberId){
      return res.status(500).json({ success:false, error:"WHATSAPP_PHONE_NUMBER_ID pa mete sou Vercel." });
    }
    if(!adminPhone){
      return res.status(500).json({ success:false, error:"WHATSAPP_ADMIN_PHONE pa mete sou Vercel." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const kind = body.kind || "registration";
    const message = buildMessage(kind, body.data || body);

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
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const metaData = await metaResp.json().catch(() => ({}));

    if(!metaResp.ok){
      return res.status(metaResp.status).json({
        success:false,
        error: metaData.error?.message || "WhatsApp message pa voye.",
        details: metaData
      });
    }

    return res.status(200).json({ success:true, whatsapp: metaData });
  }catch(err){
    return res.status(500).json({ success:false, error: err.message || "WhatsApp server error" });
  }
};
