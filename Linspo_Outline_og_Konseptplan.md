# Linspo — Outline og konseptplan

*Basert på research-rapport, mai 2026*

---

## Hva er Linspo?

Linspo er en personlig faglig kurator og læringsassistent. Den henter relevant innhold basert på brukerens interesser, prioriterer faglig verdi over clickbait, leverer et daglig digest, lager ukentlige oppsummeringer og foreslår konkrete oppgaver for å forankre det man leser — levert som PWA.

**Kjerneposisjon:** Ingen eksisterende produkt kombinerer daglig kuratert innhold, konkrete læringsoppgaver og gamifisert vanebygging for fagfolk. Linspo eier dette rommet.

---

## Fase 1 — MVP (Uke 1–4)

**Mål:** Fungerende app for én bruker (Joakim selv). Ingen design-polish. Bare funksjon.

### Det som må bygges:

1. **Supabase-oppsett**
   - Nytt prosjekt i EU-region (`eu-central-1` / Frankfurt)
   - Opprett tabellene: `articles`, `user_preferences`, `user_article_interactions`
   - Aktiver Row Level Security (RLS) på alle tabeller
   - Sett opp Supabase Auth (e-post/passord + Google OAuth)

2. **Next.js-prosjekt**
   - `npx create-next-app@latest linspo --typescript --tailwind --app`
   - Installer Serwist (`npm install serwist @serwist/next`)
   - Koble til Supabase (`npm install @supabase/supabase-js`)

3. **Innhentning — HackerNews API**
   - Én innholdskilde for MVP: HackerNews Algolia API
   - Filtrer på emner (UX, design, AI, teknologi)
   - Lag `/api/cron/fetch-content` route

4. **AI-sammendrag — Gemini Flash**
   - Sett opp Google AI SDK (`npm install @google/generative-ai`)
   - Prompt: sammendrag + score (1–10) + tags + vanskelighetsgrad
   - Lagre til `articles`-tabell

5. **Feed-visning**
   - Enkel kortliste med tittel, sammendrag, tags og lesetid
   - "Les" og "Lagre" som eneste handlinger på MVP
   - Ingen gamification ennå

6. **GitHub Actions cron**
   - `.github/workflows/daily-fetch.yml`
   - Kjøres kl. 05:00 UTC (07:00 norsk tid)
   - Beskytt endepunktet med `CRON_SECRET` miljøvariabel

7. **Cloudflare Pages deploy**
   - Koble GitHub-repo til Cloudflare Pages
   - Sett opp miljøvariabler i Cloudflare dashboard
   - Sett opp UptimeRobot til å pinge appen hvert 5. minutt (holder Supabase aktiv)

**MVP er ferdig når:** Joakim åpner appen på morgenene og ser 5 ferske artikler med AI-genererte sammendrag.

---

## Fase 2 — Personalisering (Uke 5–7)

**Mål:** Appen lærer hvem brukeren er og tilpasser seg.

1. **Onboarding-flyt (4 skjermbilder)**
   - Velg emner (chips/tags): UX, AI, Design Systems, Produktutvikling, Gaming + eget
   - Velg frekvens og tidspunkt for daglig pakke
   - Vis første innhold umiddelbart (ingen push-prompt ennå)

2. **Feedback-system**
   - Tommel opp ("Mer av dette") og X ("Ikke relevant") på hvert kort
   - Logg scrolldybde og åpning som implisitt signal
   - Lagre til `user_article_interactions`-tabell

3. **Personalisert scoring**
   - Vektet databasespørring mot brukerpreferanser (INGEN ny AI-kall per bruker)
   - Artiklene med høyest score vises øverst

4. **Flere innholdskilder**
   - The Guardian API (design, kultur, tech)
   - DEV.to API (webutvikling, UX)
   - RSS-feeds: Smashing Magazine, UX Collective, Nielsen Norman Group, The Verge

5. **Lagringsfunksjon**
   - "Lagrede" fane med artikler brukeren har bokmerket
   - Offline-tilgang via Service Worker (Serwist)

---

## Fase 3 — Digest og vanebygging (Uke 8–11)

**Mål:** Brukeren får en ukentlig læringsrapport og bygger en daglig vane.

