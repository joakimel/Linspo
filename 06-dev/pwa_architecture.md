# PWA-arkitektur for Linspo – 2025/2026

## State of the art for PWA i 2025/2026

PWA er ikke lenger et nisjevalg – det er mainstream. Den globale PWA-markedsstørrelsen var $3,53 milliarder i 2024 og er prognostisert til $21,44 milliarder innen 2033. Med riktig service worker-caching laster en PWA på under 1 sekund og kjører 60fps animasjoner offline.

**Det viktigste nye i 2025/2026:**
- Safari 18.4 la til Declarative Web Push og Screen Wake Lock
- iOS 16.4+ støtter Web Push, men kun for installerte PWA-er (ikke i nettleser-tab)
- Cloudflare kjøpte Astro i januar 2026 – stort signal for rammeverkets fremtid
- Next.js 16 stabiliserte Turbopack for produksjon og nærmer seg General Availability for Partial Prerendering

---

## Rammeverksvalg: Next.js vs SvelteKit vs Astro vs Remix

### Next.js 16
**Passer best til:** SaaS-produkter, dashboards, sosiale nettverk, markedsplasser

**Fordeler for Linspo:**
- Størst React-økosystem – flest biblioteker, tutorials og Stack Overflow-svar
- Vercel-integrasjon er sømløs (preview deployments ut av boksen)
- App Router + Server Components reduserer klientside JavaScript betydelig
- Enklest å finne hjelp når man er ny til koding
- Serwist (successor til next-pwa) har god Next.js-integrasjon

**Ulemper:**
- Tyngre enn SvelteKit for ekvivalent funksjonalitet
- Turbopack krever fremdeles Webpack for Serwist service worker (per 2026)
- Vercel Hobby-plan forbyr kommersiell bruk

**Konklusjon for Linspo:** Best valg gitt at Joakim er ny til koding og vil lære. Størst community, mest ressurser.

---

### SvelteKit (med Svelte 5 Runes)
**Passer best til:** Ytelseskritiske apper der bundle-størrelse teller

**Fordeler:**
- 50–70% mindre JavaScript enn React-ekvivalent
- Svelte 5 Runes-systemet er kraftig og intuitivt
- Raskere Time to Interactive (TTI) og bedre INP-score

**Ulemper for Linspo:**
- Brattere læringskurve når man starter med koding
- Svelte-jobber er sjeldnere – lavere ecosystem-modenhet
- Færre PWA-plugins og eksempler

---

### Astro
**Passer best til:** Innholdstunge nettsteder, blogger, marketing sites

**Fordeler:**
- Sender null JavaScript til nettleseren som standard (kun for interaktive komponenter)
- 25% adopsjon blant utviklere, 29,2% vil lære det (høyest av alle rammeverk)
- Cloudflare-backing gir stabilitet

**Ulemper for Linspo:**
- Designet for primært statisk innhold, ikke interaktive apper
- Linspo trenger mye dynamikk (brukerpreferanser, real-time feedback)
- Dårligere fit for en "app-lignende" PWA

---

### Remix
**Passer best til:** Komplekse datamutasjoner, form-tunge apper

**Ulemper for Linspo:**
- Mindre community enn Next.js
- Ingen klar fordel for dette use caset

---

## Anbefaling: Next.js med App Router

**Valget er Next.js 16 med App Router.** Begrunnelse:
1. Joakim er ny til koding – størst community og flest ressurser
2. Best PWA-støtte via Serwist
3. Enkelt å deploye gratis på Cloudflare Pages (se hosting-fil)
4. React-kompetanse er mest verdifullt å lære for videre karriere

---

## Service Workers og offline-støtte

### Hva er nødvendig for Linspo
- **Offline-visning av cached innhold** – brukere skal se dagens feed selv uten internett
- **Background sync** – feedback og lesestatus synkroniseres når tilkobling er tilbake
- **Cache-first strategi for statiske assets** – CSS, JS, ikoner

### Hva er overkill for Linspo
- Full offline-editering
- Komplex sync-konfliktresolvering
- IndexedDB med full relasjonell datamodell lokalt

