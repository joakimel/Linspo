# Linspo

**Personlig faglig kurator og læringsassistent.**

Linspo henter relevant innhold basert på brukerens interesser, prioriterer faglig verdi over clickbait, og gjør passiv konsumering om til aktiv læring.

## Hva Linspo skal gjøre

- Hente og filtrere innhold fra relevante kilder daglig
- Presentere innhold i et lettfordøyelig format
- Lage ukentlige oppsummeringer
- Foreslå konkrete oppgaver og refleksjoner for å forankre kunnskap
- Støtte både faglige interesser (UX, AI, design systems) og hobbyer

## Mål

Hjelpe brukeren å holde seg oppdatert uten informasjonsoverload, og gjøre det personlig, motiverende og intelligent.

---

## Mappestruktur

| Mappe | Innhold |
|---|---|
| `01-research/` | Brukerundersøkelse, konkurranseanalyse, markedsinnsikt, rapporten |
| `02-documentation/` | Produktoutline, krav, beslutningsdokumenter (ADRs) |
| `03-design/` | UX-anbefalinger, interaksjonsmønstre, visuelle trender |
| `04-planning/` | Roadmap, backlog, milepæler |
| `05-resources/` | Referanser, inspirasjon, lenker |
| `06-dev/` | Teknisk dokumentasjon: arkitektur, infra, PWA, AI-integrasjon |

Når Next.js-appen scaffoldes, vil koden ligge på **rotnivå** (`app/`, `components/`, `lib/`, `package.json` osv.) — ikke inne i `06-dev/`.

## Status

🟡 Tidlig fase — research og konsept ferdig, tech stack vedtatt (se `06-dev/`). Neste steg: scaffolde Next.js + Supabase MVP.
