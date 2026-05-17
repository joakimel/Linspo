# Roadmap

Oppdateres løpende. Datoer er estimater, ikke forpliktelser.

## Q2 2026 — Definisjon og fundament ✅

**Mål:** Forstå problemet godt nok til å bygge riktig ting.

- ✅ Konkurranseanalyse i `01-research/competitor_analysis.md`
- ✅ Primær brukergruppe og behov definert
- ✅ Tech stack valgt (se `ADR-001`)
- ✅ MVP-spec i `02-documentation/Linspo_Outline_og_Konseptplan.md`
- ✅ Lokal MVP scaffoldet og fungerer end-to-end (2026-05-15)

## Q3 2026 — SOLO-MVP ✅

**Mål:** Et fungerende produkt som Joakim selv bruker daglig.

- ✅ Innhenting fra HackerNews (Algolia API) + 9 RSS-kilder (Smashing, NN/g, UX Collective, Liliputing, Retro Handhelds, Tom's Hardware m.fl.)
- ✅ AI-pipeline med Gemini Flash Lite, content extraction, anti-fabrikasjons-prompt
- ✅ Deploy til Cloudflare Worker via OpenNext (2026-05-16) — se ADR-004
- ✅ GitHub Actions daglig cron (07:00 norsk tid)
- ✅ Lest-status + 3-veis feedback + arkiv-side — se ADR-005
- ✅ Privacy policy
- ⏳ UptimeRobot keep-alive (utstilt — settes opp ved første Supabase-pause-symptom)
- ⏳ AI-vekting basert på feedback-data (etter 1-2 uker med ekte data)
- ⏳ `/uke`-side med ukentlig leserapport + 3 AI-genererte retropunkter (bruker eksisterende feedback-data)

## Q4 2026 — Fase 2: Personalisering for flere brukere

**Mål:** Klar for 2-5 testbrukere.

- Supabase Auth (Google OAuth + e-post)
- Onboarding med interesse-velger + sliders for interesse-nivå per tema
- Integrere discovery-system (`lib/content/discovery/`) i onboarding
- AI-drevet kilde-rotasjon — aktivér discovery-systemet til å foreslå nye kilder ukentlig basert på feedback-mønstre (gode kilder beholdes, dårlige roteres ut)
- Brukerlagte kilder med paywall-validering (`validateManualSource`)
- Per-bruker schema (user_topics, user_topic_sources)
- Ko-fi donasjons-knapp øverst på forsiden (krever ekstern konto-oppsett)
- "Slett konto"-funksjon (GDPR)

## 2027 — Fase 3: Vanebygging og digest

- Bento-grid hjemskjerm
- Lesestreak
- Ukentlig e-post-digest (Resend.com) — sender ukerapporten fra Fase 2 som e-post
- PWA-installasjon + Serwist
- Refleksjons-prompts og ukentlig læringsrapport
- Native app-bygg (Capacitor eller Tauri) med in-app webview for artikler

---

*Sist oppdatert: 2026-05-16 — SOLO-MVP deployet*
