# Repository Guidelines

## Project Structure & Module Organization
- `src/app` manages App Router routes, `src/components` houses shared UI, and logic helpers sit in `src/hooks`, `src/lib`, and `src/validations`.
- `prisma/schema.prisma` defines the data model; `migrations/` tracks SQL history and `logs/` stores audit snapshots and seeds.
- `scripts/` holds migration runners, charter audits, and seeding tasks; planning references stay in `docs/` and `specs/`.
- Assets live in `public/`, styling layers in `src/styles`, and Playwright fixtures in `tests/e2e`.

## Build, Test, and Development Commands
- `npm run dev` serves the app on `http://localhost:3000`; use `npm run dev:docker` when Postgres or ancillary services are required.
- `npm run build` then `npm run start` validates the production bundle and should pass before every release branch.
- `npm run lint` and `npm run typecheck` enforce `eslint-config-next` and strict TypeScript; run them before pushing.
- `npm test` kicks off the Jest suite (`tests/setup.ts`), while `npm run test:e2e` executes Playwright scenarios after `npm run playwright:install`.
- Charter migrations rely on `npm run db:migrate`, `npm run db:seed`, and `npm run audit:charter`.

## Coding Style & Naming Conventions
- Write TypeScript with 2-space indentation, no semicolons, and imports ordered as external packages, then `@/` aliases, then relative paths.
- Name React components and hooks in PascalCase, utilities in camelCase, and Prisma models in singular PascalCase.
- Keep Tailwind utility chains short; extract repeated patterns into `src/styles` or shared components.
- Guard `process.env` access with schema helpers from `src/lib` and prefer Zod validation at module boundaries.

## Testing Guidelines
- Mirror `src/` when placing Jest specs (`tests/services/settlement.test.ts` etc.) and reset seeded data in teardown helpers.
- Cover API handlers through integration tests in `tests/api` or `tests/app` with deterministic fixtures.
- Use Playwright for driver, charter, and settlement happy paths; reserve `--headed` runs for debugging and capture screenshots on failure.
- After updating Prisma models or seeds, run `npm run audit:charter` and archive relevant reports in `logs/`.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `docs:`) with imperative subjects under ~70 characters.
- Commit Prisma schema updates with regenerated client artifacts and adjusted seeds to keep migrations reproducible.
- PR descriptions should outline scope, link to the charter ticket, and summarize local verification (`npm run build`, `npm test`, key migrations).
- Attach UI screenshots or data snapshots when behavior changes, and document new env vars or compose overrides in the PR body.