1. **Bento-grid hjemskjerm**
   - Featured-kort (full bredde) + 2 mellomstore + 1 "ukens oppgave"
   - Daglig progress-ring: visuelt signal når pakken er fullført

2. **Daglig lesestreak**
   - Aktiveres ved faktisk lesing (>50 % scrollet)
   - Farget i indigo/blå (aldri grønn/rød)
   - Streak Freeze ("Fridager") — hindrer churn ved ferie

3. **Ukentlig digest**
   - GitHub Actions kjøres søndag kl. 08:00
   - AI (Gemini Flash) genererer oppsummering av ukas lesing
   - Foreslår 1–2 konkrete oppgaver eller refleksjonsspørsmål
   - Leveres som e-post via Resend.com (3 000 e-poster/mnd gratis)

4. **Push-notifikasjoner (Android)**
   - Web Push API med VAPID-autentisering
   - iOS i EU/EØS: IKKE mulig (DMA-begrensning) — bruk e-post
   - Push-prompt vises ETTER at bruker har lest én artikkel (70–85 % opt-in)

5. **PWA-manifest og installasjon**
   - `manifest.json` med alle påkrevde felter
   - "Legg til på hjemskjerm"-prompt etter 3. besøk
   - Splash screen tilpasset systemtema

---

## Fase 4 — Finpuss og vekst (løpende)

1. **Refleksjonsprompts som innholdskort**
   - Etter lesing: "Hva er én ting du kan anvende fra dette?"
   - Kort tekstfelt, valgfritt, gir belønnings-animasjon ved fullføring

2. **Interesseradar**
   - Visuell representasjon av hvilke emner brukeren har lest mest
   - Vises på profilsiden

3. **Ukentlig læringsrapport**
   - Hva du lærte · Hvilke emner dominerte · Forslag til neste uke

4. **Eventuelle betalende brukere**
   - Gratis: 3 artikler/dag + ukentlig digest
   - Pro (~$8–9/mnd): Ubegrenset + oppgaver + læringsrapport + egne læringsmål
   - Stripe Checkout for betalingshåndtering

---

## Designprinsipper

| Prinsipp | Praktisk uttrykk |
|----------|-----------------|
| Ro over stimulans | Ingen uendelig scroll. Daglig pakke, ikke feed. |
| Tillit og autoritet | Rene linjer, god typografi, konsistent spacing. |
| Brukerens kontroll | Brukeren vet alltid hvorfor de ser det de ser. |
| Kvalitet over kvantitet | Streak aktiveres ved lesing, ikke åpning. |

**Farger:** Blå (#1D4ED8) + Amber (#D97706) — fargeblindtrygt.
**Font:** Inter (Google Fonts, gratis) — konsekvent for UI og tekst.
**Layout:** Bento-grid på hjemskjerm. Kortmodus + Reader-view.

---

## Teknisk sjekkliste (gjør dette FØR du starter)

```
[ ] Supabase-prosjekt opprettet i eu-central-1 (Frankfurt)
[ ] .env.local opprettet og lagt til .gitignore
[ ] RLS aktivert på alle Supabase-tabeller
[ ] CRON_SECRET satt som miljøvariabel (ikke hardkodet)
[ ] DPA sjekket med Supabase og Google (Gemini API)
[ ] Privacy policy skrevet (bruk Iubenda gratis plan)
[ ] UptimeRobot satt opp for Supabase-ping og cron-monitorering
[ ] Rate limiting planlagt (Upstash Redis eller Cloudflare)
[ ] Serwist deaktivert i development-modus
[ ] Sentry gratis-tier satt opp for error tracking
```

---

## Hva du IKKE skal gjøre (ennå)

- Microservices, Kubernetes, event sourcing — monolitt er riktig for fase 1–3.
- Push-notifikasjoner til iOS-brukere i Norge — DMA hindrer dette.
- Rød/grønn som eneste distinktor for tilstander — du er fargeblind.
- Leaderboards — feil kontekst for faglig læring.
- Skalere arkitekturen før du har 500 aktive brukere.

---

## Den viktigste prioriteringen

> Funksjonell app med én bruker er bedre enn perfekt arkitektur uten brukere.

Start med HackerNews + Gemini + en enkel kortliste. Bruk den selv. La resten vokse fra reell erfaring.

---

*Joakim, du har alt du trenger for å starte. Neste steg er å åpne terminalen.*
