# Database Schema

SQLite database, auto-created on first backend startup (`backend/src/db/database.js`).
File location: `backend/data/hotel_billing.db` (configurable via `DB_PATH` in `.env`).

## Entity Overview

```
users ──< bills >── bill_items >── items
license (single row)
settings (key-value)
notification_log
```

## Tables

### `users`
| Column         | Type    | Notes |
|----------------|---------|-------|
| id             | INTEGER | PK, autoincrement |
| name           | TEXT    | |
| email          | TEXT    | UNIQUE |
| password_hash  | TEXT    | bcrypt hash |
| role           | TEXT    | `ADMIN` \| `STAFF` \| `OWNER` |
| is_active      | INTEGER | 1/0 |
| created_at / updated_at | TEXT | ISO datetime |

### `items`
| Column        | Type    | Notes |
|---------------|---------|-------|
| id            | INTEGER | PK |
| item_code     | TEXT    | UNIQUE |
| name          | TEXT    | |
| category      | TEXT    | default `'General'` |
| price         | REAL    | >= 0 |
| tax_percent   | REAL    | default 0 |
| is_available  | INTEGER | 1/0 |
| created_at / updated_at | TEXT | |

Indexes: `category`, `name`.

### `bills`
| Column           | Type    | Notes |
|------------------|---------|-------|
| id               | INTEGER | PK |
| bill_number      | TEXT    | UNIQUE, format `<PREFIX>-<YYYYMMDD>-<seq>` |
| customer_name / customer_phone / room_number | TEXT | nullable |
| subtotal, tax_amount, discount_amount, total_amount | REAL | |
| payment_method   | TEXT    | `CASH`\|`CARD`\|`UPI`\|`ONLINE`\|`OTHER` |
| payment_status   | TEXT    | `PAID`\|`PENDING`\|`CANCELLED` |
| created_by       | INTEGER | FK → users.id |
| created_at       | TEXT    | |

Indexes: `created_at`, `bill_number`.

### `bill_items`
| Column        | Type    | Notes |
|---------------|---------|-------|
| id            | INTEGER | PK |
| bill_id       | INTEGER | FK → bills.id, `ON DELETE CASCADE` |
| item_id       | INTEGER | FK → items.id |
| item_name, item_code | TEXT | snapshotted at time of billing (survives later item edits) |
| unit_price, tax_percent | REAL | snapshotted |
| quantity      | REAL    | > 0 |
| line_total    | REAL    | price*qty + tax |

Indexes: `bill_id`, `item_id`.

### `license`
Single-row table tracking trial/activation state.

| Column              | Type    | Notes |
|---------------------|---------|-------|
| id                  | INTEGER | PK |
| license_key         | TEXT    | nullable until activated |
| status              | TEXT    | `TRIAL`\|`ACTIVE`\|`EXPIRED`\|`BLOCKED` |
| activation_date     | TEXT    | nullable |
| expiry_date         | TEXT    | nullable (NULL = perpetual license) |
| trial_start_date    | TEXT    | set at seed time |
| trial_bill_limit    | INTEGER | default 100 |
| trial_bill_count    | INTEGER | incremented on each bill while status=`TRIAL` |
| customer_name       | TEXT    | from the activated license key |
| updated_at          | TEXT    | |

See [LICENSING.md](LICENSING.md) for the full state machine.

### `settings`
Simple key-value store.

| Column | Type | Notes |
|--------|------|-------|
| key    | TEXT | PK |
| value  | TEXT | |
| updated_at | TEXT | |

### `notification_log`
Audit trail of every email/WhatsApp send attempt (useful for debugging delivery issues).

| Column        | Type    | Notes |
|---------------|---------|-------|
| id            | INTEGER | PK |
| type          | TEXT    | `EMAIL`\|`WHATSAPP` |
| event         | TEXT    | e.g. `BILL_CREATED`, `DAILY_CLOSING` |
| recipient     | TEXT    | nullable |
| status        | TEXT    | `SENT`\|`FAILED` |
| error_message | TEXT    | nullable |
| created_at    | TEXT    | |

## Design Notes

- **WAL mode** (`journal_mode = WAL`) is enabled for better concurrent read/write performance.
- **Foreign keys are enforced** (`PRAGMA foreign_keys = ON`).
- Bill line items **snapshot** item name/price/tax at billing time, so editing or deleting an
  item later never changes historical bills.
- Deleting an item that has been used in any bill **soft-deletes** it (`is_available = 0`)
  instead of a hard delete, preserving referential integrity for bill history/reports.
- All monetary calculations happen **server-side** in `bill.service.js` from the current
  `items` table — the API never trusts client-submitted prices.
