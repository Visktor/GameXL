# Product Scope — Grill Session

---

## Core Purpose


1. Q: Core action — track, discover, or both?
   R: Both equally. All features in scope: tracking, discovery, social, reviews/ratings, custom lists, platform sync, stats, community forums, recommendations, notifications.
   -> A: Q: Primary entry point for new user?
         R: Screen showing games launching today (discovery-first, release-focused).
         -> A: Q: Is it only today, or does it include other time spans?
               R: User can switch between time span views via buttons.
               -> A: Q: Available time spans?
                     R: Today / This Week / This Month / This Year.
               -> B: Q: What does a game card show?
                     R: Title, cover art, genre, platform, avg score. Hover triggers trailer video popup.
                     -> A: Q: Mobile equivalent for hover trailer?
                           R: Tap to preview — but mobile is v2, so this ships with the native app.

## Auth & Access

4. Q: Account required to use the app?
   R: No — guest mode allowed, data stored in browser. On signup, guest data migrated to account for cross-session persistence.
   -> A: Q: What can guests do?
         R: View only. All write actions (lists, reviews, ratings, etc.) require an account.

5. Q: Game tracking statuses?
   R: Playing / Completed / Dropped / Want / On Hold.
   -> A: Q: When can a user score a game?
         R: Only when status is Completed or Dropped.
         -> A: Q: Scoring scale?
               R: 1–5 stars visually, stored as decimal 1.0–5.0, step 0.5. No separate internal 1–10 mapping.

6. Q: Reviews tied to score or standalone?
   R: Standalone — review and score are independent actions. Both gated by Completed/Dropped status.

7. Q: Custom lists — predefined or user-defined?
   R: User-defined lists (e.g. "Best RPGs", "Backlog").
   -> A: Q: Can a game appear in multiple lists?
         R: Yes.
   -> B: Q: Lists visibility?
         R: Can be made public (shown on profile) or kept private.

## User Profile

12. Q: What does the public profile show?
    R: Whatever the user configures as public — fully user-controlled visibility.
    -> A: Q: Default profile visibility?
          R: Private.

13. Q: Auth solution?
    R: Already set up — better-auth with email/password enabled, Prisma/PostgreSQL adapter, Expo plugin for native. No OAuth providers configured yet.
    -> A: Q: OAuth providers?
          R: Google in v1. Steam in v2.

14. Q: Releases screen available to guests?
    R: Yes — view only, consistent with guest rules.

15. Q: Existing DB schema?
    R: PostgreSQL via Prisma. Auth models only: User, Session, Account, Verification. No game-related models yet.
    -> A: Q: Cache game data locally or always fetch live?
          R: Hybrid — browse/search hits IGDB live. Game snapshot saved to DB on user interaction only. User can manually refresh their saved game. No automatic daily sync.

16. Q: Existing server setup?
    R: Express + tRPC + better-auth. API package has only healthCheck and privateData procedures. Stack: Express/Node, tRPC for API, PostgreSQL/Prisma for DB.

17. Q: Web app stack?
    R: React Router v7 (file-based routing), React 19, Tailwind v4, TanStack Query, tRPC client, better-auth, Lucide icons, Sonner toasts, next-themes.

18. Q: Search in v1?
    R: Yes — search by game name.
    -> A: Q: Filters in v1 (search/releases)?
          R: Name only for search. Releases fetched live — no filters.
    -> B: Q: Genre/platform filters in My Games?
          R: Yes — filtering by genre and platform available in My Games (local DB data only).

19. Q: "My Games" page?
    R: Yes — tracked games list, filterable by status.
    -> A: Q: Default view — list or grid?
          R: Grid (default), toggleable to list.

20. Q: V1 routes?
    R: Home (releases) / Game Detail / My Games / Profile / Search Results / Login / Signup / /:userslug (public profile).

## Realignment Decisions

30. Q: Status reversion — score/review deleted, soft-deleted, or kept when status reverts from Completed/Dropped?
    R: Kept as-is.

31. Q: Public profile URL structure?
    R: /:userslug

32. Q: Average score on cards/detail — IGDB rating or GameXL user avg or both?
    R: Both shown separately.

33. Q: IGDB game editions (GOTY vs standard) — separate entries or merged under base game?
    R: Separate entries, matching IGDB's own structure.

34. Q: Pagination strategy for Releases and My Games?
    R: Infinite scroll.

35. Q: Redis in v1 stack for IGDB caching?
    R: Yes — officially part of v1.

---

## DB Schema & API

**Naming conventions:**
- DB fields: snake_case
- DB tables: snake_case
- API models: PascalCase
- API fields: camelCase

---

21. Q: Platforms — string array on Game or separate table?
    R: Separate Platform table, many-to-many with Game. Needed for filtering in My Games.

22. Q: Genres — string array on Game or separate table?
    R: Separate Genre table, many-to-many with Game. Needed for filtering in My Games.

23. Q: External API IDs — separate table or single field?
    R: Single field on Game named `external_api_key` (DB) / `externalApiKey` (API). IGDB is the only API.

24. Q: Score stored as decimal or integer?
    R: Decimal (e.g. 3.5 stars). Range 1.0–5.0, step 0.5.

25. Q: One review per game or multiple?
    R: One review per user per game (unique constraint on userId + gameId).

26. Q: Review interactions in v1?
    R: Read-only. Likes/upvotes deferred to v2.

27. Q: IGDB token managed server-side or client-side?
    R: Server-side only. Client never calls IGDB directly.

28. Q: Cache game data in DB or hit APIs live?
    R: Hybrid — browse/search hits IGDB live (server proxies the call). Game snapshot written to our DB only when user takes an action (track, review, etc.).
    -> A: Q: Update local game copy when external API changes?
          R: No automatic update — snapshot kept as-is. User can manually trigger a refresh on their game.
    -> B: Q: Dedup / multi-API strategy?
          R: Moot — IGDB only, no dedup needed.

29. Q: Extra fields on user_game or review?
    R: None for now.

---

## Game Detail Page

11. Q: What does the game detail page show?
    R: Title, cover, description, release date, platforms, genres, trailer, avg score, reviews list.
    -> A: Q: Tracking widget (status/score) on the detail page?
          R: Yes.

---

## Social

9. Q: Social model — follow or mutual friends?
   R: Follow (asymmetric). Users follow others to see what they're playing.
   -> A: Q: Activity feed in v1?
         R: No. Social is not a v1 priority — deferred.

10. Q: v1 scope?
    R: Releases screen + game tracking only. Everything else (lists, platform sync, social, community, recommendations, notifications, stats) is post-v1.
    -> A: Q: Native app in v1?
          R: No. Web-only for v1. Native is post-v1.

---

## Platform Sync

8. Q: Platform sync purpose — auth or auto-import?
   R: Auto-import game library + history. User must manually trigger sync step per platform.
   -> A: Q: One-time import or live sync?
         R: Live — stays updated after initial sync.
   -> B: Q: Status assigned automatically from platform data or manually?
         R: Always manual — sync only imports the game, user assigns status.

---

## Data Sources

3. Q: Where does game data come from?
   R: IGDB only. Single external API, eliminates all dedup concerns. Game model stores a single igdbId field.
