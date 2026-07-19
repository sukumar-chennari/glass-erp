# Verify skill — glass-erp-admin

## Launch
```bash
cd glass-erp-admin
npm run dev -- --port 5299   # Vite, ready in ~400ms
```
Entry page (unauthenticated public route): http://localhost:5299/
Staff login: http://localhost:5299/login

## Drive
- Playwright 1.61 is installed (`npx playwright --version`).
- Chromium works headless with no extra flags.
- Mock API is active when `VITE_USE_MOCK_API=true` (default in dev).
- Auth bootstrap fires on every page load — wait for `networkidle` before measuring.

## Key flows
- Entry page: auto-opens callback panel (top-right), GPS location prompt, insurance marquee
- Login: email + password OR mobile OTP (two-mode)
- Staff roles: super_admin → /settings, branch_manager → /dashboard, operator → /enquiry, technician → /jobs

## Gotchas
- Session state is in-memory (no localStorage token in cookie mode). Hard-refresh clears session.
- Mock RTK Query responses add ~200ms artificial delay.
