# The Grid — Technical Specification

## 1. Overview

The Grid is a web application where a small group of users each predict the outcome (win, loss, or tie) of every NFL game in a season, for a specific team in each matchup. Predictions lock at the start of the season and cannot be edited afterward. Each finished Grid must include at least one Tie prediction to be considered valid. Users can track their live accuracy throughout the season and compare their completed Grid against other users' Grids.

### 1.1 Goals
- Let users build a full-season slate of picks before kickoff.
- Enforce the "at least one Tie" rule before a Grid can be marked complete/submitted.
- Lock picks permanently once the season's first game kicks off.
- Score picks automatically as real games complete, using ESPN's public scoreboard data.
- Let users view live accuracy (correct / total decided) throughout the season.
- Let users compare their full Grid, game by game, against another user's Grid.

### 1.2 Non-goals (out of scope for v1)
- Payments, wagering, or prize tracking.
- Mobile native apps.
- Real-time push notifications (polling/manual refresh is acceptable for v1).
- Postseason: v1 covers the **regular season only** (no playoffs/Super Bowl). Only `seasonType = 2` weeks/games are imported. Postseason "pick as each round is revealed" is a possible v2 feature.

### 1.3 Scope (this repo)
This repository and spec cover **the backend** — a REST API, the data layer, and the ESPN integration. The **client is a separate repo** that consumes this API. Frontend details mentioned below (e.g. the §2 stack rows, client-side validation) are included for system context only; the backend is the authoritative tier and never relies on client behavior for correctness.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript — *client, separate repo; for reference* |
| Styling | Tailwind CSS — *client, separate repo; for reference* |
| Backend | Node.js (TypeScript) — REST API |
| Query builder | Knex.js |
| Database | SQLite via `better-sqlite3` |
| External data | ESPN's unofficial scoreboard API |
| Auth | Email + password registration, session-based auth |

### 2.1 Why this stack works here
- A single small SQLite file is appropriate for a small private group with low write volume (picks are entered once per user per season; scores update periodically).
- Knex.js gives schema migrations and a typed-ish query layer without a full ORM's overhead.
- ESPN's API is unauthenticated and free, which fits a hobby/small-group project, with the caveat in §8 about its unofficial status.

---

## 3. Core Domain Concepts

- **Season**: A single NFL year (e.g. 2026). Has a defined start date/time used as the pick lock cutoff.
- **Game**: One NFL matchup belonging to a season and week, with a home team, away team, kickoff time, and (eventually) a final result.
- **Pick**: A single user's prediction for a single game — which team wins, or a tie.
- **Grid**: The full collection of one user's picks for one season. A Grid is "complete" once every game in the season has a pick AND at least one pick is a Tie.
- **Lock event**: The moment the season's first game kicks off (`seasons.lockAt`); after this, no picks for that season can be created, edited, or deleted. This is the **only** freeze point — submitting a Grid (§6.2) is a validity checkpoint, not a freeze, so a user may keep editing a submitted Grid right up until lock.

### 3.1 Pick semantics (per your decisions)
- A pick targets a specific team to win, or marks the game a Tie. It is not "home/away" — it's tied to the actual `teamId` so the UI can be team-name-driven.
- A regular-season NFL tie is a real, valid final outcome (only occurs after one regulation OT period in the regular season; the postseason has no ties). Scoring must treat "Tie" picks as correct if and only if the final score is genuinely even.

---

## 4. User Roles & Auth

- **Member**: Default role. Can build their own Grid, view their own accuracy, and view other members' completed Grids (read-only comparison).
- **Admin**: Can manage seasons (trigger schedule import, set lock time) and trigger score refresh.

### 4.1 Auth flow
1. A user registers via the public registration route with username/email + password.
2. The password is hashed (bcrypt/argon2) and the account is created with the default `member` role.
3. Standard email+password login afterward, session stored via HTTP-only cookie (e.g. `express-session` or a JWT-in-cookie approach — recommend session for simplicity at this scale).

---

## 5. Data Model

Using `better-sqlite3` + Knex migrations. Core relational fields are normalized columns for query performance. Enumerated text columns (`users.role`, `seasons.status`, `games.status`, `games.result`, `picks.pickType`) are enforced with SQLite `CHECK` constraints in the migration rather than native enums.

