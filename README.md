# E-commerce Order Processing System

Backend API for a product catalog, JWT authentication, and orders with line items. Built with [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/) (SQLite via `better-sqlite3`), request validation, OpenAPI (Swagger), scheduled order status updates, and per-IP rate limiting.

## Table of contents

- [At a glance](#at-a-glance)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Database](#database)
  - [Database schema (tables)](#database-schema-tables)
  - [Enums](#enums)
  - [Order status flow](#order-status-flow)
  - [Entity-relationship diagram (ERD)](#entity-relationship-diagram-erd)
- [API and Swagger](#api-and-swagger)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Testing](#testing)
- [License](#license)

## At a glance

- **Runtime:** Node.js 20+ ([`package.json`](package.json) `engines`)
- **Base URL:** `http://localhost:3000` (override with `PORT` in `.env`)
- **Swagger UI:** `http://localhost:3000/api`
- **Database:** SQLite file from `DATABASE_URL` (e.g. `file:./dev.db` at the project root)

## Features

- **Authentication** — Sign-up and login with bcrypt-hashed passwords; JWT access tokens.
- **Users** — Roles `USER` (default) and `ADMIN` (seeded for local admin workflows).
- **Products** — SKU, optional description, soft-disable via `isActive`; **admin-only** create, update, delete; authenticated list (paginated) and detail.
- **Orders** — Each order stores the owning **`userId`** (FK to `User`). **Users** list and fetch **their** orders only; **admins** see all. Create references **active** products by numeric `productId`. **Fulfillment status** follows a strict linear chain: `PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED` — admins may advance **one step at a time** via `PATCH /orders/:id/status` (no skips, no backward moves); **cancellation** only from `PENDING` via `PATCH /orders/:id/cancel` (**users** own orders; **admins** any `PENDING` order).
- **Background job** — Cron moves `PENDING` → `PROCESSING` every five minutes (the same first step an admin could apply manually).
- **Rate limiting** — In-memory per-IP throttling; stricter limits on auth routes; configurable via environment variables.

## Tech stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js 20+ |
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| Database | SQLite (`better-sqlite3` + `@prisma/adapter-better-sqlite3`) |
| Validation | class-validator / class-transformer |
| API docs | @nestjs/swagger (UI at `/api`) |
| Auth | @nestjs/jwt, Passport JWT, bcrypt |
| Scheduling | @nestjs/schedule |
| Rate limiting | @nestjs/throttler |

## Prerequisites

- **Node.js** 20 or newer
- **npm**

## Quick start

```bash
git clone <repository-url>
cd <repo-folder>
cp .env.example .env
# Set JWT_SECRET in .env (required). Adjust DATABASE_URL if needed.
npm install
```

`npm install` runs `postinstall` → `prisma generate`.

Apply the schema to your local database:

```bash
# Production-style / CI: apply existing migrations
npx prisma migrate deploy

# Local development: create/apply migrations interactively
npm run prisma:migrate
```

Optional sample data and admin user:

```bash
npm run db:seed
```

Start the API:

```bash
npm run start:dev
```

Open [http://localhost:3000/api](http://localhost:3000/api) for Swagger.

## Configuration

Copy [`.env.example`](.env.example) to `.env` and adjust values.

The Prisma CLI reads `DATABASE_URL` from [`prisma.config.ts`](prisma.config.ts). The Nest application uses the same variable in [`src/prisma/prisma.service.ts`](src/prisma/prisma.service.ts).

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite connection string (e.g. `file:./dev.db` relative to the project root) |
| `JWT_SECRET` | Secret for signing and verifying JWTs (use a long random value in production) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `JWT_EXPIRES_IN` | `1d` | Access token lifetime (e.g. `12h`, `3600s`) |
| `BCRYPT_SALT_ROUNDS` | `12` | Bcrypt cost (allowed range 4–31) |
| `THROTTLE_ENABLED` | enabled | Set to `false` to disable rate limiting (e.g. automated tests) |
| `THROTTLE_TTL_MS` | `60000` | Default rate-limit window (ms) |
| `THROTTLE_LIMIT` | `100` | Max requests per IP per window (most routes) |
| `THROTTLE_AUTH_TTL_MS` | `60000` | Window for `POST /auth/sign-up` and `POST /auth/login` |
| `THROTTLE_AUTH_LIMIT` | `10` | Max auth requests per IP per window |

## Database

| Task | Command |
|------|---------|
| Migrations (deploy) | `npx prisma migrate deploy` |
| Migrations (dev) | `npm run prisma:migrate` |
| Prisma Client | `npm run prisma:generate` (also on `npm install` via `postinstall`) |
| Seed | `npm run db:seed` |

> **Development only — seeded admin**  
> Email: `admin@example.com` — Password: `Admin@123` (matches [`prisma/seed.ts`](prisma/seed.ts))  
> Use **Authorize** in Swagger for admin-only product routes. Replace or remove in production.

The schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma). The database is **SQLite**; the app uses **Prisma ORM 7** with the better-sqlite3 adapter ([`src/prisma/prisma.service.ts`](src/prisma/prisma.service.ts)).

### Database schema (tables)

#### `User`

| Column | Type | Constraints / notes |
|--------|------|---------------------|
| `id` | `Int` | Primary key, autoincrement |
| `name` | `String` | Required |
| `email` | `String` | Required, **unique** |
| `passwordHash` | `String` | Required; bcrypt hash |
| `role` | `UserRole` | Default `USER`; see [Enums](#enums) |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

Indexes: `email`, `role`. Relation: one-to-many **`orders`** → [`Order`](#order).

#### `Product`

| Column | Type | Constraints / notes |
|--------|------|---------------------|
| `id` | `Int` | Primary key, autoincrement |
| `sku` | `String` | Required, **unique** |
| `name` | `String` | Required |
| `description` | `String?` | Optional |
| `isActive` | `Boolean` | Default `true` |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

Relation: one-to-many **`orderItems`** → [`OrderItem`](#orderitem).

#### `Order`

| Column | Type | Constraints / notes |
|--------|------|---------------------|
| `id` | `Int` | Primary key, autoincrement |
| `userId` | `Int` | Required, **FK** → `User.id` (on delete **Restrict**, on update **Cascade**) |
| `status` | `OrderStatus` | Default `PENDING`; see [Enums](#enums) and [Order status flow](#order-status-flow) |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

Index: `userId`. Relation: many-to-one **`user`** → `User`; one-to-many **`items`** → [`OrderItem`](#orderitem).

#### `OrderItem`

| Column | Type | Constraints / notes |
|--------|------|---------------------|
| `id` | `Int` | Primary key, autoincrement |
| `quantity` | `Int` | Required; must be `> 0` (CHECK in DB migration) |
| `orderId` | `Int` | Required, **FK** → `Order.id` (on delete **Cascade**) |
| `productId` | `Int` | Required, **FK** → `Product.id` |

Indexes: `orderId`, `productId`. Relations: **`order`** → `Order`, **`product`** → `Product`.

### Enums

| Enum | Values | Where used | Default |
|------|--------|------------|---------|
| `UserRole` | `ADMIN`, `USER` | `User.role` | `USER` |
| `OrderStatus` | `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` | `Order.status` | `PENDING` |

Allowed **transitions** for `Order.status` are described in [Order status flow](#order-status-flow).

### Order status flow

Fulfillment is a **strict linear** chain (no skips, no backward moves via `PATCH /orders/:id/status`). **Cancellation** is a separate path from `PENDING` only. Admin transition rules are enforced in [`src/order/order-status-transitions.ts`](src/order/order-status-transitions.ts).

```mermaid
stateDiagram-v2
  direction LR
  [*] --> PENDING
  PENDING --> PROCESSING
  PROCESSING --> SHIPPED
  SHIPPED --> DELIVERED
  PENDING --> CANCELLED
  DELIVERED --> [*]
  CANCELLED --> [*]
```

| Mechanism | Who | Transition | Conditions / notes |
|-----------|-----|------------|----------------------|
| `PATCH /orders/:id/status` | `ADMIN` JWT | One step forward on the fulfillment chain only | Target must be the **next** status: `PENDING`→`PROCESSING`→`SHIPPED`→`DELIVERED`. **Not allowed:** skip, backward, same status, body `CANCELLED`, or any change when current is `DELIVERED` or `CANCELLED`. |
| `PATCH /orders/:id/cancel` | Order owner (`USER`) or `ADMIN` | `PENDING` → `CANCELLED` | Only while `PENDING`. Users may cancel **own** orders; admins may cancel any `PENDING` order. |
| Cron ([`OrderStatusSchedulerService`](src/order/order-status-scheduler.service.ts)) | System | `PENDING` → `PROCESSING` | Scheduled job; same first hop as a manual admin status update. |

### Entity-relationship diagram (ERD)

```mermaid
erDiagram
  User ||--o{ Order : places
  Order ||--|{ OrderItem : contains
  Product ||--o{ OrderItem : references
  User {
    int id
    string email
    string name
    string passwordHash
    string role
    datetime createdAt
    datetime updatedAt
  }
  Product {
    int id
    string sku
    string name
    string description
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }
  Order {
    int id
    int userId
    string status
    datetime createdAt
    datetime updatedAt
  }
  OrderItem {
    int id
    int quantity
    int orderId
    int productId
  }
```

**Note:** Review migration history before production deploys if you rely on preserving existing data; treat production migrations as a separate, reviewed process.

## API and Swagger

Interactive OpenAPI UI: **`/api`**

Use **Authentication** (`POST /auth/sign-up`, `POST /auth/login`) to obtain `access_token`, then **Authorize** with `Bearer <token>` for protected routes.

| Area | Auth | Summary |
|------|------|---------|
| `GET /` | Public | Health / hello (plain text); excluded from rate limiting |
| `POST /auth/sign-up`, `POST /auth/login` | Public | Register and obtain JWT; stricter rate limits |
| `/products` | JWT | List (paginated, active products) and get by id; **POST/PATCH/DELETE** require **ADMIN** |
| `/orders` | JWT | List/get **own** orders (`USER`) or **all** (`ADMIN`); create sets owner from JWT; cancel `PENDING` — **own** orders for users, any for admins; line items use **`productId`** from the products API |
| `PATCH /orders/:id/status` | JWT **+ ADMIN** | Advance status **one step** forward on the fulfillment chain (non-admins receive 403) |

**Pagination:** List endpoints return `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }` where applicable.

### Reviewer checklist

1. Open Swagger at `/api`.
2. Call `POST /auth/sign-up` or `POST /auth/login` and copy `access_token`.
3. Click **Authorize** and paste `Bearer <token>` (or the token alone, depending on UI).
4. `GET /products?page=1&limit=20` and note numeric `id` values.
5. `POST /orders` with body `{ "items": [ { "productId": <id>, "quantity": 1 } ] }`.
6. To try **status updates**, sign in as the seeded admin (`admin@example.com`) and call `PATCH /orders/:id/status` with the **next** status only (e.g. `PENDING` → `PROCESSING`); skipping or going backward returns 400. A non-admin JWT returns 403.

## Project structure

```
src/
├── app.module.ts          # Root module (schedule, throttler, feature modules)
├── app.controller.ts      # GET / health (skip throttle)
├── main.ts                # Bootstrap, Swagger, global ValidationPipe
├── auth/                  # Sign-up, login, JWT strategy, guards, roles
├── user/                  # User service and DTOs
├── product/               # Product catalog API
├── order/                 # Orders, DTOs, status scheduler (cron)
├── prisma/                # PrismaService (SQLite adapter)
├── common/                # Pagination helpers and shared DTOs
└── config/                # Throttle options for ThrottlerModule
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## Architecture

The app uses feature modules (`auth`, `user`, `product`, `order`) plus `prisma` and shared helpers. [`main.ts`](src/main.ts) registers a global `ValidationPipe` (whitelist, forbid unknown properties, transform). A global `ThrottlerGuard` applies default limits; [`AppController`](src/app.controller.ts) uses `@SkipThrottle()` for `GET /`. Protected routes use `JwtAuthGuard`; product mutations and `PATCH /orders/:id/status` add `AdminGuard`. Order list/get are scoped by `userId` for non-admins. Admin status updates are validated in [`order-status-transitions.ts`](src/order/order-status-transitions.ts) (strict linear transitions). `OrderStatusSchedulerService` runs on a cron schedule and moves `PENDING` orders to `PROCESSING` via `updateMany`.

Rate limiting is in-memory per process; for multiple instances behind a load balancer, consider a shared store (e.g. Redis) in production.

```mermaid
flowchart LR
  AppModule --> AuthModule
  AppModule --> UserModule
  AppModule --> ProductModule
  AppModule --> OrderModule
  AppModule --> PrismaModule
  AuthModule --> UserModule
  ProductModule --> PrismaModule
  OrderModule --> PrismaModule
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run start` | Start once |
| `npm run start:dev` | Start with watch |
| `npm run start:debug` | Start with debug + watch |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app (`node dist/src/main.js`) |
| `npm run prisma:migrate` | Prisma migrate (development) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run db:seed` | Run seed |
| `npm run test` | Unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests with coverage |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (`src/`) |

## Testing

```bash
npm run test
npm run test:cov
```

Unit tests live under `src/**/*.spec.ts` (Jest `rootDir` is `src`). Set `THROTTLE_ENABLED=false` in the environment when testing if you need rate limiting disabled.


