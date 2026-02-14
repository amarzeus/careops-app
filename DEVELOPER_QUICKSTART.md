# Developer Quick Start

## Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)
- npm or yarn

## Setup

```bash
# 1. Clone and navigate to project
cd careops-app

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/careops"

# 5. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 6. Start development server
npm run dev
```

## Common Tasks

### Create a new API endpoint

```bash
# API routes live in src/app/api/
# Example: src/app/api/resources/route.ts
```

### Add a database model

1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Access via `import { prisma } from "@/lib/prisma"`

### Run tests

```bash
# Unit tests
npx vitest run

# E2E tests (requires dev server on port 5000)
npx playwright test

# Single test file
npx playwright test tests/e2e/smoke.spec.ts
```

### Check for type errors

```bash
npx tsc --noEmit
```

### Lint code

```bash
npm run lint
# or with auto-fix
npm run lint:fix
```

## Project Conventions

### File Naming

- API routes: `route.ts` (singular)
- Components: PascalCase (e.g., `BookingCard.tsx`)
- Utilities: kebab-case (e.g., `date-utils.ts`)
- Tests: `*.test.ts` (unit) or `*.spec.ts` (E2E)

### Code Style

- Use TypeScript for all new code
- Use Zod for request validation
- Use Prisma for database access
- Follow existing patterns in each module

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push -u origin feature/my-feature
```

## Troubleshooting

### Port already in use

```bash
# Kill process on port 5000
fuser -k 5000/tcp
```

### Database issues

```bash
# Reset database
npx prisma db push --force-reset

# View database with Prisma Studio
npx prisma studio
```

### Build issues

```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx tsc --noEmit` | Type check |
| `npm run lint` | Run ESLint |
| `npx vitest run` | Run unit tests |
| `npx playwright test` | Run E2E tests |