### 5.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| email | text, unique | |
| username | text, unique | |
| passwordHash | text | bcrypt/argon2 |
| role | text | `member` \| `admin`; defaults to `member` |
| createdAt | datetime | |

### 5.2 `seasons`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| year | integer | e.g. 2026 |
| lockAt | datetime, nullable | kickoff of first game; picks lock at this instant. Null until the schedule import reveals the first kickoff |
| status | text | `upcoming` \| `picksOpen` \| `locked` \| `inProgress` \| `completed`; defaults to `upcoming` |
| createdAt | datetime | |

### 5.3 `conferences`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| espnConferenceId | text, unique, nullable | ESPN's conference/group identifier |
| name | text | e.g. "American Football Conference" |
| abbreviation | text | e.g. "AFC" |

### 5.4 `divisions`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| conferenceId | integer FK → conferences.id | |
| name | text | e.g. "North" |
| abbreviation | text, nullable | e.g. "AFC North" |

### 5.5 `teams`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| espnTeamId | text, unique, nullable | ESPN's team identifier; nullable until the ESPN import populates it |
| divisionId | integer FK → divisions.id | |
| name | text | e.g. "Patriots" |
| location | text, nullable | team city, e.g. "New England" |
| abbreviation | text | e.g. "NE" |
| logoUrl | text, nullable | |

### 5.6 `weeks`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| seasonId | integer FK → seasons.id | |
| weekNumber | integer | e.g. 1–18 for the regular season |
| seasonType | integer | 1=preseason, 2=regular, 3=postseason (ESPN convention); defaults to `2`; v1 imports regular season only (§9) |

### 5.7 `games`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| seasonId | integer FK | denormalized convenience; also reachable via `weeks.seasonId` |
| weekId | integer FK → weeks.id | the week (and thus season/seasonType) this game belongs to |
| espnEventId | text, unique, nullable | ESPN's event/game ID; nullable until the ESPN import populates it |
| homeTeamId | integer FK → teams.id | |
| awayTeamId | integer FK → teams.id | |
| startTimeEt | datetime, nullable | ET-local kickoff, for display |
| location | text, nullable | stadium/venue |
| status | text | `scheduled` \| `inProgress` \| `final`; defaults to `scheduled` |
| homeScore | integer, nullable | populated once final/live |
| awayScore | integer, nullable | |
| result | text, nullable | `homeWin` \| `awayWin` \| `tie`, derived once final |
| updatedAt | datetime | |

> **No separate `outcome` table.** A game's outcome is stored directly on `games.result` (`homeWin` \| `awayWin` \| `tie`), and per-pick correctness on `picks.isCorrect` (§5.8), both computed at score time (§6.3). The migration has been reconciled to this spec and the `outcome` table dropped.

### 5.8 `picks`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| userId | integer FK | |
| gameId | integer FK | |
| pickedTeamId | integer FK → teams.id, nullable | null when pick is "Tie" |
| pickType | text | `teamWin` \| `tie` (CHECK-constrained) |
| isCorrect | boolean, nullable | computed once `games.result` is known |
| createdAt | datetime | |
| updatedAt | datetime | |

Unique constraint on `(userId, gameId)` — one pick per user per game.

### 5.9 `grids` (optional convenience/derived table, or computed view)
Rather than a separate mutable table, a Grid is best modeled as a **derived view**: "all picks by user X for season Y," with completeness computed on read (see §6.2). This avoids data duplication and sync bugs. **The initial migration intentionally does not create this table** — a Grid is currently a derived view. If a persisted summary is later wanted for fast comparison/leaderboard pages, add:

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| userId | integer FK | |
| seasonId | integer FK | |
| isComplete | boolean | recomputed whenever picks change, pre-lock |
| submittedAt | datetime, nullable | timestamp Grid was marked complete |
| correctCount | integer | denormalized cache, recomputed on score updates |
| decidedCount | integer | denormalized cache (games with a final result so far) |

---

## 6. Key Business Rules

