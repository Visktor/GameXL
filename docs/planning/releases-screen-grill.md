# Releases Screen — Grill Session

## Page Meta

8. Q: Page <title>?
   R: "New Releases" (or "GameXL — New Releases").

## Guest CTA

7. Q: Sign-up nudge on releases page for guests?
   R: No. Header Sign In / Sign Up is sufficient.

## Sorting

6. Q: Sort order within a time span?
   R: Release date, newest first.

## Header

5. Q: Search bar — always visible or behind icon?
   R: Always visible.

## Time Span Tabs

4. Q: Zero results for selected tab — auto-advance or empty state?
   R: Empty state on current tab. Same behavior across all tabs and filters app-wide.
   -> A: Q: Tab selection updates URL query param?
         R: Yes.

## Score Display

2. Q: IGDB (0–100) and GameXL avg (1.0–5.0) — how displayed?
   R: Both in popover only (not on card). GameXL avg = 5-star display. IGDB = raw number at top of popover. Card kept minimal.
   -> A: Q: What does the card itself show?
         R: Cover art + title only. Everything else deferred to popover to avoid cluttering the card.
         -> A: Q: Popover contents — genres/platforms/release date included?
               R: No. Popover = trailer + IGDB score + GameXL avg score + Playing/Want buttons + trash icon (if tracked). Nothing else for now.

## Trailer Popup

3. Q: No trailer available — what shows in popover?
   R: Expanded cover art.

1. Q: Trailer popup — modal overlay or card expands in place?
   R: Expands in place.
   -> A: Q: Expanded card pushes neighbors or floats above?
         R: Floats above.
         -> A: Q: Anchored to card position or repositions to avoid clipping at grid edges?
               R: Repositions — use a popover library, don't implement manually.
               -> A: Q: What does expanded card show beyond video?
                     R: Trailer video + button to add game to a list.
                     -> A: Q: Can guests use "add to list"?
                           R: Yes — guest session (fingerprint-based, already implemented). Score/review auth-gated only.
                           -> A: Q: "Add to list" UI — single button + dropdown, or inline status picker?
                                 R: 2 icon buttons in popover: Playing + Want only. (Completed/Dropped/On Hold excluded — don't fit new-release context.)
                                 -> A: Q: If game already tracked — active status highlighted + toggle off, or separate remove control?
                                       R: Small trash/X icon on opposite side of popover to delete the record. Status buttons not togglable.
                                       -> A: Q: Can user switch status from popover (e.g. Want → Playing)?
                                             R: No. Status switching only on game detail page (dropdown). Popover is intentionally simple.
