# API Reference

Base URL: `http://localhost:5000/api`

All endpoints (except `/auth/login` and `/auth/refresh`) require a JWT bearer token:

```
Authorization: Bearer <accessToken>
```

Standard response envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description", "errors": [ ... ] }
```

Paginated list endpoints additionally include:

```json
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }
```

---

## Auth

### `POST /auth/login`
Body: `{ "email": "admin@hotel.com", "password": "Admin@123" }`
Returns: `{ user, accessToken, refreshToken }`

### `POST /auth/refresh`
Body: `{ "refreshToken": "..." }`
Returns: `{ accessToken, user }`

### `GET /auth/me`
Returns the currently authenticated user.

### `POST /auth/change-password`
Body: `{ "currentPassword": "...", "newPassword": "..." }`

---

## Users *(Admin only)*

| Method | Path                          | Description                     |
|--------|-------------------------------|----------------------------------|
| GET    | `/users`                      | List all users                   |
| POST   | `/users`                      | Create user `{name,email,password,role}` |
| PUT    | `/users/:id`                  | Update `{name?,role?,isActive?}` |
| POST   | `/users/:id/reset-password`   | `{newPassword}`                  |

Roles: `ADMIN`, `STAFF`, `OWNER`.

---

## Items

| Method | Path              | Roles          | Description |
|--------|-------------------|----------------|--------------|
| GET    | `/items`          | any            | List, params: `page,limit,search,category,availableOnly` |
| GET    | `/items/categories` | any          | Distinct category list |
| GET    | `/items/:id`      | any            | Get single item |
| POST   | `/items`          | ADMIN, OWNER   | Create `{itemCode,name,category,price,taxPercent,isAvailable}` |
| PUT    | `/items/:id`      | ADMIN, OWNER   | Update (same body) |
| DELETE | `/items/:id`      | ADMIN, OWNER   | Delete, or soft-disable if referenced by past bills |

---

## Bills

| Method | Path              | Roles          | Description |
|--------|-------------------|----------------|--------------|
| GET    | `/bills`          | any            | List, params: `page,limit,search,from,to,paymentStatus` |
| GET    | `/bills/:id`      | any            | Get single bill with line items |
| POST   | `/bills`          | any (license-gated) | Create a bill — see below |
| POST   | `/bills/:id/cancel` | ADMIN, OWNER | Marks a bill CANCELLED |

### `POST /bills` request body

```json
{
  "items": [{ "itemId": 1, "quantity": 2 }, { "itemId": 4, "quantity": 3 }],
  "customerName": "John Doe",
  "customerPhone": "9999999999",
  "roomNumber": "204",
  "discountAmount": 0,
  "paymentMethod": "CASH"
}
```

Prices and tax are always recalculated server-side from the current item master — the client
cannot influence pricing. If the trial/license has expired, this endpoint returns `402` with:

```json
{ "success": false, "code": "LICENSE_EXPIRED", "message": "...", "license": { ... } }
```

---

## Reports

| Method | Path                          | Roles        | Description |
|--------|-------------------------------|--------------|--------------|
| GET    | `/reports/dashboard`          | any          | Today/monthly sales, recent bills, top items, 7-day trend |
| GET    | `/reports/daily?date=YYYY-MM-DD` | any        | Single-day report (defaults to today) |
| GET    | `/reports/monthly?year=&month=` | any        | Month report (defaults to current month) |
| GET    | `/reports/yearly?year=`         | any        | Year report (defaults to current year) |
| GET    | `/reports/custom?from=&to=`     | any        | Arbitrary date range |
| POST   | `/reports/send-closing-summary?date=` | ADMIN, OWNER | Manually trigger the daily closing email/WhatsApp |

Range report shape:

```json
{
  "range": { "from": "2026-07-01", "to": "2026-07-21" },
  "totals": { "subtotal": 0, "tax": 0, "discount": 0, "total": 0, "billCount": 0 },
  "byDay": [{ "day": "2026-07-21", "billCount": 3, "total": 8942.5 }],
  "byPaymentMethod": [{ "payment_method": "CASH", "billCount": 3, "total": 8942.5 }],
  "topItems": [{ "name": "Deluxe Room", "code": "RM-DLX", "totalQty": 2, "totalRevenue": 7840 }],
  "bills": [ ... ]
}
```

---

## Settings

| Method | Path         | Roles          | Description |
|--------|--------------|----------------|--------------|
| GET    | `/settings`  | any            | Flat key-value object of all settings |
| PUT    | `/settings`  | ADMIN, OWNER   | Upsert any subset of keys |

Known keys: `hotel_name, hotel_address, hotel_phone, hotel_email, hotel_gstin, hotel_logo_url,
currency_symbol, default_tax_percent, invoice_prefix, invoice_footer_note,
receipt_paper_size (80mm|A4), printer_name`.

---

## License

| Method | Path                     | Roles  | Description |
|--------|--------------------------|--------|--------------|
| GET    | `/license/status`        | any    | Current trial/license state |
| POST   | `/license/activate`      | ADMIN  | `{licenseKey}` — activates the app |
| POST   | `/license/generate-key`  | ADMIN  | `{customerName, expiryDate?}` — vendor utility, see note below |

`/license/generate-key` is provided so the full activation loop is testable without a separate
license server. **In a real deployment, move key generation to a private, vendor-side tool and
remove/restrict this route** — end customers should only ever call `/license/activate`.

---

## Backups *(Admin only)*

| Method | Path                          | Description |
|--------|-------------------------------|--------------|
| GET    | `/backups`                    | List backup files |
| POST   | `/backups`                    | Create a new backup now |
| GET    | `/backups/:fileName/download` | Download a backup file |
| POST   | `/backups/restore`            | `{fileName}` — restore the database |

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400  | Validation / bad request |
| 401  | Missing or invalid JWT |
| 402  | License/trial expired (bill creation blocked) |
| 403  | Authenticated but insufficient role |
| 404  | Resource not found |
| 409  | Conflict (e.g. duplicate item code/email) |
| 422  | Request body failed field validation |
| 500  | Unexpected server error |
