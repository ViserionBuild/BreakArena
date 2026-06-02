# 🃏 Call Break Scoreboard — Backend API

Node.js + Express REST API backed by **Supabase (PostgreSQL)**.

---

## Project Structure

```
callbreak-backend/
├── app.js                      # Express app setup (middleware, routes)
├── server.js                   # HTTP server entry point
├── package.json
├── .env.example                # Copy to .env and fill in values
│
├── config/
│   └── constants.js            # App-wide constants (scoring rules, limits)
│
├── controllers/
│   ├── playerController.js
│   ├── matchController.js
│   ├── roundController.js
│   └── analyticsController.js
│
├── routes/
│   ├── players.js
│   ├── matches.js
│   ├── rounds.js
│   └── analytics.js
│
├── services/
│   ├── playerService.js        # DB logic for players
│   ├── matchService.js         # DB logic for matches
│   ├── roundService.js         # DB logic for rounds & scores
│   └── analyticsService.js    # Score history, rankings, leaderboard
│
├── middleware/
│   ├── auth.js                 # JWT auth (optional / guest-friendly)
│   ├── errorHandler.js         # Global error handler
│   └── validate.js             # express-validator helper
│
├── database/
│   └── supabase.js             # Supabase client (service role)
│
├── utils/
│   ├── response.js             # sendSuccess / sendError helpers
│   └── scoring.js              # calculateRoundScore, rankings, history
│
└── scripts/                    # ← SQL scripts (run in order in Supabase)
    ├── 00_extensions.sql       # Enable uuid-ossp, citext
    ├── 01_create_tables.sql    # All table definitions
    ├── 02_indexes.sql          # Performance indexes
    ├── 03_rls_policies.sql     # Supabase Row Level Security
    ├── 04_views.sql            # Analytical views
    ├── 05_seed_data.sql        # Dev / test data
    ├── 06_teardown.sql         # ⚠️ Drop everything (dev only)
    └── 07_useful_queries.sql   # Ad-hoc reference queries
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
```

### 3. Set up the database

Open the **Supabase SQL Editor** and run the scripts in order:

```
00_extensions.sql
01_create_tables.sql
02_indexes.sql
03_rls_policies.sql
04_views.sql
05_seed_data.sql   ← optional, dev only
```

### 4. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Players

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/players`            | List all players         |
| GET    | `/players/:id`        | Get player by ID         |
| GET    | `/players/:id/stats`  | Get player lifetime stats|
| POST   | `/players`            | Create a player          |
| PUT    | `/players/:id`        | Update a player          |
| DELETE | `/players/:id`        | Delete a player          |

**POST /players body:**
```json
{ "name": "Arjun", "avatar": "https://example.com/avatar.png" }
```

---

### Matches

| Method | Endpoint        | Description                    |
|--------|-----------------|--------------------------------|
| GET    | `/matches`      | List matches (paginated)       |
| GET    | `/matches/:id`  | Get match with rounds & scores |
| POST   | `/matches`      | Create a new match             |
| PUT    | `/matches/:id`  | Update status (pause/complete) |
| DELETE | `/matches/:id`  | Delete a match                 |

**POST /matches body:**
```json
{ "player_ids": ["uuid1", "uuid2", "uuid3", "uuid4"] }
```

**PUT /matches/:id body:**
```json
{ "status": "completed" }
```
When status is `"completed"`, the winner is automatically determined.

---

### Rounds

| Method | Endpoint       | Description                     |
|--------|----------------|---------------------------------|
| GET    | `/rounds`      | Get rounds for a match          |
| POST   | `/rounds`      | Add a round with all 4 scores   |
| PUT    | `/rounds/:id`  | Edit a round (undo / correct)   |
| DELETE | `/rounds/:id`  | Delete a round (undo)           |

**POST /rounds body:**
```json
{
  "match_id": "uuid",
  "player_scores": [
    { "user_id": "uuid1", "bid": 3, "actual_wins": 4 },
    { "user_id": "uuid2", "bid": 2, "actual_wins": 1 },
    { "user_id": "uuid3", "bid": 4, "actual_wins": 4 },
    { "user_id": "uuid4", "bid": 4, "actual_wins": 4 }
  ]
}
```

---

### Analytics

| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| GET    | `/analytics/leaderboard`          | Global player leaderboard     |
| GET    | `/analytics/matches/:matchId`     | Score + rank history for graph|

---

## Scoring Rules

| Outcome                | Score                            |
|------------------------|----------------------------------|
| `actual_wins >= bid`   | `+bid + (extra_wins × 0.1)`      |
| `actual_wins < bid`    | `-bid`                           |

Example: bid 3, wins 5 → `3 + 2×0.1 = 3.2`

---

## Deployment

| Layer    | Recommended Platform |
|----------|----------------------|
| Backend  | Railway / Render     |
| Database | Supabase Cloud       |
| Frontend | Vercel               |

Set the environment variables from `.env.example` in your hosting dashboard.

---

## Scripts Reference (SQL)

| File                    | Purpose                                   |
|-------------------------|-------------------------------------------|
| `00_extensions.sql`     | Enable uuid-ossp + citext                 |
| `01_create_tables.sql`  | Create all tables with constraints        |
| `02_indexes.sql`        | Add performance indexes                   |
| `03_rls_policies.sql`   | Supabase RLS (public guest access)        |
| `04_views.sql`          | Analytical SQL views                      |
| `05_seed_data.sql`      | Sample players / match / rounds (dev)     |
| `06_teardown.sql`       | Drop everything ⚠️ dev only               |
| `07_useful_queries.sql` | Ad-hoc queries for debugging / reporting  |
