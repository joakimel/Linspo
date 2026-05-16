/**
 * manual.ts — Validering for brukerlagte kilder.
 *
 * En bruker oppgir en URL (nettside eller RSS direkte). Validatoren:
 * 1. Finner RSS via verify.ts (sjekker selve URL-en, autodiscovery, vanlige stier)
 * 2. Kjører paywall-deteksjon via paywall.ts
 * 3. Returnerer enten "valid + kan legges til" eller "rejected/warning"
 *
 * Brukes både av kommende UI-form og av en CLI for testing.
 */

import { verifyRss } from "./verify.js";
import { checkPaywall, type PaywallCheck } from "./paywall.js";

export interface ManualSourceValidation {
  inputUrl: string;
  /** True = OK å legge til. False = kan ikke legges til (paywall eller ingen RSS). */
  valid: boolean;
  rssUrl: string | null;
  title: string | null;
  paywall: PaywallCheck;
  /** Bløte advarsler — bruker kan overstyre */
  warnings: string[];
  /** Harde feil — kilden kan ikke legges til */
  errors: string[];
}

/** Konfidens-terskel for når paywall blir en hard error vs. en warning. */
const PAYWALL_REJECT_THRESHOLD = 0.85;

export async function validateManualSource(
  inputUrl: string
): Promise<ManualSourceValidation> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. URL-validering
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    return {
      inputUrl,
      valid: false,
      rssUrl: null,
      title: null,
      paywall: emptyPaywallCheck(),
      warnings: [],
      errors: ["Ugyldig URL"],
    };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      inputUrl,
      valid: false,
      rssUrl: null,
      title: null,
      paywall: emptyPaywallCheck(),
      warnings: [],
      errors: ["Bare http:// og https:// URL-er støttes"],
    };
  }

  // 2. Verifiser RSS
  const verification = await verifyRss(inputUrl);

  if (!verification.hasRss || !verification.rssUrl) {
    errors.push(
      "Klarte ikke å finne RSS/Atom-feed på denne URL-en. Linspo trenger en RSS-kilde."
    );
  }

  // 3. Sjekk paywall
  const paywall = verification.rssUrl
    ? await checkPaywall(inputUrl, verification.rssUrl)
    : await checkPaywall(inputUrl);

  if (paywall.isPaywalled) {
    if (paywall.confidence >= PAYWALL_REJECT_THRESHOLD) {
      errors.push(
        `Kilden ser ut til å være bak betalingsmur (${Math.round(paywall.confidence * 100)} % konfidens): ${paywall.reason}`
      );
    } else {
      warnings.push(
        `Mulig betalingsmur (${Math.round(paywall.confidence * 100)} % konfidens): ${paywall.reason}`
      );
    }
  }

  return {
    inputUrl,
    valid: errors.length === 0,
    rssUrl: verification.rssUrl,
    title: verification.feedTitle ?? null,
    paywall,
    warnings,
    errors,
  };
}

function emptyPaywallCheck(): PaywallCheck {
  return {
    isPaywalled: false,
    confidence: 0,
    signals: [],
    reason: "Ikke sjekket",
  };
}
