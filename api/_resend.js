const DEFAULT_ADMIN_EMAIL = "kovaxacademy@gmail.com";
const DEFAULT_FROM = "Kovax Academy <onboarding@resend.dev>";

export function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY pa mete sou Vercel Environment Variables." };
  return {
    apiKey,
    adminEmail: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    from: process.env.RESEND_FROM || DEFAULT_FROM,
    replyTo: process.env.REPLY_TO_EMAIL || process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL
  };
}

export function esc(value) {
  return String(value ?? "").replace(/[<>&"']/g, (c) => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", "\"":"&quot;", "'":"&#039;"}[c]));
}

export async function sendResendEmail({ apiKey, from, to, subject, html, replyTo }) {
  const payload = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || "Resend pa voye email la.");
    err.status = response.status;
    err.details = data;
    throw err;
  }
  return data;
}

export function methodGuard(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success:false, error:"Method not allowed" });
    return false;
  }
  return true;
}
