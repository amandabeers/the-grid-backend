# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Backend/API for **The Grid** — an invite-only group game where members predict the outcome of every NFL game for a whole season up front, then track their accuracy as games play out. This repo is backend-only; the client is a separate repository.

The project is early-stage scaffolding. **`SPEC.md` is the authoritative design** for the data model, business rules (lock-at-kickoff, the "at least one tie" grid rule, scoring, grid comparison), and the planned API surface. When in doubt, follow `SPEC.md` over the current code.

## Tech stack

Node.js (CommonJS), Express 5, Knex 3 query builder/migrations, SQLite via `better-sqlite3`. Validation with `joi`, security headers with `helmet`, `cors`, config via `dotenv`. Package manager is npm. (`pg` is in the lockfile but unused — the DB is SQLite.)

## Commands

There are no useful npm scripts yet (`npm test` is a placeholder that fails). Use the Knex CLI directly:

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

**Request flow (intended):** `server.js` → `api/routes` → `api/controllers` → `api/models` → Knex. Note that `api/{routes,controllers,models}`, `middleware/`, `utils/`, and `tests/` are **empty scaffold directories** — they mark the target structure from `SPEC.md` and are not implemented yet. `server.js` is currently a ~50-line Express skeleton with two test endpoints (`GET /`, `GET /conferences`).

**Database layer:** `knexfile.js` defines `development` / `staging` / `production` configs (all `better-sqlite3`); `afterCreate` enables WAL mode and foreign keys. `database/connection.js` selects the config by `NODE_ENV` and exports a singleton Knex instance — import this everywhere instead of constructing new connections. Migrations and seeds live under `database/`.

**Data model** (`database/migrations/20260515012938_init_tables.js`, reconciled with `SPEC.md`): `conferences → divisions → teams`, `seasons → weeks → games`, plus `users`, `picks`, and `invites` (all plural snake_case). There is no `outcome` table — game outcome lives on `games.result` and per-pick correctness on `picks.is_correct`.

**ESPN integration:** `scripts/fetch_espn_schedule.js` pulls the 2026 regular-season schedule from ESPN's unofficial public API and writes `database/seeds/schedule_2026.json`, which `database/seeds/init_season.js` consumes.

## Environment variables

Loaded from `.env` (gitignored; no `.env.example` exists yet): `NODE_ENV`, `DEV_DATABASE` (dev SQLite file path), `DATABASE_URL` (prod), `PORT`, `CLIENT_ORIGIN`, `CLIENT_DEV_PORT`.

## Gotchas

- **Env vars come from `.env` (already set):** `DEV_DATABASE` and the other vars (above) are defined in the gitignored `.env` and read by `knexfile.js` (the `development` `afterCreate` logs the resolved path). If a run instead prints `injected env (0) from .env` and Knex reports a missing `connection.filename` / `Connection established undefined`, the shell couldn't read `.env` — typically a sandbox that denies reading `**/.env`, **not** a missing variable. Re-run outside the sandbox (or pass the var inline for that one command); don't "fix" `.env`.

- **Migration & seed are reconciled with `SPEC.md`:** `database/migrations/20260515012938_init_tables.js` uses plural snake_case tables, drops the `outcome` table (game outcome lives on `games.result`, per-pick correctness on `picks.is_correct`), and adds `invites`, ESPN id columns, `lock_at`, etc. `database/seeds/init_season.js` matches this schema and seeds conferences/divisions/teams plus the 2026 season, 18 weeks, and ~272 games (setting `seasons.lock_at` to the first kickoff).
- **Seeds are destructive:** `init_season.js` deletes all rows from the tables it manages on every run.
- `package.json` `main` is `index.js`, but the real entry point is `server.js`.
- `server.js` `checkConnection()` reads `confs.rows` (a Postgres result shape) from a `better-sqlite3` query — a leftover that does not work with the SQLite driver.
