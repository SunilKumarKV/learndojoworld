# Local Development

## Install

pnpm install

## Start Docker

docker compose up -d

## Prisma

pnpm db:generate
pnpm db:migrate
pnpm db:seed

## Run

pnpm dev

## Quality

pnpm lint
pnpm typecheck
pnpm build
