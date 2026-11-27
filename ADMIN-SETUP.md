[ADMIN-SETUP.md](https://github.com/user-attachments/files/35489867/ADMIN-SETUP.md)
[ADMIN-SETUP.md](https://github.com/user-attachments/files/35489344/ADMIN-SETUP.md)
# KOVAX ACADEMY — DEPLOYMENT / ADMIN SETUP

## 1) Upload
Mete fichye ki nan patch la nan menm rasin repository GitHub la (pa mete yo nan yon nouvo folder), epi fè Commit. Vercel dwe redeploy repository sa a.

## 2) Verifye bon Vercel project/domain
Nan Vercel > Project > Settings > Domains, itilize domèn ki mare ak pwojè `kovax-academy-complete`.
Pa sipoze `kovax-academy.vercel.app` se menm pwojè a. Si domèn sa a pa parèt nan Domains, sèvi ak domèn Production ki parèt la.
Apre deploy, verifye `/admin` ak `/admin.html`.

## 3) Supabase
Nan Supabase > SQL Editor, egzekite fichye `schema.sql` ki nan rasin repository a (pa `supabase/schema.sql`; chemen sa a pa egziste nan ZIP orijinal la).

## 4) Vercel Environment Variables
Ajoute nan Project > Settings > Environment Variables (Production; ajoute Preview/Development si w ap teste la tou):
- `SUPABASE_URL` = Project URL san `/rest/v1/`
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase Secret/service_role key (SEKRÈ; backend sèlman)
- `ADMIN_PASSWORD` = modpas admin solid, omwen 12 karaktè
- `ADMIN_EMAIL` = email admin ou (si li pa mete, default la se kovaxacademy@gmail.com)

Kòd `api/_db.js` la bezwen `SUPABASE_SERVICE_ROLE_KEY`, pa `SUPABASE_ANON_KEY`.
Kòd `api/_auth.js` la sèvi ak `ADMIN_PASSWORD` pou koneksyon. Admin lan pa itilize Supabase Auth Users pou login.
Pa janm mete `SUPABASE_SERVICE_ROLE_KEY` nan HTML/JS piblik, pa voye l nan chat, epi pa mete l kòm `NEXT_PUBLIC_...` oswa `VITE_...`.

## 5) Redeploy
Apre Environment Variables yo sove, ale nan Deployments > dènye deployment > meni `...` > Redeploy.
Tann status `Ready`.

## 6) Konekte
Ale sou domèn Production ki mare ak pwojè a, ajoute `/admin`.
Konekte ak `ADMIN_EMAIL` ak `ADMIN_PASSWORD`.

## Nòt sou done yo
- Vizitè yo parèt sèlman apre `analytics.js` ak `/api/site` ap mache epi moun vizite sit la.
- Tablo peman aktyèl la resevwa done nan paj retou a. Li pa verifye tranzaksyon PayPal dirèkteman sou sèvè a; pa konsidere revni dashboard la kòm kontablite final jiskaske webhook/server-side PayPal verification ajoute.
- Editè tèks/imatj la depann de eleman ki gen `data-k` / `data-ki`. Nan ZIP orijinal la, paj Akèy la gen tag sa yo; paj Market la pa gen yo. Donk Market la poko gen editè kontni konplè nan vèsyon sa a.

## 7) Face ID / Touch ID (nouvo)
Konekte ak modpas la, ale nan onglè **Sekirite** epi klike "Aktive sou aparèy sa a". Fè l sou menm domèn ou itilize pou admin lan (si domèn nan chanje, re-aktive l). Modpas la toujou mache kòm sekou.

## 8) SUPABASE_URL
Kounye a kòd la netwaye URL la otomatikman (aksepte tou `.../rest/v1/`). Men pi bon fòm nan se: `https://xxxx.supabase.co`.
