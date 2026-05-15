# Konkrete UX-anbefalinger for Linspo

*Forfatter: AI-forskning, mai 2026. Dette dokumentet er en syntetisert anbefaling basert på funnene i visual_trends.md og interaction_patterns.md. Anbefalingene er egne tolkninger med kilde-belegg.*

---

## 1. Overordnet designfilosofi for Linspo

Linspo er en **faglig kurator og læringsassistent**, ikke en underholdningsfeed. Dette skal reflekteres i designet:

- **Ro over stimulans**: Designet skal senke skuldrene, ikke heve puls. Unngå fargerik støy, uendelig scroll, og aggressive notifications.
- **Tillit og autoritet**: Rene linjer, god typografi og konsistent spacing signaliserer at dette er et seriøst verktøy for faglig vekst.
- **Bevisst progresjon**: Designet belønner dybde over bredde — én god artikkel lest ferdig er bedre enn ti åpnet.
- **Brukerens kontroll**: Brukeren skal alltid forstå hvorfor de ser det de ser, og enkelt kunne justere preferanser.

---

## 2. Tilgjengelighet (WCAG) — Prioritert for rød-grønn fargeblindhet

### Rød-grønn fargeblindhet (deuteranomalogi)

Dette er det viktigste tilgjengelighetskravet for Linspo, siden brukeren er rød-grønn fargeblind.

**Regler som MÅ følges:**

1. **Bruk aldri rød/grønn alene** for å formidle mening (feil/suksess, negativ/positiv). Alltid kombiner med:
   - Ikon (kryss for feil, hake for suksess)
   - Tekst-label
   - Form (annen border-style, fylt vs. outline)

