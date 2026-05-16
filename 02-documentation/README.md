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
