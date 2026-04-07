# Auth / Fingerprint Session — Grill Session

---

## Auth Mechanism

1. Q: What is the "fingerprint" in "cookies + fingerprint auth solution"?
   R: Browser fingerprint via ThumbmarkJS — used as guest session identifier.
   -> A: Q: Fingerprint stored server-side (DB) or client-side only?
         R: DB.
   -> B: Q: What write actions can a fingerprint guest perform?
         R: (1) add/remove game to status-based lists (Playing/Completed/Dropped/Want/On Hold); (2) access suggestion wheel (Tinder-like, TBD).
         -> A: Q: "Default lists" — status-based (PRD) or simpler single "Saved" list?
               R: Status-based (same as PRD).
         -> B: Q: Score/review available to guests?
               R: No — auth-gated.
         -> C: Q: Guest tracked games migrated to account on signup?
               R: Yes.
               -> Q: Guest record deleted after migration?
                     R: Soft deleted.
               -> Q: Guest data merged on signup (new account) or also on login (existing account)?
                     R: Signup only. Existing account always overwrites guest — no merge.
               -> Q: Conflict on migration (same game in guest + account) — which wins?
                     R: Account wins; guest entry discarded.
   -> C: Q: What does the cookie store — fingerprint hash or opaque server-generated token?
         R: Most secure option = opaque server-generated token mapped to fingerprint in DB; fingerprint never exposed to client.
   -> D: Q: Guest tracked games in same user_game table (nullable user_id + guest_session_id) or separate table?
         R: Same table — nullable user_id, guest_session_id FK.
   -> E: Q: Guest session cookie expiry?
         R: Session cookie (cleared on browser close, no explicit expiry).
   -> F: Q: Returning fingerprint — re-link to existing guest session or fresh session?
         R: Re-link only on exact fingerprint match; no fuzzy matching (no risk of wrong record).
         -> Q: Fingerprint mismatch (browser update, new device) — new guest session, old data lost. Acceptable?
               R: Yes — no account = user accepts the risk.

## DB Schema

2. Q: DB-level constraint to ensure exactly one of userId/guestSessionId is set on user_game?
   R: No — application-level validation only; avoid DB-level business logic.

## Session Flow

3. Q: When is the fingerprint sent to the server?
   R: On first write action only — no guest session created for view-only browsing.
   -> A: Q: Fingerprint/guest session skipped if user is already authenticated?
         R: Yes — skip entirely for logged-in users.
   -> B: Q: Guest session soft-deleted when guest logs into existing account?
         R: Yes.

## UI Behavior

4. Q: "Add to list" — always available (guest creates session) or prompt to sign up first?
   R: Always available. Only auth-gated actions (score, review) redirect to sign-up.

## tRPC / API

5. Q: Guest session resolution (cookie → DB) — tRPC middleware or per-procedure?
   R: Middleware, but not applied to every route — only where guest session is relevant.
