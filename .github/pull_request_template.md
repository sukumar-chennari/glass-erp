## Summary

<!-- What does this PR do? One or two sentences. -->

## Type of change

- [ ] Bug fix
- [ ] New feature / page
- [ ] Refactor / cleanup
- [ ] Translation / i18n update
- [ ] Styling / layout

---

## i18n Checklist

Work through this before requesting review. Every item must be checked or explicitly marked N/A.

### Hardcoded strings
- [ ] No hardcoded user-facing text in JSX (button labels, table headers, empty states, toast messages, placeholders, aria-labels)
- [ ] No string concatenation that mixes translated and untranslated parts — use `{{interpolation}}` keys instead

### New locale keys
- [ ] All new translation keys added to **`en/`** first as the source of truth
- [ ] Matching keys added to **`te/`** with Telugu translation
- [ ] Matching keys added to **`hi/`** with Hindi translation
- [ ] Keys follow the namespace convention — see [I18N_GUIDE.md](../docs/I18N_GUIDE.md#namespace-selection)

### Enums and controlled values
- [ ] Any new status, type, or position enum has a corresponding entry in `src/i18n/statusKeys.ts`
- [ ] Table/card cells displaying enum values use an explicit `render:` function with the key mapper + `t()`
- [ ] `StatusBadge` always receives a `getLabel` prop using the appropriate status key mapper

### Form validation
- [ ] Zod schemas with user-facing error messages are inside `useMemo([t])`, not module-level constants
- [ ] Select option labels built from `useMemo([t])` arrays, not hardcoded strings
- [ ] All new validation error strings added to all three locale files

### Not translated (confirm these are intentionally excluded)
- [ ] Customer/technician/vendor names — user-entered, leave as-is
- [ ] Phone numbers, emails, registration numbers, IDs — leave as-is
- [ ] GST numbers and numeric tax rates (`5%`, `12%`) — leave as-is

### Validation
- [ ] `npm run i18n:check` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors

---

## Test notes

<!-- How did you verify this change? Screenshots, manual steps, etc. -->
