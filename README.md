# GSTTax — Enterprise ERP

A full-stack **GST / invoicing ERP** built with Next.js 16, Prisma 7, MySQL/MariaDB, and Tailwind CSS 4.

Manage companies, GST invoices, purchases, referrals, turnover reports, and users — with Excel/CSV import, export, and backup.

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Stats cards (companies, invoices, purchases), revenue charts, recent activity |
| **Company** | CRUD for your own companies with GST/PAN/ESI/EPF/SSI numbers, bank details, address |
| **To Company** | CRUD for customers/vendors (bill-to & ship-to parties) with GST & vendor codes |
| **Invoices** | GST invoices with CGST/SGST/IGST, reverse charge, line items, HSN/SAC, transport/challan, bank details, logo |
| **Purchases** | Purchase register with taxable value, IGST/CGST/SGST breakup |
| **Turnover Report** | Aggregated turnover reporting |
| **Referrals** | Referral contact management |
| **Import / Export** | Excel (`.xlsx`) & CSV import/export for companies, to-companies, invoices, referrals, full database — with history logs |
| **Backup** | Full/module backups as Excel, CSV, or JSON |
| **Users** | User management with roles (`admin` / `user`), status, and per-module sidebar access |
| **Auth** | Username/password login with role-based sidebar visibility |
| **Settings** | App preferences (persisted client-side) |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- **Database:** MySQL / MariaDB (local or cloud, e.g. Aiven / TiDB Cloud)
- **ORM:** [Prisma 7](https://www.prisma.io) with `@prisma/adapter-mariadb`
- **Styling:** Tailwind CSS 4, shadcn/ui-style components, lucide-react icons
- **Forms:** react-hook-form + Zod validation
- **Tables:** TanStack Table
- **Charts:** Recharts
- **State:** Zustand
- **Excel/CSV:** xlsx, papaparse, csv-parse

---

## Prerequisites

- **Node.js** 20+ (recommended 22 LTS)
- **npm** (or yarn / pnpm / bun)
- **MySQL** or **MariaDB** running locally (or a cloud MySQL connection string)

### Install MySQL locally (if you don't have one)

**macOS (Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
```

**Windows:** Download [MySQL Installer](https://dev.mysql.com/downloads/installer/)

---

## Setup — from scratch

### 1. Clone & install

```bash
git clone <repo-url>
cd GSTTAx-main
npm install
```

### 2. Create the database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS gst_tax;"
```

> Note your MySQL host, port, user, and password for the next step.
> Default local port is `3306`. This project has also been used on port `3307`.

### 3. Create `.env`

Create a `.env` file in the project root:

```bash
# Local MySQL
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/gst_tax"
```

**Cloud example (Aiven MySQL):**
```bash
DATABASE_URL="mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string used by Prisma |

> `.env` is gitignored — never commit it.

### 4. Generate Prisma Client & push schema

```bash
npx prisma generate
npx prisma db push
```

> ⚠️ `src/generated/prisma/` is gitignored. You **must** run `npx prisma generate` after every fresh clone, or the app fails with:
> `Module not found: Can't resolve '@/generated/prisma/client'`

### 5. Seed a login user

There is no sign-up page. Create a user via the API (or SQL):

**Option A — API (app must be running):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "username": "admin",
    "password": "admin",
    "role": "admin",
    "status": "active",
    "sidebarAccess": ["dashboard","companies","to-companies","invoices","purchases","turnover-report","referrals","import-export","users","settings"]
  }'
```

**Option B — SQL:**
```sql
USE gst_tax;
INSERT INTO users (first_name, last_name, username, password, role, status, sidebar_access, created_at, updated_at)
VALUES ('Admin', 'User', 'admin', 'admin', 'admin', 'active', '["dashboard","companies","to-companies","invoices","purchases","turnover-report","referrals","import-export","users","settings"]', NOW(), NOW());
```

### 6. Run the app

```bash
npm run dev
```

Open **http://localhost:3000** → redirected to login.

---

## Default Login Credentials

> Development credentials only — **change them before deploying.**

| Username | Password | Role  |
|----------|----------|-------|
| `admin`  | `admin`  | admin |
| `yuvanth`| `Sheru#29` | user |

Admins see the full sidebar. Regular users only see modules listed in their `sidebarAccess`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma Client + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | TypeScript type check |

---

## Project Structure

```
GSTTAx-main/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── page.tsx           # Login page
│   │   ├── dashboard/         # App pages (companies, invoices, ...)
│   │   └── api/               # REST API routes
│   ├── components/            # UI components
│   ├── lib/
│   │   ├── auth.ts            # Authentication logic
│   │   ├── db.ts              # Prisma client
│   │   ├── data.ts            # Shared types / mock data
│   │   ├── validations.ts     # Zod schemas
│   │   └── services/          # Import / export / backup services
│   ├── stores/                # Zustand stores
│   └── generated/prisma/      # Prisma Client (generated, gitignored)
├── .env                       # Environment variables (gitignored)
└── package.json
```

---

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/companies` | List / create companies |
| GET/PUT/DELETE | `/api/companies/[id]` | Company by id |
| GET/POST | `/api/to-companies` | List / create to-companies |
| GET/POST | `/api/invoices` | List / create invoices |
| GET/POST | `/api/purchases` | List / create purchases |
| GET/POST | `/api/referrals` | List / create referrals |
| GET/POST | `/api/users` | List / create users |
| GET | `/api/turnover-report` | Turnover report |
| POST | `/api/import` | Import Excel/CSV |
| GET | `/api/export` | Export data |
| GET | `/api/backup` | Backup data |

---

## Troubleshooting

### `Module not found: Can't resolve '@/generated/prisma/client'`
```bash
npx prisma generate
```
Restart the dev server after generating.

### `Can't reach MySQL server` / `ECONNREFUSED`
- Ensure MySQL is running: `brew services list` (macOS) or `systemctl status mysql`
- Verify `DATABASE_URL` host, port, user, password, and database name
- Test: `mysql -u root -p -h 127.0.0.1 -P 3306 -e "SHOW DATABASES;"`

### `Access denied for user`
Wrong username/password in `DATABASE_URL`, or the MySQL user lacks privileges on the database.

### Cloud DB host not resolving / connection timeout
- Confirm the service is **Running** (not paused) in your cloud console
- Confirm host/port from the console — copy them exactly
- Ensure SSL mode matches (e.g. `?ssl-mode=REQUIRED` for Aiven)

### Login fails with "Invalid username or password"
- Create a user first (see [Seed a login user](#5-seed-a-login-user))
- Check `users.status` is `active`

---

## Security Notes

- Passwords are currently stored **in plain text** — hash them (e.g. bcrypt) before any production use
- Restrict CORS / auth on API routes before deploying publicly
- Never commit `.env` or real credentials
- Change default logins immediately

---

## License

Private / unlicensed unless otherwise stated.
