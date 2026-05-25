function cleanPhone(v){
  return String(v || "").replace(/\D/g, "");
}

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS') return res.status(200).end();

  try{
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const to = cleanPhone(process.env.WHATSAPP_ADMIN_PHONE || process.env.WHATSAPP_TO);

    if(!token) return res.status(400).json({ success:false, error:'WHATSAPP_TOKEN pa mete sou Vercel.' });
    if(!phoneNumberId) return res.status(400).json({ success:false, error:'WHATSAPP_PHONE_NUMBER_ID pa mete sou Vercel.' });
    if(!to) return res.status(400).json({ success:false, error:'Mete WHATSAPP_TO oswa WHATSAPP_ADMIN_PHONE sou Vercel.' });

    const metaResp = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        messaging_product:'whatsapp',
        recipient_type:'individual',
        to,
        type:'text',
        text:{ preview_url:false, body:'✅ Test WhatsApp Kovax Academy: API a konekte byen.' }
      })
    });

    const data = await metaResp.json().catch(() => ({}));
    if(!metaResp.ok){
      return res.status(metaResp.status).json({ success:false, error:data?.error?.message || 'WhatsApp pa voye.', details:data });
    }
    return res.status(200).json({ success:true, to, whatsapp:data });
  }catch(e){
    return res.status(500).json({ success:false, error:e.message || 'Server error' });
  }
}
