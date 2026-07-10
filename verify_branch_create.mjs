/**
 * Branch Creation API Integration — End-to-End Verification
 *
 * Phase 1: Real backend probe — sends actual POST /branches with mock session token.
 *          Captures exact request URL, payload, headers, and live backend response.
 * Phase 2: Mocked response scenarios — 201, 409, 401, permission gate, labels, validation.
 *
 * Run: node verify_branch_create.mjs
 * Prerequisite: dev server on :5174 with VITE_USE_MOCK_API=false
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const API  = 'https://wxg-backend.onrender.com/api/v1';

let passed = 0, failed = 0;

function assert(cond, label) {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else       { console.error(`  ❌ ${label}`); failed++; }
}
function info(msg) { console.log(`  ℹ️  ${msg}`); }

const NOISE = [
  'CORS','ERR_FAILED','wxg-backend','onrender.com','Failed to fetch',
  'net::ERR','Failed to load resource','status of 4','status of 5',
];
const isFrontendError = t => !NOISE.some(p => t.includes(p));

// ── Mock session factories (matching BackendAuthResponse shape) ──────────────
const mkSession = (role, branch = null) => ({
  accessToken: 'FAKE-TOKEN-NOT-VALID-ON-BACKEND',
  user: { id: 'u-sa-001', name: 'Super Admin', email: 'admin@glasspro.com',
          role, isActive: true, passwordSetupComplete: true, branchId: null },
  branch,
});

const SA = mkSession('SUPER_ADMIN');
const OP = mkSession('OPERATOR');

// ── Route helpers ────────────────────────────────────────────────────────────
const r200 = (route, data) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
const r201 = (route, data) =>
  route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(data) });
const r401 = route =>
  route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthorized"}' });
const r409 = (route, data) =>
  route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify(data) });

// ── Test harness ────────────────────────────────────────────────────────────
async function run(browser, label, fn) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && isFrontendError(msg.text())) errors.push(msg.text());
  });
  console.log(`\n─── ${label}`);
  try { await fn(page, errors); }
  catch (e) { console.error(`  💥 Unexpected: ${e.message}`); failed++; }
  finally    { await ctx.close(); }
}

// ── Form fill data (exact backend contract example values) ───────────────────
const DATA = {
  name:                   'Glass Pro - Hyderabad Hitech City',
  code:                   'glass-pro-hyd-hitech',
  state:                  'Telangana',
  district:               'Hyderabad',
  address:                'Plot 12, Hitech City Road, Near Cyber Towers',
  pincode:                '500081',
  latitude:               '17.385',
  longitude:              '78.4867',
  contactNumber:          '9140234567',
  alternateContactNumber: '9140234568',
  email:                  'hitech@glasspro.com',
  adminName:              'Rajesh Kumar',
  adminEmail:             'rajesh@glasspro.com',
  adminPassword:          'Rajesh@123',
  adminPhone:             '919876543210',
};

async function fillBranchForm(page) {
  await page.getByLabel('Branch Name').fill(DATA.name);
  await page.getByLabel('Branch Code').fill(DATA.code);
  await page.getByLabel('State').fill(DATA.state);
  await page.getByLabel('District').fill(DATA.district);
  await page.locator('textarea').fill(DATA.address);
  await page.getByLabel('Pincode').fill(DATA.pincode);
  await page.getByLabel('Latitude').fill(DATA.latitude);
  await page.getByLabel('Longitude').fill(DATA.longitude);
  await page.getByLabel('Contact Number').fill(DATA.contactNumber);
  await page.getByLabel('Alternate Number').fill(DATA.alternateContactNumber);
  await page.getByLabel('Branch Email').fill(DATA.email);
  // Time inputs have no label association — select by type
  const timeInputs = page.locator('input[type="time"]');
  await timeInputs.nth(0).fill('09:00');
  await timeInputs.nth(1).fill('19:00');
  // Status select
  try {
    await page.getByLabel('Status').selectOption('ACTIVE');
  } catch {
    await page.locator('select').selectOption('ACTIVE');
  }
  // Admin section
  await page.getByLabel('Admin Full Name').fill(DATA.adminName);
  // Both "Admin Email" and "Branch Email" exist — need exact match
  await page.getByLabel('Admin Email').fill(DATA.adminEmail);
  await page.getByLabel('Admin Phone').fill(DATA.adminPhone);
  await page.getByLabel('Temporary Password').fill(DATA.adminPassword);
}

async function openModal(page) {
  await page.goto(`${BASE}/settings/branches`);
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Add Branch' }).click();
  await page.waitForTimeout(500);
}

// ════════════════════════════════════════════════════════════════════════════

const browser = await chromium.launch({ headless: true });

// ── PHASE 1: Real backend probe ──────────────────────────────────────────────
console.log('\n══ PHASE 1: Real backend probe ══');
console.log('  Sending POST /branches to live wxg-backend (fake token → expect 401 from backend)');
console.log('  Purpose: verify URL, payload shape, auth header, and backend reachability.\n');

await run(browser, 'P1 · Real POST /branches — capture request + backend response', async (page) => {
  let capturedRequest = null;
  let capturedResponseStatus = null;
  let capturedResponseBody   = null;

  // Auth bootstrap: mock SUPER_ADMIN session with fake token
  await page.route(`${API}/auth/me`, route => r200(route, SA));
  // Refresh: return 401 so tryRefreshToken() returns false → forceLogout if /branches 401
  await page.route(`${API}/auth/refresh`, route => r401(route));
  // /branches: NO MOCK — hit real backend, but intercept to capture
  await page.route(`${API}/branches`, async route => {
    capturedRequest = route.request();
    // Let the request through to real backend
    try {
      const response = await route.fetch();
      capturedResponseStatus = response.status();
      capturedResponseBody   = await response.text();
      await route.fulfill({ response });
    } catch (e) {
      // CORS or network error from real backend
      capturedResponseBody = `[fetch error: ${e.message}]`;
      // fulfill with 401 so the app doesn't hang
      await r401(route);
    }
  });

  await openModal(page);
  await fillBranchForm(page);

  // Intercept any redirect to /login before clicking submit
  const navigationPromise = page.waitForURL(/\/login|\/branches/, { timeout: 8000 }).catch(() => null);
  await page.getByRole('button', { name: 'Create Branch' }).click();
  await navigationPromise;
  await page.waitForTimeout(1000);

  // ── Report captured request details ──
  if (capturedRequest) {
    const url     = capturedRequest.url();
    const headers = capturedRequest.headers();
    const rawBody = capturedRequest.postData() ?? '{}';
    let body;
    try { body = JSON.parse(rawBody); } catch { body = rawBody; }

    console.log(`\n  Request URL:    ${url}`);
    console.log(`  Method:         ${capturedRequest.method()}`);
    console.log(`  Auth header:    ${headers['authorization']?.slice(0, 40) ?? '(none)'}`);
    console.log(`  Backend status: ${capturedResponseStatus ?? 'no response'}`);
    console.log(`  Backend body:   ${capturedResponseBody?.slice(0, 300) ?? '(empty)'}`);
    console.log(`\n  Payload sent:\n${JSON.stringify(body, null, 2).split('\n').map(l => `    ${l}`).join('\n')}`);

    // URL checks
    assert(url === `${API}/branches` || url.endsWith('/branches'),
      `URL → ${API}/branches`);
    assert(!url.includes('/settings/branches'),
      'URL does NOT route through /settings/branches');

    // Auth header
    const auth = headers['authorization'] ?? headers['Authorization'] ?? '';
    assert(auth.startsWith('Bearer '),
      `Authorization: Bearer header present`);

    // All 18 fields present in body
    const REQUIRED_FIELDS = [
      'name','code','state','district','address','pincode',
      'latitude','longitude','contactNumber','alternateContactNumber',
      'email','openingTime','closingTime','status',
      'adminName','adminEmail','adminPassword','adminPhone',
    ];
    for (const f of REQUIRED_FIELDS) {
      assert(f in body, `Payload field "${f}" present`);
    }

    // Field-name renames verified
    assert(!('phone'        in body), 'phone NOT sent (correctly replaced by contactNumber)');
    assert(!('openTime'     in body), 'openTime NOT sent (correctly renamed to openingTime)');
    assert(!('closeTime'    in body), 'closeTime NOT sent (correctly renamed to closingTime)');
    assert(!('managerId'    in body), 'managerId NOT sent (removed from create flow)');
    assert(!('mapsUrl'      in body), 'mapsUrl NOT sent (removed from create flow)');
    assert(!('serviceAreas' in body), 'serviceAreas NOT sent (removed from create flow)');
    assert(!('pincodes'     in body), 'pincodes NOT sent (removed from create flow)');

    // Latitude/longitude as numbers
    assert(typeof body.latitude  === 'number', `latitude typeof number (got ${typeof body.latitude})`);
    assert(typeof body.longitude === 'number', `longitude typeof number (got ${typeof body.longitude})`);
    assert(body.latitude  === 17.385,  `latitude value = 17.385`);
    assert(body.longitude === 78.4867, `longitude value = 78.4867`);

    // adminPassword included
    assert(typeof body.adminPassword === 'string' && body.adminPassword.length > 0,
      'adminPassword included in payload');

    // Classify backend response
    if (capturedResponseStatus === null) {
      info('Backend unreachable (CORS block from localhost or network) — this is a backend/CORS config issue, NOT a frontend bug');
      info('Payload and URL are correct based on captured request');
    } else if (capturedResponseStatus === 401) {
      info(`Backend returned 401 — expected with fake token; endpoint is reachable`);
      info('Classification: (c) backend role/auth — fake token rejected; not a frontend bug');
    } else if (capturedResponseStatus === 201) {
      info('Backend returned 201 — branch created successfully with real token!');
    } else if (capturedResponseStatus === 403) {
      info(`Backend returned 403 — token valid but role insufficient; classification: (c) backend role/auth`);
    } else {
      info(`Backend returned ${capturedResponseStatus} — body: ${capturedResponseBody?.slice(0,200)}`);
    }

  } else {
    assert(false, 'Request to /branches was NOT captured (check VITE_USE_MOCK_API=false)');
    info('If no request fired, the app may still be using mock mode');
  }
});


// ── PHASE 2: Mocked response scenarios ──────────────────────────────────────
console.log('\n══ PHASE 2: Mocked response scenarios ══');

// T1: 201 Success UX
await run(browser, 'T1 · 201 → success toast visible and modal closes', async (page) => {
  await page.route(`${API}/auth/me`,      route => r200(route, SA));
  await page.route(`${API}/auth/refresh`, route => r401(route));
  await page.route(`${API}/branches`, route =>
    r201(route, { id: 'br-001', name: DATA.name, code: DATA.code }));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);
  await fillBranchForm(page);
  await page.getByRole('button', { name: 'Create Branch' }).click();
  await page.waitForTimeout(2500);

  const dialogGone = !(await page.locator('[role="dialog"]').isVisible().catch(() => true));
  assert(dialogGone, 'Modal closed after 201');

  const toast = page.locator('[role="status"], [role="alert"], [class*="toast" i], [class*="Toast"]')
    .filter({ hasText: /created|success/i });
  assert(await toast.count() > 0, 'Success toast shown');
});

// T2: 409 with backend message
await run(browser, 'T2a · 409 + backend message → shows backend text', async (page) => {
  await page.route(`${API}/auth/me`,      route => r200(route, SA));
  await page.route(`${API}/auth/refresh`, route => r401(route));
  await page.route(`${API}/branches`, route =>
    r409(route, { message: 'Branch code already exists', statusCode: 409 }));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);
  await fillBranchForm(page);
  await page.getByRole('button', { name: 'Create Branch' }).click();
  await page.waitForTimeout(2000);

  const errToast = page.locator('[role="status"], [role="alert"], [class*="toast" i], [class*="Toast"]')
    .filter({ hasText: /already|conflict|in use/i });
  assert(await errToast.count() > 0, '409 conflict toast visible');

  // Modal stays open so user can correct
  const modalOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  assert(modalOpen, 'Modal stays open on 409 (user can correct the conflict)');
});

// T3: 409 fallback (no message field)
await run(browser, 'T2b · 409 no message → fallback error text', async (page) => {
  await page.route(`${API}/auth/me`,      route => r200(route, SA));
  await page.route(`${API}/auth/refresh`, route => r401(route));
  await page.route(`${API}/branches`, route =>
    r409(route, { statusCode: 409 }));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);
  await fillBranchForm(page);
  await page.getByRole('button', { name: 'Create Branch' }).click();
  await page.waitForTimeout(2000);

  const fallback = page.locator('[role="status"], [role="alert"], [class*="toast" i], [class*="Toast"]')
    .filter({ hasText: /code already|already assigned|in use/i });
  assert(await fallback.count() > 0, '409 fallback toast shown');
});

// T4: 401 from /branches → forceLogout → /login?reason=session_expired
// Note: /auth/me always returns SA (survives StrictMode double-bootstrap).
// The 401 path fires via /branches → tryRefreshToken → 401 → forceLogout().
// After forceLogout, the mock re-bootstrap re-authenticates and moves to /dashboard.
// Use waitForURL predicate BEFORE the click to catch the intermediate /session_expired URL.
await run(browser, 'T3 · /branches 401 → tryRefresh → 401 → forceLogout → /login?reason=session_expired', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, SA));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/branches`,          route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  // Register listener BEFORE the click so the transient URL is caught
  const sessionExpiredPromise = page.waitForURL(
    url => url.toString().includes('session_expired'),
    { timeout: 10000 },
  );

  await openModal(page);
  await fillBranchForm(page);
  await page.getByRole('button', { name: 'Create Branch' }).click();

  const reached = await sessionExpiredPromise.then(() => true).catch(() => false);
  assert(reached, `forceLogout fired: /login?reason=session_expired reached (landed at: ${page.url()})`);
  info('Note: mock /auth/me re-authenticates after forceLogout → page moved on to dashboard; expected in mock mode');
});

// T5: Permission gate — SUPER_ADMIN sees Add Branch
await run(browser, 'T4 · SUPER_ADMIN → Add Branch button visible', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, SA));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await page.goto(`${BASE}/settings/branches`);
  await page.waitForTimeout(2500);

  const btn = page.getByRole('button', { name: 'Add Branch' });
  assert(await btn.count() > 0,   'Add Branch visible for SUPER_ADMIN');
  assert(await btn.isVisible(),    'Add Branch is visible (not hidden)');
});

// T6: Permission gate — OPERATOR does NOT see Add Branch
await run(browser, 'T5 · OPERATOR → Add Branch button hidden', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, OP));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await page.goto(`${BASE}/settings/branches`);
  await page.waitForTimeout(2500);

  const btn = page.getByRole('button', { name: 'Add Branch' });
  assert(await btn.count() === 0, 'Add Branch NOT rendered for OPERATOR');
});

// T7: Temporary Password label + hint text + type=password
await run(browser, 'T6 · Temporary Password field — label, hint, type=password', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, SA));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);

  const label = page.locator('label').filter({ hasText: /temporary password/i });
  assert(await label.count() > 0, 'Label "Temporary Password" present');

  const hint = page.locator('*').filter({ hasText: /must change.*first login/i });
  assert(await hint.count() > 0, 'Hint "must change this on first login" present');

  const pwInput = page.locator('input[type="password"]');
  assert(await pwInput.count() > 0, 'Password field type="password"');
});

// T8: Empty form submission — required errors shown
await run(browser, 'T7 · Submit empty → required errors', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, SA));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);
  await page.getByRole('button', { name: 'Create Branch' }).click();
  await page.waitForTimeout(500);

  const nameErr  = page.locator('*').filter({ hasText: /branch name is required/i });
  const codeErr  = page.locator('*').filter({ hasText: /branch code is required/i });
  const stateErr = page.locator('*').filter({ hasText: /state is required/i });

  assert(await nameErr.count()  > 0, 'Name required error shown');
  assert(await codeErr.count()  > 0, 'Code required error shown');
  assert(await stateErr.count() > 0, 'State required error shown');
  assert(await page.locator('[role="dialog"]').isVisible(), 'Modal stays open on validation fail');
});

// T9: Branch code sanitization
await run(browser, 'T8 · Branch code onChange sanitizes to [a-z0-9-]', async (page) => {
  await page.route(`${API}/auth/me`,           route => r200(route, SA));
  await page.route(`${API}/auth/refresh`,      route => r401(route));
  await page.route(`${API}/settings/branches`, route => r200(route, []));

  await openModal(page);

  const codeInput = page.getByLabel('Branch Code');
  await codeInput.fill('Glass Pro HYD 2024');
  await page.waitForTimeout(300);

  const value = await codeInput.inputValue();
  assert(/^[a-z0-9-]*$/.test(value), `Code sanitized to "[${value}]" — only lowercase, digits, hyphens`);
  assert(!value.includes(' '),        'No spaces in sanitized code');
  assert(value === value.toLowerCase(), 'Code is lowercase');
  info(`Sanitized value: "${value}"`);
});

// ── Cleanup + report ──────────────────────────────────────────────────────────
await browser.close();

const total = passed + failed;
console.log(`\n${'═'.repeat(60)}`);
console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failed > 0) {
  console.error('\n⚠️  Some checks failed — see ❌ lines above.');
  process.exit(1);
}
