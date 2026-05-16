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

## Q4 2026 — Fase 2: Personalisering for flere brukere

**Mål:** Klar for 2-5 testbrukere.

- Supabase Auth (Google OAuth + e-post)
- Onboarding med interesse-velger
- Integrere discovery-system (`lib/content/discovery/`) i onboarding
- Brukerlagte kilder med paywall-validering (`validateManualSource`)
- Per-bruker schema (user_topics, user_topic_sources)
- "Slett konto"-funksjon (GDPR)

## 2027 — Fase 3: Vanebygging og digest

- Bento-grid hjemskjerm
- Lesestreak
- Ukentlig e-post-digest (Resend.com)
- PWA-installasjon + Serwist
- Refleksjons-prompts og ukentlig læringsrapport

---

*Sist oppdatert: 2026-05-16 — SOLO-MVP deployet*
