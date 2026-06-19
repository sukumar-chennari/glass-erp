/**
 * i18n-check.mjs — Zero-dependency locale parity validator
 *
 * Checks across all namespace × locale combinations:
 *   • Every key in EN exists in every other locale (missing key = error)
 *   • Every {{placeholder}} in an EN string exists in the matching translation (mismatch = error)
 *   • Keys present in a locale but absent from EN are flagged (extra key = warning)
 *   • All expected namespace files exist in each locale directory (absent file = error)
 *
 * Usage:
 *   node scripts/i18n-check.mjs             — run audit, non-zero exit on errors
 *   node scripts/i18n-check.mjs --warn-only — treat errors as warnings (CI dry run)
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const BASE_LOCALE = 'en';

const LOCALES = ['en', 'te', 'hi'];

const NAMESPACES = [
  'claims', 'common', 'customers', 'dashboard', 'enquiry', 'errors',
  'invoices', 'jobs', 'nav', 'products', 'purchaseOrders', 'reports',
  'settings', 'stock', 'technicians', 'vendors',
];

const WARN_ONLY = process.argv.includes('--warn-only');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Recursively flatten { a: { b: 'v' } } → { 'a.b': 'v' } */
function flattenKeys(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v, full));
    } else {
      out[full] = v;
    }
  }
  return out;
}

/** Extract the set of {{placeholder}} tokens from a string value. */
function placeholders(str) {
  return new Set((String(str).match(/\{\{[^}]+\}\}/g) ?? []));
}

/** Load and parse a locale JSON file; return null on any failure. */
function loadJson(locale, ns) {
  const file = path.join(LOCALES_DIR, locale, `${ns}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

// ─── Counters ────────────────────────────────────────────────────────────────

let errors   = 0;
let warnings = 0;

function error(msg)   { console.error(`  ✗ ${msg}`); errors++;   }
function warn(msg)    { console.warn( `  ⚠ ${msg}`); warnings++; }
function ok(msg)      { console.log(  `  ✓ ${msg}`);             }

// ─── Main audit loop ─────────────────────────────────────────────────────────

console.log(`\nGlass ERP — i18n locale parity check`);
console.log(`Base: ${BASE_LOCALE}  |  Target locales: ${LOCALES.filter(l => l !== BASE_LOCALE).join(', ')}`);
console.log(`Namespaces: ${NAMESPACES.length}\n`);

for (const ns of NAMESPACES) {
  const baseJson = loadJson(BASE_LOCALE, ns);

  if (!baseJson) {
    error(`[${BASE_LOCALE}/${ns}.json] File missing or invalid JSON`);
    continue;
  }

  const baseFlat = flattenKeys(baseJson);
  const baseKeys = new Set(Object.keys(baseFlat));

  let nsErrors   = 0;
  let nsWarnings = 0;

  for (const locale of LOCALES) {
    if (locale === BASE_LOCALE) continue;

    const localeJson = loadJson(locale, ns);
    if (!localeJson) {
      error(`[${locale}/${ns}.json] File missing or invalid JSON`);
      nsErrors++;
      continue;
    }

    const localeFlat = flattenKeys(localeJson);
    const localeKeys = new Set(Object.keys(localeFlat));

    // Missing keys (EN → locale)
    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        error(`[${locale}/${ns}] Missing key: ${key}`);
        nsErrors++;
        continue;
      }

      // Placeholder parity
      const basePH   = placeholders(baseFlat[key]);
      const localePH = placeholders(localeFlat[key]);

      for (const ph of basePH) {
        if (!localePH.has(ph)) {
          error(`[${locale}/${ns}.${key}] Missing placeholder: ${ph}`);
          nsErrors++;
        }
      }
      for (const ph of localePH) {
        if (!basePH.has(ph)) {
          warn(`[${locale}/${ns}.${key}] Extra placeholder not in EN: ${ph}`);
          nsWarnings++;
        }
      }
    }

    // Extra keys (locale → EN)
    for (const key of localeKeys) {
      if (!baseKeys.has(key)) {
        warn(`[${locale}/${ns}] Extra key (not in ${BASE_LOCALE}): ${key}`);
        nsWarnings++;
      }
    }
  }

  if (nsErrors === 0 && nsWarnings === 0) {
    ok(`${ns} — all locales match`);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('');
if (errors > 0 && !WARN_ONLY) {
  console.error(`✗ i18n check FAILED — ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (errors > 0) {
  console.warn(`⚠ i18n check completed with ${errors} error(s) (warn-only mode), ${warnings} warning(s)`);
} else if (warnings > 0) {
  console.log(`⚠ i18n check passed — 0 errors, ${warnings} warning(s)`);
} else {
  console.log(`✓ i18n check passed — all ${NAMESPACES.length} namespaces fully consistent across ${LOCALES.join(', ')}`);
}
