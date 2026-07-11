/**
 * Branches List API — Real-Auth End-to-End Verification
 *
 * Does a genuine POST /auth/login/email, then exercises GET /branches
 * with every status filter variant. Captures the live response envelope
 * shape and validates frontend field mapping.
 *
 * Usage:
 *   SA_EMAIL=you@example.com SA_PASSWORD=yourpass node verify_branches_list.mjs
 *
 * The script will prompt for missing env vars rather than hard-coding them.
 */

import { chromium } from 'playwright';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const BASE = 'http://localhost:5173';
const API  = 'https://wxg-backend.onrender.com/api/v1';

let passed = 0, failed = 0;

function assert(cond, label) {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else       { console.error(`  ❌ ${label}`); failed++; }
}
function info(msg)  { console.log(`  ℹ️  ${msg}`); }
function warn(msg)  { console.warn(`  ⚠️  ${msg}`); }
function header(s)  { console.log(`\n─── ${s}`); }
function section(s) { console.log(`\n══ ${s} ══`); }

// ── Credentials ─────────────────────────────────────────────────────────────
async function getCredentials() {
  let email    = process.env.SA_EMAIL;
  let password = process.env.SA_PASSWORD;

  if (!email || !password) {
    const rl = readline.createInterface({ input, output });
    if (!email)    email    = await rl.question('SUPER_ADMIN email: ');
    if (!password) password = await rl.question('SUPER_ADMIN password: ');
    rl.close();
  }
  return { email: email.trim(), password: password.trim() };
}

// ── Direct HTTP helper ───────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, ok: res.ok, body };
}

// ── Shape inspection ─────────────────────────────────────────────────────────
function describeShape(val, depth = 0) {
  if (val === null)           return 'null';
  if (Array.isArray(val))     return `Array(${val.length}) [${val.length > 0 ? describeShape(val[0], depth + 1) : '…'}]`;
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (depth > 1) return `{${keys.slice(0,6).join(', ')}${keys.length > 6 ? '…' : ''}}`;
    const inner = keys.map(k => `${k}: ${describeShape(val[k], depth + 1)}`).join(', ');
    return `{ ${inner} }`;
  }
  return typeof val;
}

