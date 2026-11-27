# Kovax Admin — Kijan pou mete l mache (10 minit)

1. **Supabase** → SQL Editor → kole tout `supabase/schema.sql` → Run.
2. **Supabase → Project Settings → API**: kopye `Project URL` ak `service_role key` (SEKRÈ, pa mete l nan paj piblik).
3. **Vercel → Settings → Environment Variables**, ajoute:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
   - `ADMIN_PASSWORD` = yon modpas fò (nenpòt longè ≥ 12)
   - `ADMIN_EMAIL` = email admin (default: kovaxacademy@gmail.com)
   - (deja genyen) `RESEND_API_KEY`, `ANTHROPIC_API_KEY`...
4. Upload zip sa a sou GitHub/Vercel (redeploy). Ale sou **https://kovax-academy.vercel.app/admin**.

## Sa admin lan fè
- **Dashboard**: vizitè jodi a/inik, paj vizite, peyi, aparèy, sous, kòb pa jou.
- **Pèman**: tout pèman (PayPal otomatik, Zelle an atant), chanje estati, ajoute manyèlman.
- **Tèks / Imaj**: ~450 tèks ak imaj modifyab sou 8 paj (upload imaj dirèk).
- **Pri**: pri kou, frè, tax USA, abònman → chanje montan paiement.html chaje.
- **Koulè**: koulè sit la.
- **Paj yo**: kreye nouvo paj (`/p/non-paj`), modifye, efase.
- **Erè & Sante**: tcheke paramèt Vercel/Supabase, chak paj, ak erè vizitè yo rankontre.

## Fichye nouvo
`admin.html`, `analytics.js` (swivi + koulè + tèks), `api/site.js`, `api/admin.js`, `api/_db.js`, `api/_auth.js`,
`supabase/schema.sql`, `tools/prepare-pages.py` (deja egzekite — paj yo gen `data-k` / `data-ki`).
