# APP MODEL — Device Business Simulator
## Handover Documentation

> **Version:** 0.2.x · **Last updated:** Aug 21, 2026 · **Status:** MVP running (dev + prod)

---

## 1. What Is This Product?

**APP MODEL** is an **internal web application** for simulating the business feasibility of payment devices (**EDC** and **Soundbox**) before deployment.

Users pick a device model, choose a commercial scheme (**OTC** — one-time cash, or **MRC** — monthly recurring), set the scenario (units, period, fees), and the app calculates **revenue, cost, margin, and Break Even Point (BEP)** — then flags whether the deployment is **financially feasible**.

It replaces a manual Excel workflow (reference file: `Product Cost Structure 5Jan2026.xlsx`).

### Who uses it
| Role | What they do |
|---|---|
| **Admin** | Manage device master data (CRUD, activate/deactivate), run simulations |
| **User** | Run simulations only |

---

## 2. Core Business Concepts

### 2.1 Schemes
Only two schemes exist (Hybrid was removed per stakeholder decision):

- **OTC** — one-time cash purchase. No program period. One-shot revenue vs COGS.
- **MRC** — monthly recurring. Merchant pays a **daily fee** per active day; a **daily sales incentive** is paid out to sales. Revenue accrues over a **program period of 12 or 24 months**.

### 2.2 Dual COGS (IMPORTANT)
Each device has **two COGS values**, taken from the Excel `Device` sheet:

- **COGS Cash (OTC)** — row "COGS before Product Defect Cost", FULL CASH section
- **COGS Credit (MRC)** — the credit-scheme COGS; **higher** because the credit scheme bundles a data package + marketing cost

The Simulator **switches COGS automatically** based on the selected scheme:
- OTC selected → uses `cogs`
- MRC selected → uses `cogs_mrc`

COGS is **locked in the Simulator UI** (read-only) — it can only be changed by Admin in Device Management.

### 2.3 MRC building blocks (per device, per month)
```
Gross MRC        = dailyFee × activeDays          (per ACTIVE device)
Sales incentive  = dailyIncentive × activeDays    (per ACTIVE device)
Net MRC          = Gross MRC − Sales incentive    (per ACTIVE device)
Expected Net MRC = Net MRC × activeRate%          (per DEPLOYED device)
Avg active units = totalUnit × activeRate%
```

### 2.4 Feasibility rule
BEP threshold is a system setting (`bep_threshold_months`, default **10 months**):

- **BEP < 10 months** → ✅ **Feasible** (green)
- **BEP ≥ 10 months** → ❌ **Not Financially Feasible** (red)
- BEP unreachable (zero/negative expected Net MRC, or OTC price < COGS with no recurring income) → ❌ Not Feasible

Status always shows **icon + text + color** (never color alone — accessibility requirement).

---

## 3. Calculation Engine

Source: `server/calcEngine.js`. All money values in IDR (Rp).

### 3.1 OTC scheme
```
Total Revenue    = otcPrice × totalUnit
Total Cost       = COGS(cash) × totalUnit
Margin/Device    = otcPrice − COGS(cash)
Total Margin     = Total Revenue − Total Cost
Margin %         = Total Margin / Total Cost × 100
BEP              = otcPrice ≥ COGS ? "Immediate / Month 0" : "Not Reached"
```

### 3.2 MRC scheme
```
BEP (months)     = COGS(credit) ÷ Expected Net MRC
Margin/Device    = (Expected Net MRC × programPeriod) − COGS(credit)
Total Margin     = Margin/Device × totalUnit
Total Revenue    = Net MRC × activeRate% × programPeriod × totalUnit   (NET of incentive, so Revenue − Cost = Margin)
Total Cost       = COGS(credit) × totalUnit
```

### 3.3 Validation rules
| Rule | Error message |
|---|---|
| totalUnit > 0 | "Total unit must be greater than 0." |
| no negative inputs | "... cannot be negative." |
| 1 ≤ activeDays ≤ 31 | "Active days must be between 1 and 31." |
| 0 ≤ activeRate ≤ 100 | "Active device rate must be between 0 and 100%." |
| dailyIncentive ≤ dailyFee | warning, blocks calculation |

Program period is constrained by the UI to **12 or 24 months** (dropdown).

### 3.4 Verified benchmark (5M device, from Excel "APP MODEL" sheet)
Inputs: COGS 200,000 · OTC price 225,000 · daily fee 1,500 · incentive 500 · 22 active days · 50% active rate · 100 units

