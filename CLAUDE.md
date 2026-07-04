# CLAUDE.md

We're building the app described in @SPEC.md. Read that file for general architectural tasks or to double-check the exact database structure, tech stack, or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Backend/API for **The Grid** — a group game where members predict the outcome of every NFL game for a whole season up front, then track their accuracy as games play out. This repo is backend-only; the client is a separate repository.

The project is under active development: the API layers (routes/controllers/db/services/middleware/validators), auth, and the pick/grid flow are implemented; scoring and comparison endpoints are still to come. **`SPEC.md` is the authoritative design** for the data model, business rules (lock-at-kickoff, the "at least one tie" grid rule, scoring, grid comparison), and the planned API surface. When in doubt, follow `SPEC.md` over the current code.

## Tech stack

Node.js (CommonJS), Express 5, Knex 3 query builder/migrations, SQLite via `better-sqlite3`. Validation with `joi`, security headers with `helmet`, `cors`, config via `dotenv`. Auth is `bcrypt` + `jsonwebtoken` (JWT in an HTTP-only cookie via `cookie-parser`), with `express-rate-limit` on auth routes. Tests use `jest` + `supertest`. Package manager is npm. (`pg` is in the lockfile but unused — the DB is SQLite.)

## Commands

`npm test` runs the `jest` suite (52 tests: supertest route tests + pure service unit tests). Note the route tests bind a port via supertest, so run them **outside the sandbox** (a sandbox blocks `listen` with `EPERM` — same class of issue as the `.env` gotcha below). Use the Knex CLI directly for DB work:

```bash
npm install                          # install deps

node scripts/fetch_espn_schedule.js  # refresh database/seeds/schedule_2026.json from ESPN
npx knex migrate:latest              # apply migrations   (also: migrate:rollback, migrate:status)
npx knex seed:run                    # seed conferences/divisions/teams/season/weeks/games

node server.js                       # start API on $PORT (default 4743)
npx nodemon server.js                # ...with auto-reload

npx eslint .                         # lint (eslint is installed but not yet configured)
```

## Architecture & layout

**Request flow:** `server.js` (boots the listener + a startup DB check) → `app.js` (Express app: middleware, mounts routes, error handler) → `api/routes` → `api/controllers` → `api/db` (Knex data-access modules, `*Db.js`) → Knex. Two supporting layers keep controllers thin: `api/services/` holds pure, DB-free business rules (season lock, grid completeness, pick validity/scoring, randomize — see `SPEC.md` §6) and `api/validators/` holds `joi` request schemas. `middleware/` (auth, season loading, lock enforcement, validation, error handling), `utils/` (jwt, password), and `tests/` are all implemented. The health check is `GET /` (in `app.js`); mounted route groups are `/api/auth`, `/api/seasons`, `/api/teams`.

**Database layer:** `knexfile.js` defines `development` / `staging` / `production` configs (all `better-sqlite3`); `afterCreate` enables WAL mode and foreign keys. `database/connection.js` selects the config by `NODE_ENV` and exports a singleton Knex instance — import this everywhere instead of constructing new connections. Migrations and seeds live under `database/`.

**Data model** (`database/migrations/20260515012938_init_tables.js`, reconciled with `SPEC.md`): `conferences → divisions → teams`, `seasons → weeks → games`, plus `users` and `picks` (plural table names, camelCase columns). There is no `outcome` table — game outcome lives on `games.result` and per-pick correctness on `picks.isCorrect`.

**ESPN integration:** `scripts/fetch_espn_schedule.js` pulls the 2026 regular-season schedule from ESPN's unofficial public API and writes `database/seeds/schedule_2026.json`, which `database/seeds/init_season.js` consumes.

## Environment variables

Loaded from `.env` (gitignored; no `.env.example` exists yet): `NODE_ENV`, `DEV_DATABASE` (dev SQLite file path), `DATABASE_URL` (prod), `PORT`, `CLIENT_ORIGIN`, `CLIENT_DEV_PORT`.

## Gotchas

- **Env vars come from `.env` (already set):** `DEV_DATABASE` and the other vars (above) are defined in the gitignored `.env` and read by `knexfile.js` (the `development` `afterCreate` logs the resolved path). If a run instead prints `injected env (0) from .env` and Knex reports a missing `connection.filename` / `Connection established undefined`, the shell couldn't read `.env` — typically a sandbox that denies reading `**/.env`, **not** a missing variable. Re-run outside the sandbox (or pass the var inline for that one command); don't "fix" `.env`.

- **Migration & seed are reconciled with `SPEC.md`:** `database/migrations/20260515012938_init_tables.js` uses plural table names with camelCase columns, drops the `outcome` table (game outcome lives on `games.result`, per-pick correctness on `picks.isCorrect`), and adds ESPN id columns, `lockAt`, etc. `database/seeds/init_season.js` matches this schema and seeds conferences/divisions/teams plus the 2026 season, 18 weeks, and ~272 games (setting `seasons.lockAt` to the first kickoff).
- **Seeds are destructive:** `init_season.js` deletes all rows from the tables it manages on every run.
