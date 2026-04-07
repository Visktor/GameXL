# GameXL

A game tracking platform — think MyAnimeList, but for games.

Built on [better-t-stack](https://better-t-stack.dev): a pnpm monorepo with React, Expo, Hono, tRPC, Prisma, and better-auth.

---

## Prerequisites

- [Node.js](https://nodejs.org) `^20.19 || ^22.12`
- [pnpm](https://pnpm.io) `>=10`
- [Docker](https://www.docker.com) (for the database)

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Create the following `.env` files by copying the examples below.

#### `apps/server/.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/GameXL

BETTER_AUTH_SECRET=        # generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

CORS_ORIGIN=http://localhost:5180
```

#### `apps/web/.env`

```env
VITE_SERVER_URL=http://localhost:3000
PORT=5180
```

#### `apps/native/.env`

```env
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
```

### 3. Start the database

```bash
pnpm db:start
```

This starts a PostgreSQL container on port **5433** via Docker Compose.

### 4. Run database migrations

```bash
pnpm db:migrate
```

This applies all Prisma migrations and creates the required tables, including the better-auth schema (users, sessions, accounts, verifications).

### 5. Start the apps

Run each in a separate terminal, or all together:

```bash
# All at once
pnpm dev

# Individually
pnpm dev:server   # Hono API on http://localhost:3000
pnpm dev:web      # React web app on http://localhost:5180
pnpm dev:native   # Expo app
```

---

## Project structure

```
apps/
  web/        React 19 SPA — Vite, React Router v7, TailwindCSS v4, tRPC, better-auth
  native/     Expo React Native app
  server/     Hono server — tRPC, better-auth, Node.js

packages/
  api/        tRPC router and context
  auth/       better-auth instance (Prisma adapter + Expo plugin)
  db/         Prisma schema and migrations (PostgreSQL)
  env/        Environment variable validation (@t3-oss/env-core)
  ui/         Shared UI components (shadcn/ui + TailwindCSS)
  config/     Shared tooling config (Ultracite / Biome)
```

---

## UI customization

Shared primitives live in `packages/ui`. To add more shadcn/ui components:

```bash
npx shadcn@latest add <component> -c packages/ui
```

Import them anywhere in the monorepo:

```tsx
import { Button } from "@GameXL/ui/components/button";
```

For app-specific components, run the shadcn CLI from the app directory instead.

---

## Useful commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:web` | Start web app only |
| `pnpm dev:server` | Start API server only |
| `pnpm dev:native` | Start Expo app only |
| `pnpm db:start` | Start PostgreSQL via Docker |
| `pnpm db:stop` | Stop the database container |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm build` | Build all apps |
| `pnpm check` | Lint and format check (Biome) |
| `pnpm fix` | Auto-fix lint and formatting |
| `pnpm typecheck` | Type-check all packages |
