# Licensing System

## Trial Rules

A fresh install starts in **TRIAL** status, usable until **either**:
- **30 days** have elapsed since first run (`LICENSE_TRIAL_DAYS` in `.env`), **or**
- **100 bills** have been generated (`LICENSE_TRIAL_BILL_LIMIT` in `.env`)

**whichever limit is hit first.** Both are tracked in the single-row `license` table
(`trial_start_date`, `trial_bill_count`).

## What Happens on Expiry

- The **backend** enforces the limit server-side: `POST /bills` returns `402 LICENSE_EXPIRED`
  once expired, regardless of what the frontend does. This is the actual enforcement point —
  the frontend guard is a UX convenience, not the security boundary.
- The **frontend** shows a persistent status badge (trial countdown, or "License expired -
  click to activate") in the top bar, and the `licenseGuard` route guard redirects any attempt
  to open the Billing page to `/license`.
- **Read-only areas remain accessible** even when expired: dashboard, reports, item management,
  settings, bill history. Only *creating new bills* is blocked — the hotel can still review
  historical data and get a license sorted without losing access to everything.

## Activation Flow

1. An Administrator obtains a license key from the vendor/reseller (out of band — phone,
   email, portal, however your business sells the product).
2. In the app: **Settings → (or the auto-redirected /license screen)** → paste the key →
   **Activate License**.
3. `POST /api/license/activate` validates the key and, if valid, sets `status = 'ACTIVE'`,
   records `activation_date`, and (if the key has one) `expiry_date`.
4. Billing is immediately unblocked — **no reinstallation, no restart required.**

## License Key Format (offline-verifiable)

Keys are self-contained and cryptographically signed, so activation works **without any
network call to a license server** — the backend verifies the key locally using
`LICENSE_SIGNING_SECRET`.

```
HBMS-<base64url(payload)>-<hmac-sha256(payload, secret)[:24]>

payload = "<customerName>|<expiryDateISO-or-'PERPETUAL'>|<issuedAtISO>"
```

This means:
- Keys **cannot be forged** without knowing `LICENSE_SIGNING_SECRET`.
- Keys **can be perpetual** (no expiry) or **time-limited** (e.g. annual subscription —
  set `expiryDateISO` and the app will flip back to `EXPIRED` automatically after that date).
- Multiple installs can be licensed independently by generating a different key per customer.

### Generating Keys

`POST /api/license/generate-key` (Admin-only, on the running backend) wraps
`licenseService.generateLicenseKey(customerName, expiryDateISO)` for convenience during
development/testing so the whole activate loop is verifiable end-to-end without extra tooling.

**For a real product business:** move this generation function to a small, separate,
vendor-side CLI or internal tool that you keep the signing secret in — do **not** expose
`/license/generate-key` on customer-facing production deployments. Treat
`LICENSE_SIGNING_SECRET` like a private signing key (because it is one): anyone who has it can
mint valid license keys for any of your customers' installs.

```js
// Example vendor-side key generation (Node REPL or a small script)
const licenseService = require('./src/services/license.service');
console.log(licenseService.generateLicenseKey('Grand Palace Hotel', '2027-07-21'));
// => HBMS-R3JhbmQgUGFsYWNlIEhvdGVsfDIwMjctMDctMjFUMDA6MDA6MDAuMDAwWnwyMDI2LTA3LTIxVDA1OjA5OjA3Ljc3M1o-3ecb3005a3ae50eb
```

## License State Machine

```
        ┌─────────┐   30 days OR 100 bills elapsed    ┌─────────┐
        │  TRIAL  │ ─────────────────────────────────▶│ EXPIRED │
        └────┬────┘                                    └────┬────┘
             │ activate(validKey)                            │ activate(validKey)
             ▼                                                ▼
        ┌─────────┐    expiry_date passed (if set)      ┌─────────┐
        │ ACTIVE  │ ────────────────────────────────────▶│ EXPIRED │
        └─────────┘                                       └─────────┘

        BLOCKED — set manually by an admin/vendor action (not exposed via a route by
                  default); billing is blocked the same way as EXPIRED.
```

`GET /api/license/status` always recomputes and returns the *current* effective status —
nothing is cached client-side beyond the current session.
