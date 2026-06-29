# Backend Auth Contract

This document defines the HTTP API contract that `src/services/auth/http.ts` expects.
When plugging in the real backend, implement these endpoints and the frontend swap is a single line in `src/services/auth/index.ts`.

---

## Swap point

```ts
// src/services/auth/index.ts — change this one line:
import { authServiceMock as authService } from './mock';   // current (mock)
import { authServiceHttp as authService } from './http';   // production
```

---

## Role model

The business-approved role names are fixed. These values must match exactly between the backend enum/DB and the frontend `UserRole` type.

| Role             | Scope                    | Branch | Description                            |
|------------------|--------------------------|--------|----------------------------------------|
| `super_admin`    | System-wide              | null   | Creates branches, staff, system config |
| `branch_manager` | One branch               | set    | Manages staff, jobs, reports           |
| `technician`     | One branch (field)       | set    | Field work, own job cards              |
| `operator`       | One branch (back-office) | set    | General branch operations              |

`branch` is `null` for `super_admin`. All other roles must include a `branch` object.

---

## Session shape

The frontend `Session` type (see `src/services/auth/types.ts`):

```ts
interface Session {
  user:        { id: string; name: string; email: string; mobile?: string };
  role:        'super_admin' | 'branch_manager' | 'technician' | 'operator';
  tenantId:    string;
  tenantName:  string;
  branch:      { id: string; name: string } | null;
  permissions: string[];
}
```

---

## Endpoints

### `POST /api/auth/login`

**Request**
```json
{ "identifier": "staff@example.com", "password": "••••••••" }
```
`identifier` may be an email address or mobile number.

**Success (single-step) — 200**
```json
{
  "token": "<signed-jwt>",
  "session": {
    "user":        { "id": "u1", "name": "Ravi Kumar", "email": "ravi@example.com", "mobile": "9876543210" },
    "role":        "branch_manager",
    "tenant_id":   "t1",
    "tenant_name": "WindX Hyderabad",
    "branch":      { "id": "b1", "name": "Main Branch" },
    "permissions": ["jobs:read", "jobs:write", "invoices:read"]
  }
}
```

**OTP challenge — 200 (password verified, OTP required)**
```json
{ "requires_otp": true, "otp_token": "<signed-otp-session-token>" }
```
Frontend catches this as `AuthError({ code: 'OTP_REQUIRED', otpToken })` and navigates to `/verify-otp?token=<otp_token>`.

> **Note:** If OTP is not yet enabled on a tenant, always return the single-step 200. The OTP path is opt-in per tenant.

**Error — 401**
```json
{ "code": "INVALID_CREDENTIALS" }
```

**Error — 403 — account locked**
```json
{ "code": "ACCOUNT_LOCKED", "lock_until": "2025-06-15T10:45:00Z" }
```
`lock_until` is an ISO 8601 timestamp. The UI shows remaining minutes.
**Lock policy:** 5 consecutive wrong passwords lock the account for 30 minutes. Counter resets on a successful login.

**Error — 403 — inactive**
```json
{ "code": "ACCOUNT_INACTIVE" }
```

---

### `POST /api/auth/verify-otp`

Called from `/verify-otp` screen after the user enters the code.

**Request**
```json
{ "otp_token": "<signed-otp-session-token>", "otp": "123456" }
```

**Success — 200**
```json
{
  "token": "<signed-jwt>",
  "session": { /* same shape as login success */ }
}
```

**Error — 401**
```json
{ "code": "INVALID_CREDENTIALS" }
```

**Error — 410 (OTP expired)**
```json
{ "code": "TOKEN_EXPIRED" }
```

---

### `POST /api/auth/resend-otp`

Resend the OTP to the user's registered contact.

**Request**
```json
{ "otp_token": "<signed-otp-session-token>" }
```

**Success — 200** (no body required)

**Error — 410 (session expired)**
```json
{ "code": "TOKEN_EXPIRED" }
```

> OTP resend rate limit: recommended 1 per 30 seconds per session (the frontend enforces a UI cooldown; the backend should also enforce a hard limit).

---

### `GET /api/auth/me`

Validates the bearer token and returns the current session. Called on app load to rehydrate.

**Request** — `Authorization: Bearer <token>`

**Success — 200**
```json
{ "session": { /* same shape as login success */ } }
```

**Error — 401** — frontend clears storage and redirects to `/login`.

---

### `POST /api/auth/logout`

**Request** — `Authorization: Bearer <token>` (body empty)

**Success — 204** (no body)

The frontend performs optimistic logout (clears local state immediately) and calls this fire-and-forget.

---

### `POST /api/auth/forgot-password`

Triggers the password-reset email. **Always return 200** regardless of whether the email is registered (prevents user enumeration).

**Request**
```json
{ "email": "staff@example.com" }
```

**Success — 200** (no body required)

---

### `POST /api/auth/reset-password`

Consumes the signed token from the email link and sets the new password.

**Request**
```json
{
  "token":    "<signed-reset-token>",
  "password": "new-secure-password",
  "type":     "reset"
}
```
`type` is `"setup"` for first-time password set (new user invite link), `"reset"` for a standard forgot-password flow.

**Success — 204** (no body)

**Error — 400**
```json
{ "code": "TOKEN_INVALID" }
```
Token not found, already used, or signature mismatch.

**Error — 410**
```json
{ "code": "TOKEN_EXPIRED" }
```
Token TTL elapsed.

---

## Token storage

The frontend stores the JWT under the key `glass_erp_token` in `localStorage`. All RTK Query requests (via `src/services/baseApi.ts`) read this key and attach it as `Authorization: Bearer <token>`.

The auth service sets this key on login and clears it on logout.

---

## Global 401 handling

When migrating to the HTTP adapter, add an Axios (or fetch) interceptor:

```ts
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._authRetry) {
      authService.logout();
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);
```

The `!err.config._authRetry` guard prevents re-intercepting the login endpoint itself.

---

## Staff account lifecycle (business rules)

1. Only Super Admin creates staff accounts (Settings > Users > Add New User).
2. User fields: full name, email, mobile, role, branch, status.
3. On creation the backend emails a setup link: `/reset-password?token=<signed>&type=setup`. Admin never knows the password.
4. Wrong password 5 times → account locked for 30 minutes.
5. Forgot password → email reset link only (`/reset-password?token=<signed>&type=reset`). No admin password reset.
6. Only the user can reset their own password via the emailed link.
7. OTP verification follows password auth when enabled for the tenant.
8. Customers do not use this login system — staff portal only.

---

## Auth screen → route → endpoint map

| Screen                   | Route                              | Primary endpoint              |
|--------------------------|------------------------------------|-------------------------------|
| Login                    | `/login`                           | `POST /auth/login`            |
| OTP Verification         | `/verify-otp?token=<otp_token>`    | `POST /auth/verify-otp`       |
| Forgot Password          | `/forgot-password`                 | `POST /auth/forgot-password`  |
| Set Password (invite)    | `/reset-password?token=…&type=setup`  | `POST /auth/reset-password`   |
| Reset Password (forgot)  | `/reset-password?token=…&type=reset`  | `POST /auth/reset-password`   |