### 6.1 Pick lock enforcement
- `seasons.lockAt` is set to the kickoff time of the season's first game (derived from imported schedule).
- All pick create/update/delete endpoints check `now() < season.lockAt`; reject with `423 Locked` otherwise.
- Enforce this server-side only — never trust client-side timers for this rule. Client countdown is UX only.
- Recommend a scheduled job (or just a checked computed value) rather than a cron flip, since `now() < lockAt` is cheap to evaluate per-request.

### 6.2 "At least one Tie" validity rule
- A Grid is "complete" only if: (a) every game in the season has a pick from that user, and (b) at least one of those picks has `pickType = 'tie'`.
- The server-side check is **authoritative**: it runs before allowing `submittedAt` to be set, and before exposing the Grid in comparison views as "complete". The client (separate repo) may mirror this validation for UX (e.g. disabling a "Submit Grid" action with a clear message), but the backend never trusts it.

### 6.2.1 Partial picks & resume (incremental saving)
- Picks are persisted individually as they are made (`PUT /picks/:gameId`), so a user can pick some games, leave, and return later (pre-lock) to finish without losing progress. There is no separate "draft" state — every saved pick is real.
- `GET /picks/me` returns whatever picks currently exist for the user/season, so the client can rehydrate an in-progress Grid on load.

### 6.2.2 Submit is not a freeze
- `POST /grid/submit` validates completeness (full coverage + ≥1 Tie) and sets `submittedAt`; it does **not** lock the Grid.
- After submitting, the user may still edit any pick via `PUT /picks/:gameId` until `lockAt`. Editing a submitted Grid into an invalid state is allowed pre-lock; re-running submit re-validates. Only `lockAt` (§6.1) makes picks immutable.

### 6.2.3 Incomplete Grids at lock
- If a Grid is not complete (missing picks or no Tie) at `lockAt`, that user's Grid is **invalidated** for scoring and comparison purposes. Picks already made are frozen as-is, but the Grid does not appear as a valid/complete Grid in accuracy and comparison views.

### 6.3 Scoring picks
- A background/admin-triggered job polls ESPN's scoreboard endpoint per week, updates `games.status`/`homeScore`/`awayScore`/`result` once a game's status is final.
- When a game's `result` is set, recompute `isCorrect` for every pick on that game:
  - `pickType = 'teamWin'`: correct if `pickedTeamId` matches the winning team.
  - `pickType = 'tie'`: correct if `result = 'tie'`.
- Recompute each affected user's `correctCount`/`decidedCount` cache (or compute live via a SQL aggregate — fine at this scale either way; caching is an optimization, not a requirement).

### 6.4 Comparison view
- Given two users + a season, render a game-by-game table: each game, each user's pick, the actual result (if known), and per-user correctness so far.
- Only meaningful/fair to compare two Grids once both are locked-in (post `lockAt`), since picks aren't visible to other users pre-lock (see §7.2 privacy note).

### 6.5 Randomize Grid
- A "Randomize" action fills **every** game in the season with a random pick for the requesting user: each game gets a randomly chosen winner, then one randomly selected game is forced to `tie`. This guarantees the result satisfies the "at least one Tie" rule (§6.2) and is immediately valid/submittable.
- Randomize **overwrites** all of that user's existing picks for the season (it is a full regenerate, not a fill-the-blanks).
- Allowed only pre-lock; after `lockAt` it is rejected with `423 Locked` (§6.1). Enforced server-side; the randomization itself happens server-side so the result is authoritative.

---

## 7. API Surface (REST, indicative)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account (public registration) | public |
| POST | `/api/auth/login` | Log in | public |
| POST | `/api/auth/logout` | Log out | member |
| GET | `/api/seasons/:year` | Season metadata, lock time, status | member |
| GET | `/api/teams` | List all NFL teams (with division/conference) | member |
| POST | `/api/admin/seasons/:year/import-schedule` | Pull full schedule from ESPN, populate `games`/`teams` | admin |
| POST | `/api/admin/seasons/:year/refresh-scores` | Pull latest scores, update results, recompute correctness | admin |
| GET | `/api/seasons/:year/games` | List all games for the season | member |
| GET | `/api/seasons/:year/picks/me` | Get my current picks/Grid | member |
| PUT | `/api/seasons/:year/picks/:gameId` | Set/update a pick (rejected after lock) | member |
| POST | `/api/seasons/:year/picks/randomize` | Randomly fill the whole Grid, forcing one Tie (rejected after lock) | member |
| POST | `/api/seasons/:year/grid/submit` | Mark my Grid complete (validates Tie rule + full coverage) | member |
| GET | `/api/seasons/:year/grid/me/status` | My completion status + live accuracy | member |
| GET | `/api/seasons/:year/grid/:userId` | View another user's Grid (only once locked) | member |
| GET | `/api/seasons/:year/compare/:userIdA/:userIdB` | Side-by-side comparison | member |

