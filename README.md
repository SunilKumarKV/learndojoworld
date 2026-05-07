# LearnDojoWorld Monorepo

This is the monorepo for LearnDojoWorld, a production-grade learning platform.

## Structure

- `apps/client`: Frontend React application
- `apps/server`: Backend Node.js API
- `packages/shared`: Shared utilities and types
- `docs/`: Documentation
- `.github/`: GitHub workflows and templates

## Tech Stack

### Frontend
- ReactJS with Vite
- Tailwind CSS
- React Router
- Axios
- Zustand
- React Hook Form + Zod

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT auth
- bcrypt
- Zod validation

## Scripts

- `pnpm dev`: Start development servers
- `pnpm build`: Build all apps
- `pnpm lint`: Run linting
- `pnpm format`: Format code
- `pnpm test`: Run tests

## Getting Started

1. Install pnpm: `npm install -g pnpm`
2. Install dependencies: `pnpm install`
3. Set up environment variables (see .env.example files)
4. Run development: `pnpm dev`