# GameXL — Product Requirements Document (V1)

---

## 1. Executive Summary

**Problem Statement:** Gamers lack a dedicated platform to track their gaming history, discover new releases, and manage their backlogs with the depth that platforms like MyAnimeList offer for anime.

**Proposed Solution:** GameXL is a web platform that lets users track games by status, score and review completed titles, and discover new releases — powered entirely by the IGDB API.

**Success Criteria:**
- User can add a game to their tracked list in ≤ 3 clicks from the home screen
- Releases screen renders within 1 second (IGDB response proxied server-side)
- Game search returns results within 500ms
- Auth (signup + Google OAuth) completes in under 5 seconds
- 0 duplicate games shown in any listing view

---

## 2. User Experience & Functionality

### User Personas

**Casual Gamer — "Alex"**
- Plays 2–3 games per month
- Wants to track games finished and find what to play next
- Not interested in social features — just personal organization

**Enthusiast — "Jordan"**
- Follows release schedules closely
- Rates and reviews games after completion
- Checks what's launching this week/month regularly

---

### User Stories & Acceptance Criteria

#### Releases Screen
> As a guest, I want to see today's game releases so I can discover new titles without signing up.

- Accessible without authentication
- Time span tabs: **Today / This Week / This Month / This Year**
- Each card shows: title, cover art, genre(s), platform(s), IGDB score + GameXL avg score (shown separately)
- Hovering a card (web) plays a trailer video in a popup
- Mobile tap-to-preview is a v2 feature (ships with native app)
- Infinite scroll pagination

---

#### Game Detail Page
> As a user, I want to view a game's full details so I can decide whether to track it.

- Page shows: title, cover, description, release date, platforms, genres, trailer, IGDB score + GameXL avg score (separately), reviews list
- Tracking widget (status selector + score) visible directly on the page

---

#### Game Tracking
> As an authenticated user, I want to assign a status to a game so I can organize my library.

- Available statuses: **Playing / Completed / Dropped / Want / On Hold**
- Status can be changed at any time
- Score (1–5 half-stars, stored as decimal 1.0–5.0, step 0.5) only unlocked when status is **Completed** or **Dropped**
- If status is changed back from Completed/Dropped, existing score and review are **kept as-is** (not deleted)
- Review only writable when status is **Completed** or **Dropped**
- One review per user per game; editable after creation

---

#### My Games
> As an authenticated user, I want to view and manage my tracked games.

- Default view: **grid of cards**; user can toggle to **list view**
- Filterable by: **status**, **genre**, **platform**
- Infinite scroll pagination
- User can manually trigger a data refresh on any individual game

---

#### Search
> As a user, I want to search for a game by name.

- Name-only search (no filters in v1)
- Results returned within 500ms
- Available to guests (view only)

---

#### Authentication
> As a new user, I want to sign up with email or Google so I can save my data.

- Supported: email/password signup, Google OAuth
- Guest browsing allowed (view only — no write actions)
- On signup, local guest session data is migrated to the new account

---

#### User Profile
> As an authenticated user, I want to control my profile visibility.

- Profile is **private by default**
- User can selectively make sections public
- Publicly visible profile shows only what the user has configured

---

### Non-Goals (V1)

The following are explicitly out of scope for v1:

- Native mobile app
- User-defined custom lists
- Platform sync (Steam, PlayStation, Xbox)
- Social activity feed / follow system
- Community forums or game discussions
- Game recommendation engine
- Notifications (new releases, follows)
- Stats & yearly recaps
- Search filters (genre, platform, year)
- Review likes / upvotes
- Steam OAuth login

---

## 3. Technical Specifications

### Architecture Overview

```
Browser (React Router v7 + TanStack Query)
        ↕  tRPC
Express Server (Node.js)
        ↕  better-auth      — session management
        ↕  IGDB API         — Twitch OAuth token (server-side only)
        ↕  Redis            — IGDB response cache
        ↕  Prisma ORM
PostgreSQL
```

**Browsing flow (releases, search, game detail):**
1. Client triggers tRPC query
2. Server calls IGDB with server-side Twitch token
3. Results returned live — nothing persisted

**Write flow (add to list, score, review):**
1. Client triggers tRPC mutation (auth required)
2. Server upserts `game` snapshot to DB if not yet stored
3. Server writes `user_game` or `review` record

---

### Database Schema

> Naming: `snake_case` for DB field names and table names. `camelCase` fields and `PascalCase` model names in the API layer.

| Model | Key Fields |
|---|---|
| `user` | Managed by better-auth (`id`, `name`, `email`, `image`, …) |
| `game` | `id`, `external_api_key` (IGDB ID), `title`, `cover_url`, `description`, `release_date`, `trailer_url`, `created_at` |
| `genre` | `id`, `name` — many-to-many with `game` |
| `platform` | `id`, `name` — many-to-many with `game` |
| `user_game` | `id`, `user_id`, `game_id`, `status` (enum), `score` (Decimal, nullable), `created_at`, `updated_at` |
| `review` | `id`, `user_id`, `game_id`, `content`, `created_at`, `updated_at` — unique(`user_id`, `game_id`) |

**Status enum values:** `PLAYING` · `COMPLETED` · `DROPPED` · `WANT` · `ON_HOLD`

**Score:** Decimal, range 1.0–5.0, step 0.5. Null when status is not Completed/Dropped.

---

### Integration Points

| Service | Purpose | Auth |
|---|---|---|
| IGDB | All game data (releases, search, detail, trailers) | Twitch Client Credentials (server-side) |
| Redis | IGDB response cache (mitigate rate limits) | Connection string |
| Google OAuth | User social login | better-auth social plugin |
| PostgreSQL | All user data persistence | Prisma connection string |

---

### Security & Privacy

- IGDB Twitch token stored and used server-side only — never sent to the client
- All tRPC write procedures protected by session middleware
- User profiles private by default
- better-auth session cookies: `httpOnly`, `secure`, `sameSite: none`
- Guest data stored in browser local storage; cleared after successful account migration

---

## 4. V1 Routes

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Releases screen |
| `/games/:id` | No | Game detail page |
| `/search` | No | Search results |
| `/my-games` | Yes | User's tracked games |
| `/profile` | Yes | Own profile & settings |
| `/:userslug` | No | Public profile (if user has made it public) |
| `/login` | No | Login page |
| `/signup` | No | Signup page |

---

## 5. Risks & Roadmap

### Phased Rollout

| Phase | Scope |
|---|---|
| **V1** | Releases screen, game tracking, scoring, reviews, search, My Games, auth (email + Google) |
| **V2** | Steam OAuth, custom user lists, review likes/upvotes, native mobile app, platform sync |
| **V3** | Social activity feed, community forums, recommendations, notifications, stats/recaps |

### Technical Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| IGDB rate limits on high traffic | Medium | Redis cache for repeated identical IGDB queries (officially part of v1 stack) |
| IGDB missing trailers or cover art | High | Graceful fallback UI (placeholder image, hide trailer widget) |
| IGDB game editions (GOTY vs base) appear as separate entries | Low | Intentional — follow IGDB's structure, treat each edition as its own game |
| Guest → account data migration failure | Low | Atomic DB transaction on signup; rollback on failure; clear localStorage only after success |
| Score/status gating UX confusion | Medium | Disabled-state UI with tooltip explaining the Completed/Dropped requirement |
| IGDB API downtime | Low | Error boundary with user-facing message; no stale fallback in v1 |