### Anbefalt verktøy: Serwist
Serwist er den anbefalte etterfølgeren til next-pwa (som ikke lenger vedlikeholdes aktivt). Bruk det med Next.js App Router.

```bash
npm install serwist @serwist/next
```

**Viktige fallgruver med service workers:**
- Rens application cache konstant under utvikling – utdatert cache gir mystiske feil
- Deaktiver Serwist i development, kun aktiver for produksjon/PWA-debugging
- Alle PWA-er må kjøres over HTTPS (localhost er eneste unntak)
- Brukere kan bli "stuck" på gammel versjon hvis versjonshåndtering ikke er riktig satt opp

### Caching-strategi for Linspo
```
Statiske assets (JS/CSS/bilder):   Cache First
API-kall til innholdsfeed:          Network First med 24t fallback
Brukerpreferanser:                  Stale-While-Revalidate
```

---

## Push-notifikasjoner – realistisk status 2025/2026

### Android
- Full støtte siden 2015
- Fungerer i nettleser uten installasjon
- Web Push API med VAPID-autentisering

### iOS – komplisert situasjon
**Hva fungerer:**
- iOS 16.4+: Web Push støttes for installerte PWA-er (Add to Home Screen via Safari)
- Safari 18.4 la til Declarative Web Push

**Kritiske begrensninger:**
- Push fungerer KUN når appen er installert på hjemskjermen via Safari → Del → Legg til på hjemskjerm
- En åpen Safari-tab er ikke nok
- Bruker må ha gitt eksplisitt tillatelse etter installasjon

**EU-problemet (viktig for norske brukere!):**
- iOS 17.4 (2024) fjernet standalone PWA-støtte i EU-land under Digital Markets Act (DMA)
- PWA-er i EU åpnes i Safari-tab – ingen push-støtte
- Joakim og norske brukere er berørt av dette!

**Praktisk konsekvens for Linspo:**
Push-notifikasjoner er utsatt til fase 2. For MVP-en, bruk e-post for ukentlige oppsummeringer. Norske iOS-brukere vil ikke få push uansett (EU/DMA-begrensning). Fokus bør være på at appen er god nok til at brukere åpner den frivillig.

---

## App Manifest og installasjon

Minimal `manifest.json` for Linspo:
```json
{
  "name": "Linspo",
  "short_name": "Linspo",
  "description": "Din personlige faglige kurator",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Krav for "Add to Home Screen"-prompt (Android Chrome):**
- HTTPS
- Gyldig manifest med alle påkrevde felter
- Service worker registrert
- Ikon i minst 192x192 og 512x512
- Appen besøkt minst to ganger med minst 5 minutters mellomrom

---

## SEO for PWA

PWA-er er indekserbare av Google, men med forbehold:
- Server-side rendering (SSR) eller static generation er viktig – ikke ren client-side rendering
- Next.js App Router med SSR er utmerket for dette
- Bruk `next/head` eller Metadata API for meta-tags
- `sitemap.xml` og `robots.txt` genereres enkelt med `next-sitemap`
- Core Web Vitals (LCP, FID, CLS) påvirker rangering – PWA-er med god service worker-caching scorer bra

**Linspos SEO-situasjon:** Appen er primært bak login, så SEO er begrenset til landingsside og eventuelt offentlige kurerte lister.

---

## Kilde-oversikt
- [Dev.to: Next.js vs Remix vs Astro vs SvelteKit 2026](https://dev.to/pockit_tools/nextjs-vs-remix-vs-astro-vs-sveltekit-in-2026-the-definitive-framework-decision-guide-lp5)
- [LogRocket: Next.js 16 PWA med offline-støtte](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Medium: Serwist med Next.js App Router](https://rajesh-biswas.medium.com/how-i-set-up-a-pwa-in-next-js-app-router-typescript-with-serwist-50f55e698ad5)
- [MagicBell: PWA iOS begrensninger 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Senorit: PWA 2025 komplett guide](https://senorit.de/en/blog/progressive-web-apps-guide-2025)
