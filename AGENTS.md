# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts App Router routes and page wiring; shared UI sits in `src/components`.
- Business logic helpers live in `src/hooks`, `src/lib`, and `src/validations`. Prisma models sit in `prisma/schema.prisma`, with SQL history under `migrations/` and audits in `logs/`.
- Assets go in `public/`, styling in `src/styles`, and Playwright fixtures in `tests/e2e`. Keep planning notes in `docs/` or `specs/`, and automated scripts in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server on `http://localhost:3000`; use `npm run dev:docker` when Postgres or ancillary services are required.
- `npm run build` followed by `npm run start` validates the production bundle before release.
- `npm run lint` and `npm run typecheck` enforce `eslint-config-next` and strict TypeScript.
- Run `npm test` for Jest suites (`tests/setup.ts`) and `npm run test:e2e` after `npm run playwright:install` for Playwright scenarios.
- Charter data tasks rely on `npm run db:migrate`, `npm run db:seed`, and `npm run audit:charter`.

## Coding Style & Naming Conventions
- Write TypeScript with 2-space indentation, no semicolons, and import order: external packages, `@/` aliases, relative paths.
- Name React components/hooks in PascalCase, utilities in camelCase, and Prisma models in singular PascalCase.
- Guard `process.env` reads with helpers in `src/lib` and lean on Zod validation at module boundaries; keep Tailwind chains short and factor patterns into `src/styles`.

## Testing Guidelines
- Mirror `src/` structure in `tests/`, reset seeded data via teardown helpers, and keep fixtures deterministic.
- Cover API handlers through `tests/api` or `tests/app`; capture Playwright screenshots on failure and reserve `--headed` for debugging.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`) with imperative subjects under ~70 chars.
- Include regenerated Prisma client artifacts when touching `prisma/schema.prisma` or seeds.
- PRs should outline scope, link the charter ticket, document local verification (`npm run build`, `npm test`), and attach UI or data snapshots when behavior changes.

## Security & Configuration Tips
- Store secrets via environment variables and validate them with existing schema utilities.
- After schema updates, run `npm run audit:charter` and archive reports in `logs/` for traceability.
