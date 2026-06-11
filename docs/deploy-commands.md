# Deployment Commands

These commands are for production setup preparation and provider configuration. Run production
migrations only against the intended production database.

## Install

```bash
pnpm install --frozen-lockfile
```

## Prisma Generate

```bash
pnpm exec prisma generate
```

Root script equivalent:

```bash
pnpm db:generate
```

## Prisma Migrate Deploy

Production and CI migration command:

```bash
pnpm exec prisma migrate deploy
```

Check migration state:

```bash
pnpm exec prisma migrate status
```

Do not run `pnpm db:migrate` or `prisma migrate dev` against production.

## Full Monorepo Build

```bash
pnpm build
```

## API Build

```bash
pnpm --filter @learndojoworld/api build
```

## API Start Command

```bash
pnpm --filter @learndojoworld/api start
```

Render build command:

```bash
pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm --filter @learndojoworld/api build
```

Render start command:

```bash
pnpm --filter @learndojoworld/api start
```

## Web Build Command

```bash
pnpm --filter @learndojoworld/web build
```

Vercel install command:

```bash
pnpm install --frozen-lockfile
```

Vercel build command:

```bash
pnpm --filter @learndojoworld/web build
```

## Quality Gate

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm e2e
```

## Health Checks

```bash
curl https://api.your-domain.com/api/v1/health
curl https://api.your-domain.com/api/v1/health/readiness
```
