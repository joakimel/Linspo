# ADR-006: Ekstern cron-trigger for pålitelig daglig innhentning

**Dato:** 2026-05-18
**Status:** Godkjent — oppsett bekreftet 2026-05-18 (test run: 204 No Content, workflow trigget og fullført)

## Kontekst

GitHub Actions `schedule`-cron er notorisk upålitelig. Den daglige fetch-jobben (`daily-fetch.yml`) kjørte ikke som planlagt 2026-05-18 kl. 07:00 norsk tid — Joakim måtte kjøre den manuelt via `workflow_dispatch`. GitHub garanterer ikke presis kjøretid for schedulede workflows; forsinkelser på minutter til timer er vanlig, og på travle dager kan de hoppes over helt.

I tillegg har den eksisterende cron-definisjonen `0 5 * * *` (05:00 UTC) et tidssone-problem: 05:00 UTC = 07:00 CEST (sommertid) men bare 06:00 CET (vintertid). Det er ikke håndtert.

## Beslutning

### 1. Ekstern cron-tjeneste: cron-job.org

Bruk [cron-job.org](https://cron-job.org) (gratis) som primær trigger. Den kaller GitHub API for å fyre av `workflow_dispatch` på `daily-fetch.yml` kl. 07:00 daglig.

Fordeler fremfor GitHub-schedule:
- Presis kjøretid (sekund-nøyaktig)
- Støtter tidssone-konfigurasjon — sett `Europe/Oslo`, ingen UTC-matte
- Sommer/vintertid håndteres automatisk
- Varsel ved feil (e-post)

### 2. Oppsett — steg for steg

#### GitHub Personal Access Token (PAT)

1. Gå til github.com → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Klikk **Generate new token**
3. Velg scope: kun `joakimel/Linspo`-repoet
4. Gi tillatelse: **Actions → Read and write**
5. Kopier tokenet (vises bare én gang)

#### cron-job.org-konfigurasjon

1. Opprett gratis konto på [cron-job.org](https://cron-job.org)
2. Lag en ny jobb med disse innstillingene:

| Felt | Verdi |
|---|---|
| URL | `https://api.github.com/repos/joakimel/Linspo/actions/workflows/daily-fetch.yml/dispatches` |
| Metode | `POST` |
| Tidssone | `Europe/Oslo` |
| Tidspunkt | `07:00` daglig |

**Headers:**
```
Authorization: Bearer <ditt-github-pat>
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

**Request body:**
```json
{"ref": "main"}
```

#### GitHub Actions workflow — behold som backup

`daily-fetch.yml` beholder `schedule: cron: "0 4 * * *"` (04:00 UTC = 06:00 CEST / 05:00 CET) som fallback i tilfelle cron-job.org feiler. Den vil da ikke doble kjøringen på normale dager siden cron-job.org trigget 07:00 alltid vil komme etter 06:00-backupen har kjørt — men `concurrency: group: daily-fetch` sørger for at evt. overlap ikke kan skje.

**Viktig:** Oppdater cron i `daily-fetch.yml` til `0 4 * * *` (fra `0 5 * * *`) for å sikre backup kjører _før_ ønsket klokkeslett.

### 3. Fremtidig arkitektur (Fase 2+)

Når appen får flere brukere fra ulike tidssoner er ikke klokkeslettet for selve fetch-jobben kritisk — det er artiklenes tilgjengelighet som betyr noe. Se ADR-007 for arkitektur rundt dette.

## Alternativer vurdert

| Alternativ | Hvorfor forkastet |
|---|---|
| Bare stole på GitHub Actions schedule | For upålitelig. Vist seg å svikte i praksis. |
| Cloudflare Cron Trigger | Workers har 30s timeout — pipeline tar lenger. Dokumentert i ADR-004. |
| Justere GitHub-cron til buffertid (03:00 UTC) | Løser ikke upåliteligheten, bare demper konsekvensen. |
| Bygge eget cron-system | Over-engineering for nåværende behov. |

## Konsekvenser

**Positivt:**
- Artikler er ferske til rett tid hver morgen
- Tidssone-korrekt uten UTC-matte i kodebasen
- Varsel ved feil via cron-job.org e-post

**Negativt / kompromisser:**
- Avhengighet av ekstern tjeneste (cron-job.org)
- GitHub PAT må roteres ved utløp
- Hvis cron-job.org er nede _og_ GitHub Actions er sent: ingen morgen-fetch (akseptabelt — manuell `workflow_dispatch` er alltid tilgjengelig)
