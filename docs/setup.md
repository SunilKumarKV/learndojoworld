# Setup

## Requirements

- Node.js 20 or newer
- PNPM 9 or newer
- PostgreSQL
- Redis

## Install

```bash
pnpm install
```

## Environment

Create a local environment file:

```bash
cp .env.example .env
```

Update `DATABASE_URL` and `REDIS_URL` when local services are available.

## Verify

```bash
pnpm typecheck
pnpm build
pnpm lint
```

## Database

These commands are wired at the repository root and will become active when the Prisma schema is introduced:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```
