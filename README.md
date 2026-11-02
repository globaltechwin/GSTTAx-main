# GSTTax — Enterprise ERP

A full-stack **GST / invoicing ERP** built with Next.js 16, Prisma 7, MySQL/MariaDB, and Tailwind CSS 4.

Manage companies, GST invoices, purchases, referrals, turnover reports, and users with workspace-scoped access.

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Live, workspace-scoped business totals, monthly activity, and recent records |
| **Company** | CRUD for your own companies with GST/PAN/ESI/EPF/SSI numbers, bank details, address |
| **To Company** | CRUD for customers/vendors (bill-to & ship-to parties) with GST & vendor codes |
| **Invoices** | GST invoices with CGST/SGST/IGST, reverse charge, line items, HSN/SAC, transport/challan, bank details, logo |
| **Purchases** | Purchase register with taxable value, IGST/CGST/SGST breakup |
| **Turnover Report** | Aggregated turnover reporting |
| **Referrals** | Referral contact management |
| **Import / Export** | Excel (`.xlsx`) & CSV imports for companies, to-companies, and referrals; exports are limited to supported modules and tracked |
| **Backup** | Versioned module snapshots; snapshots are not a database restore mechanism |
| **Users** | Workspace Admins manage subordinate users and module visibility |
| **Auth** | Scrypt password hashes, database-backed sessions, login throttling, and role checks |
| **Superadmin** | Platform overview, Admin workspace lifecycle management, and read-only live business records across Admin workspaces |
| **Settings** | Platform and workspace settings are stored in the database and scoped to the selected portal |

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

Copy `.env.example` to `.env` in the project root, then configure the database connection and a
random bootstrap token of at least 32 characters. On Windows PowerShell, use
`Copy-Item .env.example .env`.

```bash
# Local MySQL
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/gst_tax"
```

**Cloud example (Aiven MySQL):**
```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL/MariaDB connection URL used by Prisma |
| `BOOTSTRAP_TOKEN` | Initial setup | Random one-time bootstrap secret; remove it after Superadmin creation |

> `.env` is gitignored — never commit it.

Generate a strong bootstrap token with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

### 4. Generate Prisma Client & push schema

```bash
npx prisma generate
npx prisma db push
```

Review proposed schema changes and back up production data before applying them to an existing database.
The Superadmin and workspace settings features require the `platform_settings` and
`workspace_settings` tables defined in the Prisma schema.

> ⚠️ `src/generated/prisma/` is gitignored. You **must** run `npx prisma generate` after every fresh clone, or the app fails with:
> `Module not found: Can't resolve '@/generated/prisma/client'`

### 5. Create the initial Superadmin

There is no public registration or default login. Start the app, then call the one-time
`POST /api/auth/bootstrap` endpoint with the configured `x-bootstrap-token` header and a JSON
body containing `firstName`, `lastName`, `username`, and a password of 12–128 characters.
The endpoint only works while `BOOTSTRAP_TOKEN` is set on the server. Remove that variable
after successful bootstrap. Do not insert user records directly with SQL or create plaintext
passwords.

After bootstrap, sign in with the Superadmin account and create tenant Admin workspaces from
the Superadmin portal. Each Admin can then manage subordinate users in their own workspace.

### 6. Run the app

```bash
npm run dev
```

Open **http://localhost:3000** → redirected to login.

---

There are no default credentials. Admins have access to the modules enabled for their
workspace. Subordinate Users are limited to their assigned modules and remain read-only for
business data. Superadmins see business records across Admin workspaces in a read-only view;
workspace and platform settings are stored separately.

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
| GET | `/api/auth/session` | Current session |
| POST | `/api/auth/logout` | End the current session |
| POST | `/api/auth/bootstrap` | One-time Superadmin bootstrap; requires `x-bootstrap-token` |
| GET | `/api/dashboard` | Live dashboard data for the signed-in workspace |
| GET | `/api/superadmin/dashboard` | Superadmin platform overview |
| GET/POST | `/api/superadmin/admins` | List / create Admin workspaces |
| GET/PUT | `/api/superadmin/admins/[adminId]` | Read / update an Admin workspace |
| GET/PUT | `/api/superadmin/settings` | Read / save platform-wide settings (Superadmin only) |
| GET/PUT | `/api/settings` | Read / save the signed-in workspace's settings |
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
- Create the initial Superadmin first (see [Create the initial Superadmin](#5-create-the-initial-superadmin))
- Check `users.status` is `active`

---

## Security Notes

- Passwords are Scrypt-hashed. Legacy plaintext passwords are upgraded on successful login; rotate legacy credentials.
- Apply the Prisma schema before deploying. Back up production data before schema changes.
- Use HTTPS in production and keep `BOOTSTRAP_TOKEN` and database credentials secret.
- Never commit `.env` or real credentials
- Login throttling is database-backed. API access and workspace ownership are checked server-side.

---

## License

Private / unlicensed unless otherwise stated.
