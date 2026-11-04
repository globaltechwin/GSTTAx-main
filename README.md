# GSTTax — Enterprise ERP

A full-stack **GST Billing and Enterprise Resource Planning (ERP)** application built with Next.js 16, React 19, TypeScript, Prisma 7, MySQL, and Tailwind CSS 4.

GSTTax helps businesses manage companies, customers, vendors, GST invoices, proforma invoices, delivery challans, purchase orders, purchases, referrals, and business reports through a workspace-based ERP system.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Live, workspace-scoped business totals, monthly activity, and recent records. |
| **Company** | Manage company details, GSTIN, PAN, ESI, EPF, SSI numbers, addresses, bank details, and company logos. |
| **To Company** | Manage customer and business-party details, including billing and shipping information, GSTIN, and vendor codes. |
| **Invoice** | Create and manage GST tax invoices with line items, HSN/SAC, CGST, SGST, IGST, reverse charge, transport details, bank details, and company logos. |
| **Proforma Invoice** | Create and manage separate proforma invoices with independent numbering, customer details, product details, discounts, GST, and totals. |
| **Delivery Challan** | Create and manage delivery challans independently of GST invoices and sales revenue. |
| **Vendor Details** | Create, edit, search, and manage vendor records, including contact information, GSTIN, PAN, address, state, and opening balance. |
| **Purchase Order** | Create, view, edit, approve, print, and manage vendor purchase orders with product details, quantities, discounts, GST types, and totals. |
| **Purchase GST Calculation** | Calculate GST using IGST or CGST + SGST based on company and vendor states. Supports discounts and cess. |
| **Purchases** | Manage purchase records and taxable values with GST breakup. |
| **Turnover Report** | View aggregated turnover information for the workspace. |
| **Referrals** | Manage referral contacts and related information. |
| **Import / Export** | Import supported business records from Excel and CSV files and export supported data. |
| **Backup** | Create versioned module snapshots. These snapshots are not a database restore mechanism. |
| **Users** | Workspace Admins can manage subordinate users and their module permissions. |
| **Superadmin** | Platform overview, Admin workspace management, and read-only access to business records across workspaces. |
| **Settings** | Manage workspace settings and platform settings separately. |
| **Authentication** | Scrypt password hashing, database-backed sessions, login throttling, and role-based access control. |

---

## Tech Stack

| Technology | Usage |
|---|---|
| Next.js 16 | Full-stack framework and App Router |
| React 19 | User interface |
| TypeScript | Application development |
| MySQL / MariaDB | Relational database |
| Prisma 7 | ORM and database migrations |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |
| React Hook Form | Form management |
| Zod | Input validation |
| TanStack Table | Data tables |
| Recharts | Charts and reports |
| Zustand | State management |
| XLSX / PapaParse / CSV Parse | Excel and CSV processing |

---

## Prerequisites

Install the following before running the project:

- Node.js 20 or later (Node.js 22 LTS recommended)
- npm
- MySQL 8+ or compatible MariaDB
- Git
- Visual Studio Code (recommended)

### MySQL installation

