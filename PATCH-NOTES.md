# Patch — sa ki chanje
1. Supabase: kole `supabase-fix.sql` (KOD 1 puis KOD 2, chak nan yon query apa).
2. Vercel: SUPABASE_SERVICE_ROLE_KEY = kle **service_role** (JWT ki kòmanse ak eyJ…) oswa **sb_secret_…**. PA kle anon/publishable. Redeploy.
3. Fichye ki chanje: api/_db.js, api/admin.js, admin.html, analytics.js, schema.sql (+ supabase-fix.sql nouvo).
4. Nouvo nan admin: drapo peyi + vizit tès (Dashboard), fòm nouvo pèman + Design paj peman + Tès (Pèman), onglè ✨ Animasyon & Ajoute, notifikasyon ki louvri Mesaj.