| Scenario | Metric | Engine result | Excel | ✓ |
|---|---|---|---|---|
| OTC | Total Revenue | Rp22,500,000 | 22,500,000 | ✅ |
| OTC | Total Margin | Rp2,500,000 | 2,500,000 | ✅ |
| OTC | Margin % | 12.5% | 13% (rounded) | ✅ |
| MRC | Gross MRC/mo | Rp33,000 | 33,000 | ✅ |
| MRC | Net MRC/mo | Rp22,000 | 22,000 | ✅ |
| MRC | BEP | 18.18 months | 18 | ✅ |
| MRC 12mo | Margin/device | −Rp68,000 | (68,000) | ✅ |
| MRC 12mo | Total margin | −Rp6,800,000 | (6,800,000) | ✅ |
| MRC 24mo | Margin/device | +Rp64,000 | 64,000 | ✅ |
| MRC 24mo | Total margin | +Rp6,400,000 | 6,400,000 | ✅ |

---

## 4. Tech Stack & Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5, React Router 6, Tailwind CSS 3, lucide-react icons |
| Backend | Node.js + Express 4 |
| Database | SQLite (better-sqlite3), file at `data/appmodel.db` |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

```
app-model-website/
├── index.html                  # Vite entry (fonts, title)
├── vite.config.js              # port 5173, host:true (LAN), proxy /api → :3001
├── tailwind.config.js          # brand palette = indigo, Inter font
├── server/
│   ├── index.js                # Express app, serves dist/ in production
│   ├── db.js                   # SQLite schema + migrations + default settings
│   ├── calcEngine.js           # ⭐ ALL business logic (calculate, validate)
│   ├── seed.js                 # seeds users + 10 devices (npm run seed)
│   └── routes/
│       ├── auth.js             # login, /me, requireAuth/requireAdmin middleware
│       ├── devices.js          # CRUD + toggle (admin-gated writes)
│       ├── simulate.js         # POST /calculate
│       └── settings.js         # BEP threshold get/put
└── src/
    ├── main.jsx / App.jsx      # router + auth guard
    ├── api/client.js           # fetch wrapper, token in localStorage, auto-logout on 401
    ├── context/AuthContext.jsx # session state
    ├── components/
    │   ├── Layout.jsx          # sidebar (desktop) / hamburger drawer (mobile)
    │   └── StatusBadge.jsx     # StatusBadge + BEPCard (icon+color+label)
    └── pages/
        ├── Login.jsx
        ├── Simulator.jsx       # ⭐ main page: inputs left, results right
        └── DeviceManagement.jsx# table + search/filter + add/edit modal (admin)
```

### UI/UX decisions (keep them)
- Clean fintech aesthetic: slate palette, white cards, subtle borders (1px) not heavy shadows, Inter font, indigo `brand-600` accent. **No gradients / "AI slop" look.** (Explicit stakeholder requirement.)
- Rupiah formatted with `id-ID` locale: `Rp2.500.000`
- Mobile responsive: sidebar collapses to hamburger drawer, table scrolls horizontally, modal full-width on phones
- Simulator auto-recalculates (400ms debounce) after the first manual Calculate

---

## 5. Database Schema

```sql
devices (
  id, device_id TEXT UNIQUE, device_name, status ('Active'|'Inactive'),
  cogs REAL,                    -- COGS for OTC/cash scheme
  cogs_mrc REAL,                -- COGS for MRC/credit scheme (added via migration)
  otc_enabled INT, default_otc_price REAL,
  mrc_enabled INT, default_daily_fee REAL, default_daily_incentive REAL,
  default_active_days INT, default_active_rate REAL,
  default_program_period INT,   -- 12 or 24
  created_at, updated_at
)

users (id, username UNIQUE, password TEXT, role 'admin'|'user')

settings (key, value)           -- 'bep_threshold_months' = '10'

simulations (id, device_id, scheme, total_unit, program_period,
             otc_price, daily_fee, daily_incentive, active_days, active_rate,
             result_json, created_at)   -- table exists; save feature NOT implemented
```

### Seeded devices (COGS from Excel Device sheet, "before Product Defect Cost")
| ID | Name | COGS Cash | COGS Credit | OTC Price | Daily Fee | Daily Incentive |
|---|---|---:|---:|---:|---:|---:|
| 5M | Device 5M *(benchmark)* | 200,000 | 200,000 | 225,000 | 1,500 | 500 |
| QS6 | Soundbox QS6 | 323,441 | 383,441 | 375,000 | 2,000 | 700 |
| QS5M | Soundbox QS5M | 319,200 | 379,200 | 350,000 | 1,800 | 600 |
| QS2 | Soundbox QS2 | 318,203 | 493,203 | 475,000 | 2,700 | 900 |
| QS3D | Soundbox QS3D | 446,250 | 566,250 | 599,000 | 3,000 | 1,000 |
| P5K | EDC P5K 8GB | 1,268,438 | 1,628,438 | 1,750,000 | 8,000 | 2,700 |
| P5SE | EDC P5SE | 1,631,438 | 2,051,438 | 2,250,000 | 11,000 | 3,700 |
| Q3 MINI | EDC Q3 Mini | 958,888 | 1,259,888 | 1,499,000 | 6,800 | 2,300 |
| Q3 | EDC Q3 | 1,685,888 | 2,082,675 | 2,399,000 | 11,000 | 3,700 |
| Q2 | EDC Q2 | 2,266,688 | 2,746,688 | 2,850,000 | 13,600 | 4,500 |