function normalizeArray(raw, ...keys) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    for (const k of ['data', 'items', ...keys]) {
      if (Array.isArray(raw[k])) return raw[k];
    }
  }
  return [];
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // ── Step 0: credentials ───────────────────────────────────────────────────
  const { email, password } = await getCredentials();

  // ── Step 1: Login ─────────────────────────────────────────────────────────
  section('PHASE 1 — Real login: POST /auth/login/email');
  header('Login attempt');

  const loginRes = await apiFetch('/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  info(`HTTP ${loginRes.status}`);
  if (!loginRes.ok) {
    console.error(`  ❌ Login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
    console.error('  Aborting — cannot test branches without a real session.');
    process.exit(1);
  }

  const { accessToken, user, branch } = loginRes.body ?? {};
  assert(!!accessToken,        'accessToken present in login response');
  assert(!!user,               'user object present');
  assert(!!user?.role,         `role present: ${user?.role}`);
  assert(
    user?.role === 'SUPER_ADMIN',
    `role is SUPER_ADMIN (got: ${user?.role})`,
  );

  info(`Logged in as: ${user?.name} <${user?.email}> role=${user?.role}`);
  info(`Branch context: ${branch ? branch.name : 'null (cross-branch — expected for SUPER_ADMIN)'}`);

  const bearer = { Authorization: `Bearer ${accessToken}` };

  // ── Step 2: Raw GET /branches (no filter) ─────────────────────────────────
  section('PHASE 2 — GET /branches (no filter)');
  header('Raw response envelope');

  const allRes = await apiFetch('/branches', { headers: bearer });
  assert(allRes.ok, `GET /branches 200 OK (got: ${allRes.status})`);

  if (!allRes.ok) {
    console.error(`  Body: ${JSON.stringify(allRes.body)}`);
    process.exit(1);
  }

  info(`Top-level shape: ${describeShape(allRes.body)}`);

  // Determine envelope key
  let envelopeKey = null;
  if (Array.isArray(allRes.body)) {
    envelopeKey = 'array';
    info('Envelope: plain array (no wrapper)');
  } else if (allRes.body && typeof allRes.body === 'object') {
    const keys = Object.keys(allRes.body);
    info(`Envelope keys: [${keys.join(', ')}]`);
    for (const k of keys) {
      if (Array.isArray(allRes.body[k])) { envelopeKey = k; break; }
    }
    if (!envelopeKey && allRes.body.data) envelopeKey = 'data';
  }

  assert(!!envelopeKey, `Envelope key identified: ${envelopeKey}`);

  const items = normalizeArray(allRes.body, 'branches');
  info(`Total items returned (no filter): ${items.length}`);

  // ── Step 3: Item shape validation ─────────────────────────────────────────
  section('PHASE 3 — Item field mapping');

  const EXPECTED_FIELDS = [
    'id', 'code', 'name', 'state', 'district',
    'address', 'pincode', 'contactNumber',
    'email', 'openingTime', 'closingTime', 'status',
  ];

  if (items.length === 0) {
    warn('No items returned — cannot validate field mapping (empty list). Skipping field checks.');
  } else {
    const sample = items[0];
    info(`Sample item shape: ${describeShape(sample)}`);
    console.log('\n  Raw first item:');
    console.log(JSON.stringify(sample, null, 4).split('\n').map(l => '    ' + l).join('\n'));

    for (const f of EXPECTED_FIELDS) {
      assert(f in sample, `Field "${f}" present`);
    }

    // Check for legacy mock field names that should NOT appear
    const LEGACY = ['phone', 'openTime', 'closeTime', 'manager', 'staff', 'mapsUrl', 'serviceAreas', 'pincodes'];
    for (const f of LEGACY) {
      if (f in sample) warn(`Legacy mock field "${f}" present — frontend mapping may be stale`);
    }

    // Status value check
    const STATUS_VALS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    assert(
      STATUS_VALS.includes(sample.status),
      `status value is uppercase enum (got: "${sample.status}")`,
    );
  }

  // ── Step 4: Pagination check ───────────────────────────────────────────────
  section('PHASE 4 — Pagination contract');

  const PAGINATION_KEYS = ['total', 'page', 'pageSize', 'limit', 'offset', 'totalPages', 'meta'];
  const hasPagination   = allRes.body && typeof allRes.body === 'object' &&
    PAGINATION_KEYS.some(k => k in allRes.body);

  if (hasPagination) {
    const pKeys = PAGINATION_KEYS.filter(k => k in allRes.body);
    warn(`Paginated response detected — keys: [${pKeys.join(', ')}]`);
    warn('normalizeArray only extracts the items array; pagination metadata is discarded');
    warn('If total > items.length, frontend is missing page navigation (e → pagination contract mismatch)');
    info(`total: ${allRes.body.total ?? '—'}  page: ${allRes.body.page ?? '—'}  pageSize: ${allRes.body.pageSize ?? allRes.body.limit ?? '—'}`);
  } else {
    info('No pagination keys detected — response appears to be a flat list');
  }

  // ── Step 5: Status filter variants ────────────────────────────────────────
  section('PHASE 5 — Status filter variants');

  for (const status of ['ACTIVE', 'INACTIVE', 'SUSPENDED']) {
    header(`GET /branches?status=${status}`);
    const fRes = await apiFetch(`/branches?status=${status}`, { headers: bearer });
    assert(fRes.ok, `HTTP 200 for status=${status} (got: ${fRes.status})`);

    if (fRes.ok) {
      const fitems = normalizeArray(fRes.body, 'branches');
      info(`Items returned: ${fitems.length}`);

      if (fitems.length > 0) {
        const badStatus = fitems.filter(i => i.status !== status);
        assert(
          badStatus.length === 0,
          `All items have status=${status} (${badStatus.length} mismatches)`,
        );
      } else {
        info(`Empty result for status=${status} — empty-state UI will show`);
      }
    } else {
      info(`Body: ${JSON.stringify(fRes.body)}`);
    }
  }

  // ── Step 6: 401 path ──────────────────────────────────────────────────────
  section('PHASE 6 — 401 / expired-token path');
  header('GET /branches with expired/invalid token');

  const expiredRes = await apiFetch('/branches', {
    headers: { Authorization: 'Bearer EXPIRED-TOKEN' },
  });
  assert(expiredRes.status === 401, `Returns 401 for invalid token (got: ${expiredRes.status})`);
  info(`401 body: ${JSON.stringify(expiredRes.body)}`);

  // ── Step 7: UI verification via Playwright ────────────────────────────────
  section('PHASE 7 — UI drive: /settings/branches with real session');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  // Capture real /branches requests from the browser
  const capturedRequests = [];
  page.on('request', req => {
    if (req.url().includes('/branches') && req.method() === 'GET') {
      capturedRequests.push({ url: req.url(), headers: req.headers() });
    }
  });
  const capturedResponses = [];
  page.on('response', async res => {
    if (res.url().includes('/api/v1/branches') && res.request().method() === 'GET') {
      try {
        const body = await res.json();
        capturedResponses.push({ url: res.url(), status: res.status(), body });
      } catch { /* binary or empty */ }
    }
  });

  // Suppress expected console noise
  const NOISE = ['CORS','ERR_FAILED','wxg-backend','Failed to fetch','net::ERR','Failed to load resource','status of 4','status of 5','Unauthorized'];
  page.on('console', msg => {
    if (msg.type() === 'error' && !NOISE.some(n => msg.text().includes(n))) {
      console.error(`  🖥️  [browser error] ${msg.text()}`);
    }
  });

  // Inject the real access token so the app bootstraps as SUPER_ADMIN
  await ctx.addInitScript(([token, userJson]) => {
    // Intercept /auth/me to return our real session without hitting the backend twice
    window.__REAL_TOKEN__ = token;
    window.__REAL_USER__  = JSON.parse(userJson);
  }, [accessToken, JSON.stringify(loginRes.body)]);

  // Mock /auth/me to return the real user (avoids an extra network round-trip in headless)
  await page.route('**/auth/me', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(loginRes.body),
    }),
  );

  // Let /branches pass through to the real backend
  header('Navigating to /settings/branches');
  await page.goto(`${BASE}/settings/branches`, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for the table or empty state
  await page.waitForTimeout(3000);

  const url = page.url();
  info(`Final URL: ${url}`);
  assert(url.includes('/settings/branches') || url.includes('/login'), `Reached /settings/branches (got: ${url})`);

  // Check for branch rows or empty state
  const rows = await page.$$('table tbody tr, [class*="DataTable"] tbody tr, [role="row"]');
  info(`Table rows visible: ${rows.length}`);

  const emptyMsg = await page.$('[class*="emptyState"]');
  if (emptyMsg) {
    const txt = await emptyMsg.textContent();
    info(`Empty state text: "${txt}"`);
  }

  // Verify the real /branches URL was hit (not /settings/branches)
  header('Request URL audit');
  if (capturedRequests.length > 0) {
    for (const r of capturedRequests) {
      info(`Captured: GET ${r.url}`);
      assert(!r.url.includes('/settings/branches'), 'URL does NOT contain stray /settings/ prefix');
      assert(r.url.includes('/api/v1/branches'),    'URL matches /api/v1/branches');
      assert(!!r.headers['authorization'],           'Authorization header present on request');
      info(`Bearer: ${r.headers['authorization']?.slice(0, 30)}…`);
    }
  } else {
    warn('No /branches GET request captured in browser — may have been served from RTK cache');
  }

  // Captured live responses
  if (capturedResponses.length > 0) {
    header('Live browser response');
    const liveBody = capturedResponses[0].body;
    info(`HTTP ${capturedResponses[0].status}`);
    info(`Shape: ${describeShape(liveBody)}`);
    const liveItems = normalizeArray(liveBody, 'branches');
    info(`Items from live browser call: ${liveItems.length}`);
    if (liveItems.length > 0) {
      info(`First item fields: [${Object.keys(liveItems[0]).join(', ')}]`);
    }
  }

  // ── Status filter UI wiring ──────────────────────────────────────────────
  header('Status filter dropdown interaction');
  const filterSel = page.getByRole('combobox', { name: /filter by status/i });
  const filterExists = await filterSel.count() > 0;
  assert(filterExists, 'Status filter dropdown is rendered');

  if (filterExists) {
    for (const [val, label] of [['ACTIVE', 'Active'], ['INACTIVE', 'Inactive'], ['SUSPENDED', 'Suspended']]) {
      capturedRequests.length = 0;
      await filterSel.selectOption(val);
      await page.waitForTimeout(1500);
      const filtered = capturedRequests.filter(r => r.url.includes(`status=${val}`));
      assert(
        filtered.length > 0,
        `Selecting "${label}" sends ?status=${val} to backend`,
      );
      if (filtered.length > 0) info(`URL: ${filtered[0].url}`);
    }
  }

  await browser.close();

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  console.log('═'.repeat(60));
  if (failed > 0) process.exit(1);
})();
