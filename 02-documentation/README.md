# Documentation

Produktdefinisjon, krav og beslutningsdokumenter.

## Innhold

- `Linspo_Outline_og_Konseptplan.md` — Hovedoutline med fasebeskrivelser (MVP → vekst)
- `decisions/` — Architecture Decision Records (ADRs):
  - `ADR-001-mvp-tech-stack-og-scope.md` — Tech stack, strikt MVP-scope, rate-limit-strategi
  - `ADR-002-innholds-pipeline-og-kilder.md` — Innholds-ekstraksjon, kilde-strategi, learning_value-filter
  - `ADR-003-kilde-oppdagelse-og-brukerkontroll.md` — Generelt discovery-system, fjernet dødvekt-strategier, bruker-godkjenning, manuell kildelegging, paywall-deteksjon
  - `ADR-004-solo-mvp-deploy.md` — OpenNext + Cloudflare Worker, GitHub Actions Node 22 cron, force-dynamic-render
  - `ADR-005-lest-status-og-feedback.md` — read_at-felt, article_feedback-tabell, 3-veis reaksjoner, arkiv-side, ingen AI-tilpasning ennå
  - `ADR-006-ekstern-cron-trigger.md` — cron-job.org som primær trigger for daglig fetch, GitHub-schedule som backup
  - `ADR-007-innholds-pipeline-arkitektur-multi-bruker.md` — Emne-drevet fetch for Fase 2+ (union av brukeres interesser, discovery for nisjer)
- `plans/` — Planlagte endringer som ennå ikke er implementert:
  - `dev-miljo-oppsett.md` — Cloudflare Workers Builds preview-deploys per branch + egen Supabase-instans for dev

## ADR-format

Hver beslutning lagres som en egen fil: `ADR-001-navn.md`

```
# ADR-001: [Tittel]

**Dato:** YYYY-MM-DD
**Status:** Foreslått / Godkjent / Forkastet

## Kontekst
Hva er situasjonen og problemet vi løser?

## Beslutning
Hva har vi bestemt oss for?

## Alternativer vurdert
Hva ble vurdert men ikke valgt, og hvorfor?

## Konsekvenser
Hva betyr denne beslutningen fremover?
```