> ⚠️ **Data caveat:** OTC prices come from the Excel "Proposed EUP" row. **Daily fees & incentives are estimates** (fee ≈ credit monthly fee ÷ 22 days; incentive ≈ fee ÷ 3, matching the 5M ratio 1,500:500). Verify with Finance before treating MRC results as authoritative. The `5M` device intentionally uses the APP MODEL benchmark COGS (200k), which differs from QS5M's (319.2k) — it's the PRD reference device, not a duplicate.

---

## 6. API Reference

Base URL: `/api`. Auth = `Authorization: Bearer <token>` (token from login).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | `{username, password}` → `{token, user}` |
| GET | `/auth/me` | user | Verify token → session user |
| GET | `/devices?status=&search=` | user | List (status filter is case-insensitive) |
| GET | `/devices/:id` | user | Get one |
| POST | `/devices` | **admin** | Create (needs device_id, device_name) |
| PUT | `/devices/:id` | **admin** | Full update |
| PATCH | `/devices/:id/toggle` | **admin** | Active ↔ Inactive |
| DELETE | `/devices/:id` | **admin** | Delete |
| POST | `/simulate/calculate` | user | Full input → result object (below) |
| POST | `/simulate/save` | user | **501 — not implemented in MVP** |
| GET | `/simulate/history` | user | Reads simulations table |
| GET | `/settings` | user | All settings |
| PUT | `/settings` | **admin** | `{bep_threshold_months}` |

### `/simulate/calculate` request
```json
{
  "scheme": "otc | mrc",
  "totalUnit": 100,
  "programPeriod": 12,
  "cogs": 319200,
  "otcPrice": 350000,
  "dailyFee": 1800,
  "dailyIncentive": 600,
  "activeDays": 22,
  "activeRate": 50
}
```

### Response (abridged)
```json
{
  "scheme": "mrc",
  "grossMRC": 39600, "netMRC": 26400, "expectedNetMRC": 13200,
  "totalRevenue": ..., "totalCost": ..., "totalMargin": ...,
  "marginPerDevice": ..., "marginPct": ...,
  "bepMonths": 28.73, "bepLabel": "28,73 months",
  "feasibility": "layak | tidak_layak",
  "feasibilityReason": "…",
  "breakdown": ["Gross MRC/active device/month = …", "…"]
}
```
`breakdown` is an array of numbered human-readable formula steps — rendered as-is in the UI.

---

## 7. Running the App

```bash
npm install          # install deps
npm run seed         # (re)seed users + devices — WIPES devices table
npm run dev          # dev mode: API :3001 + Vite :5173 (LAN-accessible via --host)
npm run build        # production build → dist/
npm start            # production: Express serves API + dist on :3001
```

- **Dev URLs:** http://localhost:5173 (LAN: `http://<your-ip>:5173`)
- **Prod URL:** http://localhost:3001 (LAN: `http://<your-ip>:3001`)
- Find LAN IP: `ipconfig getifaddr en0` (macOS)
- No PM2/launchd setup yet — servers are plain background processes; they die on reboot.

### Demo credentials
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |

---

## 8. Known Limitations & Next Steps (for the next team)

**Security (fix before any real deployment)**
- Passwords stored in **plaintext** — hash them (bcrypt/argon2)
- Sessions are **in-memory** — server restart logs everyone out; move to DB/JWT
- No HTTPS, no rate limiting, no CSRF protection
- CORS wide open (`cors()` default)

**Functional gaps**
- "Save simulation / history" endpoint returns 501; `simulations` table exists but is unused by the UI
- No user management UI (users only via seed/manual SQL)
- BEP threshold is global; no per-scheme or per-device override
- No unit tests — engine is verified only against the 5M Excel benchmark (all values match, see §3.4)
- Daily fee/incentive values for the 9 Excel devices are **estimates** (see §5 caveat)

**Nice-to-haves**
- Export simulation to PDF/Excel
- Simulation comparison view (side-by-side schemes/devices)
- Chart of cumulative cashflow over the program period (BEP visualization)

**Reference files**
- PRD: `PRD APP MODEL Website v0.2.md` (original requirements; Hybrid scheme & editable COGS were later removed — this doc supersedes where they conflict)
- Pricing source: `Product Cost Structure 5Jan2026.xlsx` (sheets: APP MODEL, Device, Reseller model)

---

*Built with Rowboat, Aug 2026. Calculation engine verified against Excel benchmarks — if you change `calcEngine.js`, re-run the §3.4 benchmark first.*
