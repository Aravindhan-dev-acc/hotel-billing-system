# Installation & Deployment Guide

## 1. Prerequisites

- Node.js 18+ and npm
- (Optional, for notifications) An SMTP account for email, and a Twilio or Meta WhatsApp
  Cloud API account for WhatsApp
- No separate database server is required — SQLite is a single file, created automatically

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and configure at minimum:

```ini
PORT=5000
CLIENT_URL=http://localhost:4200
JWT_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate a different long random string>
LICENSE_SIGNING_SECRET=<generate another long random string - keep this SECRET and offline>
```

Generate strong secrets, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start the server:

```bash
npm start          # production
# or
npm run dev         # auto-restart on file changes (requires nodemon, already in devDependencies)
```

On first run the backend will:
1. Create `data/hotel_billing.db` and all tables automatically.
2. Seed default users (Admin/Owner/Staff), 12 sample items, a settings row, and a trial license record.

The API is now available at `http://localhost:5000/api` (health check: `GET /api/health`).

### Re-seeding

The seed script is idempotent (only inserts missing rows), so it's safe to run again:

```bash
npm run seed
```

## 3. Frontend Setup

```bash
cd frontend
npm install
```

Edit `src/environments/environment.ts` (dev) and `environment.prod.ts` (production build) to
point `apiUrl` at your backend:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
};
```

Run in development:

```bash
npm start           # http://localhost:4200, proxies to the backend URL configured above
```

Build for production:

```bash
npm run build        # outputs to dist/hotel-billing-frontend/browser
```

Serve the `dist/hotel-billing-frontend/browser` folder with any static file server (nginx,
Apache, `serve`, or your hosting provider of choice). Because it's a PWA, it must be served
over **HTTPS** in production (or `localhost` for testing) for the service worker to register.

## 4. Email Notifications (NodeMailer)

In `backend/.env`:

```ini
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password        # use an App Password, not your normal Gmail password
EMAIL_FROM="Hotel Billing System <your_email@gmail.com>"
OWNER_NOTIFICATION_EMAIL=owner@yourhotel.com
```

Any standard SMTP provider works (Gmail, Outlook/Office365, SendGrid SMTP relay, Amazon SES
SMTP, your own mail server, etc.) — just fill in the corresponding host/port/credentials.

## 5. WhatsApp Notifications

Choose **one** provider in `backend/.env` via `WHATSAPP_PROVIDER`:

### Option A — Twilio

```ini
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886     # Twilio's sandbox or your approved sender
OWNER_WHATSAPP_NUMBER=whatsapp:+91XXXXXXXXXX    # owner's number, E.164 format
```

### Option B — Meta WhatsApp Cloud API

```ini
WHATSAPP_PROVIDER=meta
META_WA_PHONE_NUMBER_ID=1234567890
META_WA_ACCESS_TOKEN=your_permanent_or_temp_access_token
META_WA_RECIPIENT_NUMBER=91XXXXXXXXXX            # no '+' or 'whatsapp:' prefix for Meta
```

If `WHATSAPP_PROVIDER=none` (default), WhatsApp sends are skipped and logged only — the rest
of the app works normally.

Notifications fire automatically:
- **After every bill** (email + WhatsApp, fire-and-forget so billing itself never blocks)
- **Daily closing summary** at 23:55 server time (built-in scheduler, no external cron needed),
  or on-demand from the Reports page ("Send Daily Closing Summary Now" button)

## 6. Licensing

See [LICENSING.md](LICENSING.md) for the full trial/activation model. Quick summary:
- New installs start in a 30-day / 100-bill trial (whichever comes first).
- Once expired, billing is blocked and the app shows an activation screen.
- An Admin generates/receives a license key and pastes it in to unlock — no reinstall needed.

## 7. Database Backup & Restore

From the Settings → Backup & Restore tab (Admin only), or via the API:

```bash
# Create a backup
curl -X POST http://localhost:5000/api/backups -H "Authorization: Bearer <admin_token>"

# List backups
curl http://localhost:5000/api/backups -H "Authorization: Bearer <admin_token>"

# Restore (overwrites the live DB - restart the backend afterwards)
curl -X POST http://localhost:5000/api/backups/restore \
  -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
  -d '{"fileName":"hotel_billing_backup_2026-07-21T05-09-00-000Z.db"}'
```

Backups are plain copies of the SQLite file, stored in `backend/backups/`. For off-site
safety, periodically copy this folder (or the whole `backend/data` + `backend/backups`
directories) to external storage.

## 8. Deployment Notes

- **Process manager:** run the backend under PM2 or systemd so it restarts on crash/reboot:
  ```bash
  pm2 start src/server.js --name hotel-billing-api
  ```
- **Reverse proxy:** put nginx in front of both the API and the static frontend build, with
  HTTPS termination (Let's Encrypt). Example nginx snippet:
  ```nginx
  server {
    listen 443 ssl;
    server_name billing.yourhotel.com;

    location /api/ {
      proxy_pass http://localhost:5000/api/;
      proxy_set_header Host $host;
    }

    location / {
      root /var/www/hotel-billing-frontend/browser;
      try_files $uri $uri/ /index.html;
    }
  }
  ```
- **CORS:** set `CLIENT_URL` in the backend `.env` to your production frontend origin.
- **Environment separation:** use different `.env` files (and different `JWT_SECRET` /
  `LICENSE_SIGNING_SECRET` values) per environment (dev/staging/production).
- **Android install:** once served over HTTPS, visiting the site in Chrome on Android shows
  an "Install App" prompt (or use the browser menu → "Add to Home screen") thanks to the PWA
  manifest and service worker.

## 9. Default Ports

| Service          | Port  |
|------------------|-------|
| Backend API      | 5000  |
| Frontend (dev)   | 4200  |
