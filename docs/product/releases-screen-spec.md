# Releases Screen — Page Specification

**Route:** `/`
**Auth required:** No (guests allowed, view-only)

---

## Purpose

The Releases Screen is the first page every user sees when they arrive at GameXL. It serves a dual role:

1. **Discovery hook** — show what games are launching now so users immediately get value without signing up.
2. **Conversion funnel entry** — a guest who finds a game they want to track is nudged toward creating an account.

The page must feel fast and browsable. The target is a sub-1-second render for the initial batch of games.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│  Header (logo · search bar · Sign In · Sign Up)     │
├─────────────────────────────────────────────────────┤
│  [Today] [This Week] [This Month] [This Year]       │  ← Time span tabs
├─────────────────────────────────────────────────────┤
│  Game Card Grid (infinite scroll)                   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │ Card │  │ Card │  │ Card │  │ Card │            │
│  └──────┘  └──────┘  └──────┘  └──────┘            │
│  ┌──────┐  ┌──────┐  ...                            │
└─────────────────────────────────────────────────────┘
```

---

## Header

- **Logo** — left-aligned, links back to `/`.
- **Search bar** — center or right-of-logo; triggers navigation to `/search?q=…` on submit.
- **Auth CTAs** — right-aligned: "Sign In" (ghost/outline) and "Sign Up" (filled/primary). Hidden and replaced by user avatar/menu when authenticated.

---

## Time Span Tabs

Four tabs rendered as a segmented control or tab strip:

| Tab | Label | Default |
|---|---|---|
| `today` | Today | ✅ |
| `week` | This Week | |
| `month` | This Month | |
| `year` | This Year | |

- Selecting a tab replaces the grid content; URL updates with a query param (e.g. `?span=week`) so the state is shareable and back-navigable.
- The active tab is highlighted.
- While the new batch loads, a skeleton grid is shown in place of the cards.

---

## Game Cards

Each card displays:

| Field | Source | Notes |
|---|---|---|
| Cover art | IGDB | Fixed aspect ratio; placeholder shown if missing |
| Title | IGDB | Truncated at 2 lines |
| Genre(s) | IGDB | Shown as small text tags (up to 2–3, then "+N more") |
| Platform(s) | IGDB | Shown as small text tags or icons (up to 2–3, then "+N more") |
| IGDB Score | IGDB | Displayed with a distinct label ("IGDB") |
| GameXL Avg Score | GameXL DB | Displayed separately with a "GameXL" label; shown as "—" if no user scores exist yet |

### Hover Interaction (web only)

- On hover, the card expands or a popup overlay appears showing a trailer video.
- Video autoplays muted.
- If no trailer is available, the hover state shows an expanded view of the cover art or a "No trailer available" indicator — no broken player.
- Popup closes on mouse-out or `Escape` key.

### Card Click

- Clicking the card (outside the hover trailer) navigates to `/games/:id`.

### Grid Density

- Desktop: 4–5 cards per row.
- Tablet: 2–3 cards per row.
- Mobile: 1–2 cards per row (grid becomes tighter, no hover trailer on mobile in v1).

---

## Infinite Scroll

- Initial page: first N games (exact batch size TBD — likely 20).
- As the user scrolls near the bottom, the next batch is fetched automatically.
- A subtle loading indicator (spinner or skeleton row) appears at the bottom while fetching.
- When all results are exhausted, a "You've seen all releases for this period." message is shown.

---

## Empty State

If IGDB returns zero games for the selected time span:

- A centered illustration or icon with the message: "No game releases for this period."
- Suggest switching to a different time span tab.

---

## Error State

If the IGDB call fails:

- A user-facing error message (via toast or inline): "Failed to load releases. Please try again."
- A retry button.
- No stale fallback — per the PRD risk register, v1 does not cache IGDB responses for fallback display.

---

## Guest vs. Authenticated Experience

| Element | Guest | Authenticated |
|---|---|---|
| View releases | ✅ | ✅ |
| Hover trailer | ✅ | ✅ |
| Click through to game detail | ✅ | ✅ |
| "Sign In / Sign Up" in header | ✅ shown | hidden |
| User avatar / account menu | hidden | ✅ shown |

No sign-up prompt / banner is inserted into the grid itself (not explicitly specified — flagged as open question below).

---

## Data Flow

```
User loads /
  → Client renders skeleton
  → tRPC query → Express → IGDB API (server-side Twitch token)
  → IGDB response cached in Redis (mitigates rate limits on repeated identical requests)
  → Client renders game cards
```

GameXL avg scores are fetched from the local PostgreSQL DB and merged with the IGDB response server-side before returning to the client.

---

## Success Metrics

| Metric | Target |
|---|---|
| Page renders initial grid | < 1 second |
| Zero duplicate games in any listing | Required |
| No broken card if cover art is missing | Required |
| No broken player if trailer is missing | Required |

---

## Open Questions (for Q&A)

1. **Sign-up nudge in the grid** — Should there be a CTA card, banner, or bottom-of-page prompt encouraging guests to create an account? Or is the header CTA sufficient?
2. **Default time span** — "Today" is the default, but what happens on a day with 0 releases? Should the UI auto-advance to "This Week"?
3. **Trailer popup UX** — Is the popup a full modal overlay (darkened backdrop) or a card-level inline expansion? Does it cover adjacent cards?
4. **Score display format** — How are IGDB and GameXL scores visually formatted? Numeric (e.g. "7.8 / 10" for IGDB, "3.5★ GameXL")? Or both normalized to the same star scale?
5. **IGDB score scale** — IGDB uses a 0–100 scale. Should it be displayed as-is (e.g. "82") or converted to a 1–5 or 1–10 display scale?
6. **Platform/genre tags overflow** — If a game has 6 platforms, do we show 2 tags + "+4 more" tooltip, or just truncate silently?
7. **Sorting** — Within a time span, are games sorted by release date? By IGDB score? Is the sort order configurable by the user?
8. **Header search** — Is the search bar always visible, or is it behind a search icon that expands on click (especially on mobile)?
9. **Page title & meta** — What should the `<title>` and OG meta tags say for SEO/sharing?
10. **Analytics / tracking events** — Are there any click or impression events to fire on this page (e.g. card viewed, tab switched)?