### 7.1 Pick lock error shape
Returning a distinct status (`423 Locked`) for post-lock pick attempts lets the client (separate repo) show a clear "the season has started, picks are locked" message rather than a generic error.

### 7.2 Pre-lock privacy
Grids are **fully invisible** to other users before `lockAt` — not just the picks themselves but the fact that a user has any picks in progress. `GET /grid/:userId` and the comparison endpoints (§6.4) only expose another user's Grid once the season has locked. Pre-lock, these endpoints return nothing for users other than the requester.

---

## 8. ESPN Data Integration

### 8.1 Endpoints to use
- Schedule/scores by week: `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype={seasontype}&week={week}&dates={year}`
- Full-season event list (alternative, useful for bulk import): `GET https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/2/events?limit=1000`

Each `events[]` entry in the scoreboard response contains the game's ESPN event ID, competitors (home/away team refs with scores), status (`status.type.state`: `pre` / `in` / `post`), and date/kickoff time — this maps directly onto the `games` table fields in §5.7.

### 8.2 Important caveats
- **This is an unofficial, undocumented API.** ESPN can change or remove it without notice, and there's no published rate limit or SLA. Build the import/refresh layer behind an internal abstraction (e.g. a `ScoreProvider` interface) so swapping to a paid provider (SportRadar, etc.) later doesn't require touching the rest of the app.
- Recommend a scheduled refresh (e.g. hourly during game windows, or a manual admin "Refresh Now" button) rather than per-request live calls, to be a good citizen of an unofficial endpoint and to keep the app fast.
- The schedule for a season may not be fully available far in advance; plan to import/refresh the schedule once it's released (typically mid-May for the year's full season) and again right before lock to catch any rescheduled games (e.g. flex scheduling, weather moves).

---

## 9. Resolved Decisions & Open Questions

### 9.1 Resolved
1. **Incomplete Grids at lock** → Resolved: invalidate that user's Grid for scoring/comparison; picks already made are frozen but the Grid is not treated as valid/complete. See §6.2.3.
2. **Pre-lock visibility** → Resolved: Grids are fully invisible to other users pre-lock (including the existence of in-progress picks). See §7.2.
3. **Postseason scope** → Resolved: regular season only for v1 (`seasonType = 2`); no playoffs/Super Bowl. See §1.2.
4. **Scoring cadence** → Resolved: manual/admin-triggered score refresh is acceptable for v1 (`POST /api/admin/seasons/:year/refresh-scores`). A fully automatic scheduled job is a possible later enhancement. See §6.3, §8.2.

### 9.2 Still open
5. **Grid history across seasons**: do you want each season's Grid to be a clean slate with cross-season aggregate stats (e.g. "all-time accuracy"), or are seasons fully independent? This affects whether `picks`/`grids` need a season-spanning leaderboard table now or later. _To revisit later._

---

## 10. Suggested Build Order

1. DB schema + Knex migrations (§5).
2. ESPN import job (schedule → `teams`/`games`) behind a `ScoreProvider` abstraction (§8.2).
3. Auth + registration flow (§4).
4. Pick CRUD with lock enforcement (§6.1).
5. Grid completeness validation + submit flow (§6.2).
6. Score refresh job + correctness computation (§6.3).
7. My-accuracy endpoint (data for the dashboard view).
8. Grid-vs-Grid comparison endpoint (§6.4).
9. Admin tooling (manual schedule/score refresh triggers).

> This order covers the backend only. The client UI (dashboard, comparison, pick-entry screens) is built in the separate client repo against these endpoints and is out of scope here.