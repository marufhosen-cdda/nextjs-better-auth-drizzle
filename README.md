# Next.js Better Auth + Drizzle + Cloudflare D1

A starter template for **Next.js 16** with email/password authentication, two-factor authentication (2FA), role-based access control (RBAC), CAPTCHA protection, and Cloudflare D1 database — deployable to Cloudflare Workers.

## Features

- **Email & Password Authentication** — Sign up / sign in with secure password hashing (8–32 character passwords)
- **Username Support** — Optional username during registration
- **Two-Factor Authentication (2FA)** — TOTP-based with QR code setup, verification, and backup codes
- **Cloudflare Turnstile CAPTCHA** — Bot protection on sign-in and sign-up forms
- **Role-Based Access Control** — System roles (USER, ADMIN, EMPLOYEE) with admin-only role management
- **Rate Limiting** — Built-in auth rate limiting (configurable window and max requests)
- **OpenAPI** — Auto-generated API documentation at `/api/auth/reference`
- **Next.js Cookies** — Server-side session management with proper cookie handling
- **Cloudflare D1** — Serverless SQLite database at the edge
- **OpenNext + Cloudflare Workers** — Deploy your Next.js app to Cloudflare's edge network
- **shadcn/ui** — Modern, accessible UI components with Tailwind CSS v4
- **Biome** — Fast linting and formatting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (React 19) |
| Authentication | [Better Auth](https://www.better-auth.com/) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Linting | [Biome](https://biomejs.dev/) |
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/cloudflare) |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth pages (redirect if already signed in)
│   │   │   ├── sign-in/         # Email/password sign-in with Turnstile CAPTCHA
│   │   │   │   └── two-factor/  # 2FA TOTP verification page
│   │   │   └── sign-up/         # Registration with Turnstile CAPTCHA
│   │   ├── (protected)/         # Protected pages (require authentication)
│   │   │   ├── dashboard/       # User dashboard with account info
│   │   │   ├── settings/        # Profile settings, enable/disable 2FA
│   │   │   └── roles/           # Admin-only role management
│   │   └── api/auth/[...all]/   # Better Auth catch-all API route
│   ├── components/
│   │   ├── auth-guard.tsx       # Client-side route protection component
│   │   ├── auth-panel.tsx       # Sign-in/sign-up form component
│   │   ├── turnstile-widget.tsx # Cloudflare Turnstile CAPTCHA wrapper
│   │   └── ui/                  # shadcn/ui components
│   ├── db/
│   │   ├── index.ts             # Drizzle client (D1 or local SQLite)
│   │   ├── schema.ts            # Database schema (user, session, account, etc.)
│   │   └── seed.ts              # Database seeding script
│   ├── lib/
│   │   ├── auth/                # Server-side auth configuration
│   │   │   ├── index.ts         # Better Auth instance
│   │   │   ├── database.ts      # Drizzle adapter config
│   │   │   ├── email-password.ts# Password policy (8–32 chars)
│   │   │   ├── rate-limit.ts    # Rate limiting config
│   │   │   └── user.ts          # User schema extensions
│   │   ├── auth-client.ts       # Client-side auth (better-auth/react)
│   │   └── utils.ts             # Utility functions (cn)
│   └── plugin/
│       ├── auth/                # Auth plugins
│       │   ├── captcha.ts       # Cloudflare Turnstile plugin
│       │   ├── next-cookies.ts  # Next.js cookie handling plugin
│       │   ├── open-api.ts      # OpenAPI documentation plugin
│       │   ├── two-factor.ts    # TOTP 2FA plugin
│       │   └── username.ts      # Username plugin
│       └── role/                # Role management plugin
│           ├── constants.ts     # System roles (USER, ADMIN, EMPLOYEE)
│           ├── endpoints.ts     # CRUD endpoints for role management
│           ├── middleware.ts    # Admin-only middleware
│           ├── roleManagementPlugin.ts # Better Auth plugin definition
│           └── seed.ts          # System roles seeder
├── drizzle/                     # Database migrations
├── open-next.config.ts          # OpenNext + Cloudflare config
├── wrangler.jsonc               # Cloudflare Workers config
├── drizzle.config.ts            # Drizzle Kit configuration
├── biome.json                   # Biome linter config
└── components.json              # shadcn/ui config
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/) (recommended) or npm/yarn/pnpm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### 1. Install dependencies

```bash
bun install
# or
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare D1 Database (for Drizzle Kit)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_API_TOKEN=your-api-token

# Cloudflare Turnstile (CAPTCHA)
TRANSTILE_SECRET_KEY=your-turnstile-secret-key
NEXT_PUBLIC_TRANSTILE_SITE_KEY=your-turnstile-site-key
```

#### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Secret key for signing tokens (generate a random string) |
| `BETTER_AUTH_URL` | Yes | Base URL for the auth server (e.g. `http://localhost:3000`) |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Your Cloudflare account ID |
| `CLOUDFLARE_DATABASE_ID` | Yes | D1 database ID (from `wrangler d1 create`) |
| `CLOUDFLARE_API_TOKEN` | Yes | API token with D1 and Workers permissions |
| `TRANSTILE_SECRET_KEY` | Yes | Cloudflare Turnstile secret key (for server-side verification) |
| `NEXT_PUBLIC_TRANSTILE_SITE_KEY` | Yes | Cloudflare Turnstile site key (exposed to client) |

### 3. Set up the database

Create a D1 database and run migrations:

```bash
# Create the D1 database (first time only)
wrangler d1 create test-db

# Update the database_id in wrangler.jsonc with the output from above

# Run migrations locally
bun run db:migrate:local

# Seed system roles (USER, ADMIN, EMPLOYEE)
bun run db:seed
```

### 4. Start development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root path `/` redirects to `/sign-in`.

The development server uses OpenNext's local Cloudflare emulation via `initOpenNextCloudflareForDev()` so D1 bindings work locally.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js development server with local Cloudflare emulation |
| `bun run build` | Build for production |
| `bun run preview` | Build and preview locally with Cloudflare Workers |
| `bun run deploy` | Build and deploy to Cloudflare Workers |
| `bun run db:push` | Push schema changes to D1 |
| `bun run db:pull` | Pull schema from D1 |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:studio` | Open Drizzle Studio (remote) |
| `bun run db:studio:local` | Open Drizzle Studio (local) |
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:remote` | Apply migrations to remote D1 |
| `bun run db:seed` | Seed system roles into local database |
| `bun run auth:generate` | Regenerate Better Auth schema |
| `bun run cf-typegen` | Generate Cloudflare type definitions |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |

## Database Schema

### Tables

- **`user`** — User accounts (id, name, email, username, role, twoFactorEnabled, timestamps)
- **`session`** — Active sessions with expiry, IP, and user agent tracking
- **`account`** — Linked authentication providers (OAuth, etc.)
- **`verification`** — Email verification tokens
- **`role`** — System and custom roles (USER, ADMIN, EMPLOYEE + custom)
- **`two_factor`** — TOTP secrets and backup codes per user

### Relationships

- User → Sessions (one-to-many)
- User → Accounts (one-to-many)
- User → Two-Factor records (one-to-many)

## Authentication Flow

### Sign Up
1. User fills in name, email, optional username, and password (8–32 characters)
2. Cloudflare Turnstile CAPTCHA is verified
3. Account is created with default role `USER`
4. User is automatically signed in

### Sign In
1. User enters email and password
2. Cloudflare Turnstile CAPTCHA is verified
3. If 2FA is enabled, user is redirected to `/sign-in/two-factor`
4. User enters 6-digit TOTP code from authenticator app
5. On success, session is created and user is redirected to `/dashboard`

### Two-Factor Setup (Settings page)
1. User confirms password
2. QR code is displayed for authenticator app (Google Authenticator, Authy, etc.)
3. User scans QR code and enters the 6-digit code to verify
4. Backup codes are displayed for safekeeping

## Role-Based Access Control

### System Roles

| Role | Description |
|------|-------------|
| `USER` | Default role for all new users |
| `ADMIN` | Full access to role management |
| `EMPLOYEE` | System-defined role (extensible) |

### Admin Features

- Admin users see a **Roles** link on the dashboard
- The `/roles` page allows admins to create, rename, and delete custom roles
- System roles (USER, ADMIN, EMPLOYEE) cannot be modified or deleted
- All role management endpoints are protected by admin-only middleware

### Custom Roles

Admins can create additional roles beyond the system defaults. These can be modified or deleted as needed.

## API Endpoints

All auth endpoints are available under `/api/auth/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Email/password sign-in |
| `/api/auth/sign-up/email` | POST | Email/password registration |
| `/api/auth/sign-out` | POST | Sign out |
| `/api/auth/two-factor/enable` | POST | Enable 2FA (returns QR code + backup codes) |
| `/api/auth/two-factor/verify-totp` | POST | Verify TOTP code |
| `/api/auth/two-factor/disable` | POST | Disable 2FA |
| `/api/auth/role-management/list` | GET | List all roles (admin only) |
| `/api/auth/role-management/create` | POST | Create a new role (admin only) |
| `/api/auth/role-management/update` | POST | Rename a role (admin only) |
| `/api/auth/role-management/delete` | POST | Delete a custom role (admin only) |
| `/api/auth/reference` | GET | Auto-generated OpenAPI documentation |

## Rate Limiting

Auth endpoints are rate-limited to prevent abuse. The default configuration:

- **Window:** 10 seconds
- **Max requests:** 100 per window

To customize, edit `src/lib/auth/rate-limit.ts`.

## Deployment to Cloudflare

### Build and deploy

```bash
bun run deploy
```

This will:
1. Build the Next.js app with OpenNext
2. Deploy to Cloudflare Workers

### Prerequisites for deployment

- A Cloudflare account with D1 enabled
- A Wrangler API token with D1 and Workers permissions
- The Turnstile site key and secret key from Cloudflare dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
