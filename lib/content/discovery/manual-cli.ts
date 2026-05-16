/**
 * manual-cli.ts — Testing av validateManualSource fra kommandolinje.
 *
 * Bruk:
 *   npx tsx lib/content/discovery/manual-cli.ts <url>
 *   npx tsx lib/content/discovery/manual-cli.ts <url> --json
 */

import * as path from "node:path";
import * as dotenv from "dotenv";
import { validateManualSource } from "./manual.js";

const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Linspo manuell kilde-validator
==============================
Bruk: npx tsx lib/content/discovery/manual-cli.ts <url> [--json]

Validerer at en URL kan legges til som kilde i Linspo:
- Sjekker at RSS/Atom-feed finnes (via autodiscovery eller vanlige stier)
- Sjekker for paywall (kjente domener, HTTP 402, teaser-only RSS, m.m.)

Eksempler:
  npx tsx lib/content/discovery/manual-cli.ts https://www.smashingmagazine.com/feed/
  npx tsx lib/content/discovery/manual-cli.ts https://www.nytimes.com
  npx tsx lib/content/discovery/manual-cli.ts https://stratechery.com --json
`);
    process.exit(0);
  }

  const url = args[0];
  const asJson = args.includes("--json");

  const result = await validateManualSource(url);

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  // Menneskevennlig output
  console.log();
  console.log(`Validering av: ${result.inputUrl}`);
  console.log("─".repeat(60));

  if (result.rssUrl) {
    console.log(`✓ RSS funnet:  ${result.rssUrl}`);
  } else {
    console.log(`✗ Ingen RSS funnet`);
  }

  if (result.title) {
    console.log(`✓ Tittel:      ${result.title}`);
  }

  console.log();
  console.log("Paywall-sjekk:");
  if (result.paywall.signals.length === 0) {
    console.log("  ✓ Ingen indikatorer på paywall");
  } else {
    console.log(`  Konfidens: ${Math.round(result.paywall.confidence * 100)} %`);
    for (const sig of result.paywall.signals) {
      const icon = sig.severity === "definite" ? "✗" : sig.severity === "likely" ? "⚠" : "·";
      console.log(`  ${icon} [${sig.severity}] ${sig.description}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log();
    console.log("Advarsler:");
    for (const w of result.warnings) {
      console.log(`  ⚠ ${w}`);
    }
  }

  if (result.errors.length > 0) {
    console.log();
    console.log("Feil:");
    for (const e of result.errors) {
      console.log(`  ✗ ${e}`);
    }
  }

  console.log();
  if (result.valid) {
    console.log("RESULTAT: ✓ Kilden kan legges til");
  } else {
    console.log("RESULTAT: ✗ Kilden avvises");
  }
  console.log();

  process.exit(result.valid ? 0 : 1);
}

main().catch((err) => {
  console.error("Feil:", err);
  process.exit(2);
});
