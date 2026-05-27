# Setup

## Requirements

- Node.js 20 or newer
- PNPM 9 or newer
- Docker Desktop or another Docker Compose-compatible runtime
- PostgreSQL 16
- Redis 7

## Install

```bash
pnpm install
```

## Environment

Create a local environment file:

```bash
cp .env.example .env
```

The default values in `.env.example` match the local Docker services.

## Local Infrastructure

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Check service health:

```bash
docker compose ps
```

Stop local infrastructure:

```bash
docker compose down
```

## Verify

```bash
pnpm typecheck
pnpm build
pnpm lint
```

## Database

Generate Prisma Client after installing dependencies or changing the Prisma schema:

```bash
pnpm db:generate
```

Create and apply the first local migration:

```bash
pnpm db:migrate -- --name init_foundation
```

Run the seed entrypoint:

```bash
pnpm db:seed
```

The current seed intentionally does not create product data. It only verifies that the Prisma seed entrypoint is ready.
