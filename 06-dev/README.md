# Dev

Tekniske beslutninger, arkitektur og kodebase.

## Status

Tech stack er ikke valgt ennå. Se `02-documentation/decisions/` for ADR-er når beslutninger tas.

## Kandidater

### Full-stack alternativer

| Stack | Fordeler | Ulemper |
|---|---|---|
| Next.js + Supabase | Stort økosystem, god DX, Supabase gir auth + DB + realtime gratis | Mer konfigurering, React-overhead |
| SvelteKit + Supabase | Enklere syntaks, raskere å lære, lettere bundle | Mindre community, færre biblioteker |
| Remix + Supabase | God data-loading-filosofi, progressiv enhancement | Mindre brukt, mer nisje |

### Innhenting og bakgrunnsjobber

- **Cron-basert** (f.eks. GitHub Actions, Railway cron) — enkelt å starte med
- **Queue-basert** (f.eks. BullMQ) — bedre skalering, men mer kompleksitet

### AI-integrasjon

- OpenAI API / Anthropic API for sammendrag og kategorisering
- Vurder kostnad per bruker tidlig

---

*Oppdateres når tech stack er bestemt.*