**Windows:** Install MySQL using the [MySQL Installer](https://dev.mysql.com/downloads/installer/).

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

**macOS:**

```bash
brew install mysql
brew services start mysql
```

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/GSTTAx.git
cd GSTTAx
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
npm install
```

If you are installing from a committed package lock file, you can use:

```bash
npm ci
```

### 3. Create the MySQL database

```sql
CREATE DATABASE gst_tax;
```

Default local MySQL configuration:

- Host: `127.0.0.1`
- Port: `3306`
- Database: `gst_tax`

### 4. Configure environment variables

Create a `.env` file in the project root.

You can copy the example file if `.env.example` exists.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Configure your database connection:

```env
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/gst_tax"
BOOTSTRAP_TOKEN="YOUR_RANDOM_SECRET_TOKEN"
```

For a cloud MySQL database, use the connection details provided by your database provider and configure SSL if required.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL/MariaDB database connection |
| `BOOTSTRAP_TOKEN` | Initial setup | Secret token for creating the first Superadmin |

Generate a strong bootstrap token:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

**Security:** Never commit `.env` or expose database credentials in GitHub.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

The generated Prisma Client is stored under:

```text
src/generated/prisma/
```

This directory is generated locally and should not be committed.

### 6. Apply database migrations

For a fresh database or an existing database with the project's migration history:

```bash
npx prisma migrate deploy
```

This applies the committed migrations in order.

**Important:** Back up existing database data before applying migrations to an existing database. Do not use `prisma migrate reset` on a database containing business records.

### 7. Create the initial Superadmin

GSTTax does not use public registration or default login credentials.

Start the application and use the one-time endpoint:

```text
POST /api/auth/bootstrap
```

Include the configured `x-bootstrap-token` header and a JSON request body containing:

- `firstName`
- `lastName`
- `username`
- `password`

The password must contain 12–128 characters.

After successfully creating the initial Superadmin, remove `BOOTSTRAP_TOKEN` from the server environment and restart the application.

The Superadmin can then create Admin workspaces. Each Admin manages their own workspace and subordinate users.

### 8. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Purchase Order GST Calculation

Purchase Orders support GST calculation using the company and vendor state details.

### Supported GST types

| GST Type | Calculation |
|---|---|
| IGST | Full applicable GST rate |
| CGST + SGST | GST split equally between CGST and SGST |
| AUTO | Determines the tax split using company and vendor states |
| CESS | Additional cess amount |

### Calculation flow

1. Calculate the product subtotal using quantity and unit rate.
2. Apply the product discount.
3. Calculate the taxable value.
4. Calculate the applicable GST.
5. Add cess.
6. Calculate the final purchase order total.

The server recalculates purchase order amounts when creating or updating records rather than trusting totals submitted by the browser.

Complete company and vendor state details are important for correct intra-state and inter-state GST calculations.

---

## Workspace and User Access

GSTTax uses workspace-scoped access.

- **Superadmin:** Manages the platform and Admin workspaces.
- **Admin:** Manages business records within their own workspace.
- **Subordinate User:** Has access according to assigned module permissions.
- **Tenant isolation:** One Admin cannot access another Admin's business records.
- **Read-only Superadmin access:** Superadmin can inspect tenant business records without editing them through the read-only workspace views.

Platform settings and workspace settings are stored separately.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma Client and create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code using Prettier |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | Run TypeScript type checking |

---

## Project Structure

```text
GSTTAx/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── companies/
│   │   │   ├── delivery-challans/
│   │   │   ├── invoices/
│   │   │   ├── purchase-orders/
│   │   │   ├── purchases/
│   │   │   ├── vendors/
│   │   │   └── superadmin/
│   │   ├── dashboard/
│   │   ├── superadmin/
│   │   └── page.tsx
│   ├── components/
│   │   ├── purchase-order/
│   │   └── ...
│   ├── generated/
│   │   └── prisma/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── purchase-order-tax.ts
│   │   └── ...
│   └── stores/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## API Overview

The application exposes REST API routes for its main modules.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/logout` | End current session |
| POST | `/api/auth/bootstrap` | One-time Superadmin creation |
| GET | `/api/dashboard` | Workspace dashboard data |
| GET | `/api/companies` | List companies |
| POST | `/api/companies` | Create a company |
| GET / PUT / DELETE | `/api/companies/[id]` | Manage a company |
| GET / POST | `/api/to-companies` | Manage business parties |
| GET / POST | `/api/invoices` | List and create invoices |
| GET / POST | `/api/delivery-challans` | List and create delivery challans |
| GET / POST | `/api/vendors` | List and create vendors |
| GET / POST | `/api/purchase-orders` | List and create purchase orders |
| GET / POST | `/api/purchases` | Manage purchase records |
| GET / POST | `/api/referrals` | Manage referrals |
| GET / POST | `/api/users` | Manage workspace users |
| GET | `/api/turnover-report` | Retrieve turnover report |
| POST | `/api/import` | Import supported Excel/CSV data |
| GET | `/api/export` | Export supported records |
| GET | `/api/backup` | Create backup snapshots |
| GET | `/api/superadmin/dashboard` | Platform overview |
| GET / POST | `/api/superadmin/admins` | List and create Admin workspaces |
| GET / PUT | `/api/settings` | Workspace settings |
| GET / PUT | `/api/superadmin/settings` | Platform settings |

---

## Troubleshooting

### Prisma Client module not found

Run:

```bash
npx prisma generate
```

Restart the development server.

### MySQL connection refused

Check that MySQL is running and verify the host, port, database name, username, and password in `.env`.

### Access denied for MySQL user

Verify the database user's credentials and privileges.

### Prisma migration error

Check the migration status:

```bash
npx prisma migrate status
```

Back up the database before making any changes to an existing database. Do not reset a database containing business data.

### Login fails

- Confirm the initial Superadmin has been created.
- Verify that the account is active.
- Check that the application is connected to the correct database.

---

## Security Notes

- Passwords are stored using Scrypt hashing.
- Sessions are database-backed.
- Login throttling is enabled.
- API access and workspace ownership are checked server-side.
- Keep database credentials and bootstrap tokens private.
- Use HTTPS in production.
- Back up the database before applying production migrations.
- Never commit `.env`, private keys, or generated secrets.

---

## License

Private / unlicensed unless otherwise stated.
