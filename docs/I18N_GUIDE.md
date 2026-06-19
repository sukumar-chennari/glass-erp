# i18n Developer Guide

Glass ERP Admin uses **react-i18next** with 16 namespaces and three locales (English, Telugu, Hindi). This guide covers everything a contributor needs to add features without breaking translation completeness.

---

## Quick start: adding a new string

1. Decide which namespace owns it (see [Namespace selection](#namespace-selection)).
2. Add the English key to `src/i18n/locales/en/<namespace>.json`.
3. Add the **same key** with a Telugu translation to `src/i18n/locales/te/<namespace>.json`.
4. Add the **same key** with a Hindi translation to `src/i18n/locales/hi/<namespace>.json`.
5. Use it in the component: `const { t } = useTranslation('namespace'); ... t('your.key')`.
6. Run `npm run i18n:check` — it must pass with zero errors before committing.

---

## Namespace selection

| Namespace | Owns |
|---|---|
| `common` | Shared UI chrome: action buttons (Save, Cancel, Delete), table empty states, status values shared across features (`active`, `inactive`, `onHold`, `inStock`, `lowStock`, `outOfStock`, `training`, `onLeave`), glass positions, aria labels |
| `nav` | Sidebar labels, section headings, top-header, language switcher |
| `dashboard` | Dashboard page + KPI card labels/change text |
| `vendors` | Vendors page, VendorTable, VendorModal |
| `products` | Products page, ProductTable, ProductModal |
| `customers` | Customers page, CustomerTable, CustomerModal |
| `jobs` | Jobs page, JobTable, JobModal, damage types, payment types, job statuses |
| `invoices` | Invoices page, InvoiceTable, InvoiceStatusModal, invoice statuses |
| `claims` | Claims page, ClaimTable, ClaimCard, ClaimUpdateModal, claim statuses |
| `purchaseOrders` | PO page, POTable, POModal, PO statuses |
| `stock` | Stock page, StockTable, AdjustStockModal |
| `technicians` | Technicians page, TechnicianTable, TechnicianModal |
| `settings` | Settings page, AppearanceSection |
| `enquiry` | Enquiry/WhatsApp page |
| `reports` | Reports page |
| `errors` | ErrorBoundary, error fallback UI |

**Rule of thumb:** if a string only ever appears in one feature, it belongs to that feature's namespace. If it appears in two or more features, it belongs to `common`.

### Using multiple namespaces in one component

```tsx
const { t } = useTranslation(['jobs', 'common']);

// Looks up 'jobs' first, then 'common' as fallback:
t('table.jobNo')           // → jobs namespace
t('actions.cancel')        // → common namespace (via fallback)
t('glassPositions.frontWindshield') // → common namespace (via fallback)
```

---

## Translating enums and statuses

**Never render raw API strings directly.** Always route enum values through a key mapper, then through `t()`.

### How it works

`src/i18n/statusKeys.ts` contains one mapper per domain:

```ts
export function glassPositionKey(pos: string): string  { return GLASS_POSITION_KEYS[pos]  ?? pos; }
export function damageTypeKey(type: string): string     { return DAMAGE_TYPE_KEYS[type]     ?? type; }
export function paymentTypeKey(type: string): string    { return PAYMENT_TYPE_KEYS[type]    ?? type; }
export function jobStatusKey(status: string): string    { return JOB_STATUS_KEYS[status]    ?? status; }
export function claimStatusKey(status: string): string  { return CLAIM_STATUS_KEYS[status]  ?? status; }
// ...and so on for every domain
```

Each mapper converts an API string value (`"Front Windshield"`, `"In Progress"`) to a stable i18n key (`"frontWindshield"`, `"inProgress"`).

### Pattern: table cell renderer

```tsx
// ✅ Correct — enum value goes through mapper + t()
{
  key: 'glassPosition',
  header: t('table.position'),
  render: (row) =>
    t(`glassPositions.${glassPositionKey(row.glassPosition)}`, { defaultValue: row.glassPosition }),
}

// ❌ Wrong — raw API value rendered directly
{
  key: 'glassPosition',
  header: t('table.position'),
  // no render → DataTable default renders String(row.glassPosition)
}
```

### Pattern: StatusBadge

```tsx
<StatusBadge
  status={job.status}
  statusMap={JOB_STATUS_MAP}
  getLabel={(s) => t(`status.${jobStatusKey(s)}`, { defaultValue: s })}
/>
```

The `getLabel` prop is **required** whenever `StatusBadge` is used. Never omit it.

### Adding a new status domain

1. Add the API-value → i18n-key mapping to `src/i18n/statusKeys.ts`:

```ts
const GLASS_TINT_KEYS: Record<string, string> = {
  'Clear':  'clear',
  'Tinted': 'tinted',
  'Solar':  'solar',
};
export function glassTintKey(tint: string): string { return GLASS_TINT_KEYS[tint] ?? tint; }
```

2. Decide which namespace owns the labels. Feature-specific statuses go in the feature namespace; generic ones go in `common`.

3. Add the translation keys to all three locales.

4. Use `glassTintKey` + `t()` in every table/card/badge that displays the value.

---

## Pluralization

Use i18next's built-in plural suffix convention:

```json
// en/technicians.json
{
  "table": {
    "experience": "Experience",
    "experience_one": "{{count}} yr",
    "experience_other": "{{count}} yrs"
  }
}
```

```tsx
// Column header — no count passed → uses base key "Experience"
header: t('table.experience')

// Cell — count passed → uses plural form "3 yrs"
render: (tech) => t('table.experience', { count: tech.yearsExperience })
```

---

## Interpolation (dynamic values in strings)

Use `{{variable}}` placeholders — never concatenate translated and untranslated fragments.

```json
// en/claims.json
{
  "table": {
    "claimedLine":  "Claimed: {{amount}}",
    "approvedLine": "Approved: {{amount}}",
    "daysUnit_one": "{{count}} day",
    "daysUnit_other": "{{count}} days"
  }
}
```

```tsx
// ✅ Correct
t('table.claimedLine', { amount: formatINR(c.claimedAmount) })
t('table.daysUnit', { count: days })

// ❌ Wrong — fragment concatenation breaks in languages with different word order
t('table.claimed') + ': ' + formatINR(c.claimedAmount)
```

The validation script (`npm run i18n:check`) checks that every `{{placeholder}}` present in the EN string also appears in the TE and HI translations.

---

## Rich text with JSX markup

Use the `Trans` component when translated text must contain inline HTML elements:

```tsx
import { Trans } from 'react-i18next';

// en/enquiry.json — use <1> index syntax for inline elements
{
  "setup": {
    "description": "Host the <1>glass-enquiry-form.html</1> file online once, then paste the URL below."
  }
}

// In the component:
<Trans i18nKey="setup.description" ns="enquiry">
  Host the <strong>glass-enquiry-form.html</strong> file online once, then paste the URL below.
</Trans>
```

Do **not** use `Trans` just to avoid `t()` — only use it when the markup is inseparable from the sentence structure.

---

## Zod validation messages

Schema validation messages are user-facing strings and must be localized. Always define schemas inside `useMemo([t])`:

```tsx
// ✅ Correct — schema is reactive to language changes
const schema = useMemo(() =>
  z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, t('form.errors.phoneInvalid')),
    city:  z.string().min(1, t('form.errors.cityRequired')),
  }),
[t]);

// ❌ Wrong — schema defined at module level, messages frozen in English
const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid phone number'),
});
```

---

## Select option labels

Build select option arrays inside the component, inside `useMemo([t])`:

```tsx
const statusOptions = useMemo<SelectOption[]>(() => [
  { value: VENDOR_STATUS.ACTIVE,   label: t(`status.${vendorStatusKey(VENDOR_STATUS.ACTIVE)}`)   },
  { value: VENDOR_STATUS.ON_HOLD,  label: t(`status.${vendorStatusKey(VENDOR_STATUS.ON_HOLD)}`)  },
  { value: VENDOR_STATUS.INACTIVE, label: t(`status.${vendorStatusKey(VENDOR_STATUS.INACTIVE)}`) },
], [t]);
```

---

## What must NOT be translated

These values must always be rendered as-is from the data source:

| Field | Why |
|---|---|
| Customer, technician, vendor names | Free-form user input |
| Phone numbers, email addresses | Technical identifiers |
| Registration numbers, invoice/job/claim/PO numbers | System IDs |
| Vehicle make, model, year | Brand names / user-entered |
| Insurer names | User-entered business name |
| Technician `specialization` | Free-form text field |
| GST numbers | Tax registration identifiers |
| GST rate percentages (`5%`, `12%`) | Numeric values, locale-invariant |
| Currency amounts (already formatted with `formatINR`) | Formatted numeric data |

Applying `t()` to these values would produce key-miss warnings and show raw key strings to users.

---

## Adding a new language

1. Create a new folder: `src/i18n/locales/<lang>/`

2. Copy all 16 JSON files from `src/i18n/locales/en/` into the new folder.

3. Translate every string value. Keep all keys identical to the EN files.

4. Create `src/i18n/locales/<lang>/index.ts`:

```ts
import claims        from './claims.json';
import common        from './common.json';
// ...import all 16 namespaces

export const <lang>Resources = { claims, common, /* ... */ };
```

5. Register the new locale in `src/i18n/index.ts`:

```ts
import { <lang>Resources } from './locales/<lang>';

i18n.init({
  resources: {
    en: enResources,
    te: teResources,
    hi: hiResources,
    <lang>: <lang>Resources,   // ← add here
  },
  // ...
});
```

6. Add the language to the `LanguageSwitcher` component options.

7. Add `<lang>` to the `LOCALES` array in `scripts/i18n-check.mjs`.

8. Run `npm run i18n:check` — every key in EN must exist in the new locale.

---

## Running the validation tools

```bash
# Check all 16 namespaces × 3 locales for key parity and placeholder mismatches
npm run i18n:check

# Run typecheck + i18n check + build (what CI/Netlify runs)
npm run ci

# Warn-only mode (show all issues, but exit 0) — useful for draft PRs
npm run i18n:check:warn
```

The `npm run ci` command is what Netlify runs on every deployment. If `i18n:check` fails, the build fails and the deploy is blocked.

---

## Performance notes (future work, not needed now)

The current setup loads all 16 namespace bundles upfront via static imports. This is fine for the current bundle size. If the app grows substantially, consider:

- **Namespace lazy loading**: Load only `common` + `nav` upfront; load feature namespaces via `i18next.loadNamespaces('vendors')` when a route is visited. Requires switching to HTTP-backend (`i18next-http-backend`) or dynamic `import()`.
- **React Suspense mode**: Set `react.useSuspense: true` in i18n config to avoid the manual `ready` check pattern.

Do not implement these until bundle analysis shows a real impact — the current approach is simpler and works well for an admin SPA.

---

## Key structure conventions

```
namespace/
  title              ← page title
  description        ← page subtitle
  count_one          ← singular count (pluralization)
  count_other        ← plural count
  table/
    columnName       ← column header
    empty            ← empty state message
    aria/
      edit           ← aria-label for edit button
      delete         ← aria-label for delete button
  form/
    fieldName        ← form field label
    placeholders/
      fieldName      ← input placeholder
    errors/
      fieldRequired  ← validation error message
    title/
      add            ← modal title when adding
      edit           ← modal title when editing
  status/
    statusKey        ← translated status label
  messages/
    added            ← success toast after create
    updated          ← success toast after update
    removed          ← success toast after delete
    saveFailed       ← error toast after save failure
    confirmDelete    ← confirmation dialog message
```