2. **Akseptabel fargepalett for feedback-tilstander:**
   - Positiv/suksess: **Blå (#0066CC)** eller **indigo** — aldri ren grønn
   - Negativ/feil: **Oransje (#CC6600)** eller **amber** — aldri ren rød
   - Nøytral: **Grå (#6B7280)**
   - Alternativt: bruk monokromatiske variasjoner (mørk/lys av én farge)

3. **Tommel-opp/ned-ikoner**: Bruk ikonform + tekst («Mer av dette» / «Ikke relevant»), ikke bare fargekodede piler

4. **Fargekodede emner/tags**: Hvis tags fargemerkes, sørg for at fargeforskjellen er synlig i gråtoner. Test alltid med et fargeblind-simulator (f.eks. Adobe Color Accessibility, Coblis).

### WCAG kontrastkrav

[Kilde] WCAG 2.2 Level AA krav:
- Normal tekst: minimum **4,5:1** kontrastforhold
- Stor tekst (18px+ regular, 14px+ bold): minimum **3:1**
- UI-komponenter og grafiske elementer: minimum **3:1**
- Level AAA (anbefalt for brødtekst i lese-apper): **7:1**

**Konkrete Linspo-anbefalinger:**

| Element | Anbefalt kombinasjon | Kontrastforhold |
|---|---|---|
| Brødtekst (lys modus) | #111827 tekst på #FFFFFF bakgrunn | ~18:1 |
| Sekundærtekst (lys) | #4B5563 tekst på #FFFFFF bakgrunn | ~7:1 |
| Brødtekst (mørk modus) | #F9FAFB tekst på #111827 bakgrunn | ~17:1 |
| Sekundærtekst (mørk) | #9CA3AF tekst på #111827 bakgrunn | ~4,6:1 |
| Primærknapp (blå) | #FFFFFF tekst på #1D4ED8 bakgrunn | ~8:1 |
| Tags/chips | #1E3A5F tekst på #DBEAFE bakgrunn | ~7:1 |

### Touch targets (klikkbare mål)

[Kilde] Standardkrav:
- **WCAG 2.5.8 (AA)**: minimum 24×24 CSS-piksler
- **Apple HIG**: anbefaler 44×44 pt
- **Android**: anbefaler 48×48 dp
- **For kritiske handlinger** (lagre, forkast): 60×60 pt eller større

**Linspo touch target-anbefalinger:**
- Primærhandlinger (Les, Lagre): minimum 48×48px, anbefalt 56×56px
- Sekundærhandlinger (Del, Mer): minimum 44×44px
- Navigasjonselementer i tab-bar: minimum 48×48px, med 8px mellomrom
- Inline tags og chips: minimum 32px høyde med 8px padding

### Skriftstørrelser

| Kontekst | Minimum | Anbefalt |
|---|---|---|
| Brødtekst (artikkelleste) | 16px | 18–20px |
| Kortingress | 14px | 15–16px |
| Knapp-tekst | 14px | 16px |
| Labels/tags | 12px | 13px |
| Navigasjon | 10px | 11–12px |

---

## 3. Visuell design — Konkrete anbefalinger

### Fargesystem

**Anbefalt base-palett (lys modus):**
- Bakgrunn: #F9FAFB (varm hvit)
- Kortbakgrunn: #FFFFFF
- Primæraksentfarge: #1D4ED8 (blå) — trygt for fargeblinde
- Sekundæraksentfarge: #D97706 (amber) — positiv handling, trygt
- Tekst primær: #111827
- Tekst sekundær: #6B7280
- Divider: #E5E7EB

**Anbefalt base-palett (mørk modus):**
- Bakgrunn: #111827
- Kortbakgrunn: #1F2937
- Primæraksentfarge: #60A5FA (lys blå — høy kontrast på mørk)
- Sekundæraksentfarge: #FBBF24 (amber)
- Tekst primær: #F9FAFB
- Tekst sekundær: #9CA3AF
- Divider: #374151

### Typografi

Anbefalt system (Google Fonts, gratis):
- **Overskrifter**: Inter Semi-Bold (600), eller Fraunces for featured featured-innhold
- **Brødtekst**: Inter Regular (400), linjeavstand 1.6
- **UI-elementer**: Inter Medium (500)
- Skriftstørrelsehierarki: 28px (H1) → 22px (H2) → 18px (H3) → 16px (Body) → 13px (Label)

### Layout-system

**Hjemskjerm (Daily Digest) — Bento Grid:**
```
[ FEATURED ARTICLE — Stor kort, full bredde ]
[ Kort 1 — halv bredde ] [ Kort 2 — halv bredde ]
[ Kort 3 — 1/3 ] [ Kort 4 — 1/3 ] [ Kort 5 — 1/3 ]
[ UKENS OPPGAVE — full bredde, annen bakgrunnsfarge ]
```

**Kortinnhold — minimalt hierarchy:**
- Kilde-logo + domenenavn (liten, øverst)
- Emne-tag (chip)
- Tittel (H3, 2 linjer maks)
- Ingress (1–2 setninger)
- Metadata-rad: Lesetid | Dato
- Handlingsrad: [Lagre] [Mer av dette] [Ikke relevant]

---

## 4. Nøkkel-interaksjonsflyter

### Onboarding-flyt (4 skjermbilder)

**Skjerm 1 — Mål** (30 sek)
- Tittel: «Hva vil du lære mer om?»
- Énlinje fritekstfelt: «Skriv ditt fagfelt eller tema...»
- Hopp-knapp: «Sett opp profil i stedet»

**Skjerm 2 — Emnevalg** (45 sek)
- Tittel: «Velg dine interesser»
- Chip-grid med forhåndsvalgte emner (UX-design, AI/Teknologi, Design Systems, Produktutvikling, Gaming)
- «+ Legg til eget emne»-felt
- Anbefaling: velg minst 2, maks 8

**Skjerm 3 — Frekvens og tidspunkt** (20 sek)
- «Når vil du lese?» — tidsvelger for daglig påminnelse
- «Hvor mye tid har du?» — 5 min / 15 min / 30 min+ (tilpasser antall innholdskort)

**Skjerm 4 — Første daglige pakke** (umiddelbar verdi)
- Vis 3 artikler basert på valgte interesser
- Ingen push-notifikasjonsforespørsel HER
- Push-forespørsel kommer etter at bruker har lest én artikkel og returnert til feed

### Daglig bruksflyt

1. Åpner appen → **Daily Digest-skjerm** (dagens pakke)
2. Skanner kortene → velger en artikkel
3. Leser artikkelen (reader-view, ren tekst)
4. Etter lesing: vist ett spørsmål «Nyttig?» (tommel opp / ikke relevant) — valgfritt, én tap
5. Tilbake til feed → neste artikkel eller avslutter
6. Etter å ha lest alle dagens kort: belønnings-animasjon + progress markert som fullført

### Ukentlig oppsummeringsflyt

Trigger: Søndag kveld (eller valgt dag) push-notifikasjon
Innhold:
- «Du leste X artikler om Y denne uka»
- Nøkkeltemaer som ble dekket
- En setning AI-generert innsikt: «Du viste ekstra interesse for design system-tokens»
- Forslag til en konkret oppgave eller refleksjon
- Teaser for neste ukes anbefalt lesing

---

## 5. Gamification — Anbefalinger tilpasset Linspo

### Hva som bør implementeres

| Funksjon | Prioritet | Begrunnelse |
|---|---|---|
| Daglig lesestreak | Høy | Dokumentert effekt (Duolingo-data) |
| Streak Freeze («Fridager») | Høy | Forhindrer churn, reduserer angst |
| Ukentlig fremdringsring | Høy | Visuell progress, enkel å forstå |
| Milepæl-badges | Middels | Langsiktig motivasjon |
| «Dybdelesing»-indikator | Middels | Belønner kvalitet over kvantitet |
| Leseradar (interessevisualisering) | Lav | Kult, men ikke kritisk for MVP |

### Hva som IKKE bør implementeres (ennå)

| Funksjon | Grunn |
|---|---|
| Ledertavler (leaderboards) | Feil kontekst — faglig læring er ikke konkurransesport |
| XP-poeng som primær metrikk | Kan oppmuntre til gaming (åpne uten å lese) |
| Daglige mål med rigid krav | Skaper unødvendig press for travle fagfolk |
| Aggressive streak-notifikasjoner | Brukere finner det irriterende og deaktiverbar |

### Streak-design for faglig læring

En «Linspo-streak» bør aktiveres ved:
- Leste minst én artikkel (scrollet >50 % av artikkelen)
- ELLER fullførte en refleksjonsprompt
- IKKE bare ved å åpne appen

Streak-farge: Bruk indigo/blå (ikke rød eller grønn — hensyn til fargeblindhet)
Streak-animasjon: Subtil flammehalo-animasjon rundt streak-nummeret ved ny dag

---

## 6. PWA-spesifikke anbefalinger

### Ytelse

- Hold First Contentful Paint (FCP) under 1.5 sek på 4G
- Bruk lazy loading for bilder i kortene
- Cache dagens innholdspakke ved lansering (offline-støtte)
- Service Worker for bakgrunnsoppdatering av neste dags innhold

### Installasjon og native-feel

- Implementer «Legg til hjemskjerm»-prompt etter 3. besøk eller etter første fullførte uke
- Bruk Web App Manifest med dark/light theme-color
- Splash screen tilpasset brukerens systemtema
- Støtt `prefers-color-scheme` og `prefers-reduced-motion` fra dag én

### Animasjoner

- Bruk CSS `transform` og `opacity` (GPU-akselerert) — aldri `width/height`
- Swipe-kort: bruk touch events med `requestAnimationFrame`, ikke CSS transitions alene
- Unngå animasjoner >400ms for feedback-tilstander
- Alle animasjoner MÅ ha en statisk fallback via `prefers-reduced-motion: reduce`

---

## 7. Prioritert MVP-scope for UX

### Must-have (MVP)

- [ ] Daily Digest-skjerm med 5–8 innholdskort (bento-inspirert)
- [ ] Kortdesign med tittel, ingress, tag, lesetid
- [ ] Reader-view for artikler
- [ ] Tommel opp/ned feedback (eksplisitt)
- [ ] Lagre til leseliste
- [ ] Onboarding (4 skjermbilder med emnevalg)
- [ ] Daglig streak-indikator
- [ ] Mørk/lys modus
- [ ] WCAG AA-kompatibel fargepalett (inkl. rød-grønn-trygg)

### Nice-to-have (v1.1)

- [ ] Swipe-modus for innholdsdekurasjon
- [ ] Ukentlig oppsummeringsvisning
- [ ] Refleksjonsprompts og oppgaverkort
- [ ] Streak Freeze / Fridager
- [ ] Interesseradar (visuell)
- [ ] AI-genererte lesenotater (Ghostreader-stil)

### Fremtidig (v2+)

- [ ] Sosial deling av ukesoppsummering
- [ ] Integrert highlights og notater
- [ ] Adaptiv tidspunktoptimalisering (sender innhold når bruker typisk leser)
- [ ] Temabaserte læringsveier («Kurs» i UX i 4 uker)

---

## 8. Designvalg-begrunnelser (beslutningslogg)

| Valg | Alternativ vurdert | Grunn |
|---|---|---|
| Blå som primæraksentfarge | Grønn | Grønn er problematisk for rød-grønn fargeblinde |
| Amber som sekundæraksentfarge | Rød | Rød er problematisk for rød-grønn fargeblinde |
| Daily Digest-modus | Uendelig scroll | Faglig app bør oppmuntre til dybde, ikke scroll |
| Inter som brødtekstfont | Merriweather | Inter er mer allsidig for UI + tekst, én familie |
| Bento grid hjemskjerm | Kortliste (vertikal scroll) | Bento skiller ut featured innhold og gir struktur |
| Streak basert på lesing | Streak basert på åpning | Kvalitet over kvantitet i faglig kontekst |
| Push-forespørsel etter verdi | Push-forespørsel ved oppstart | Høyere opt-in rate (70–85 % vs 40–60 %) |

---

## Referanser

Se `visual_trends.md` og `interaction_patterns.md` for fullstendige kildelister.

Nøkkelkilder for dette dokumentet:
- [WCAG 2.5.8 Target Size — W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Accessible Tap Target Sizes — Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [Inclusive Website Color Palettes — ConcreteCMS](https://www.concretecms.com/about/blog/web-design/inclusive-website-color-palettes-for-accessibility)
- [Accessible Colors Guide — AudioEye](https://www.audioeye.com/post/accessible-colors/)
- [Mobile App Onboarding Guide 2026 — VWO](https://vwo.com/blog/mobile-app-onboarding-guide/)
- [Duolingo Gamification Case Study — Trophy.so](https://trophy.so/blog/duolingo-gamification-case-study)
- [Push Notification Best Practices — Boundev](https://www.boundev.com/blog/push-notification-best-practices-ux-guide)
