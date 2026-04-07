# Guest Session System — Implementation Document

---

## What was built

A dual-session authentication system that allows unauthenticated (guest) users to perform a limited set of write actions in the application without creating an account. Authentication state — whether the user is a guest or a fully authenticated account holder — is handled transparently at the infrastructure level. No component in the frontend application ever needs to manually check who the user is before making a request.

---

## Business rules that drove the design

1. **Guests can browse without any account** — releases, search, and game detail pages are fully accessible without authentication and generate zero DB writes.
2. **Guests can perform limited write actions** — adding or removing a game from a status-based list (Playing / Completed / Dropped / Want / On Hold) without signing up.
3. **Guests cannot score or review games** — those actions require a full account and redirect to sign-up.
4. **Guest sessions are lazy** — a guest session record is only created in the database the moment the guest performs their first write action. Pure browsing is free.
5. **Returning guests are re-identified** — if a guest closes their browser and returns later from the same browser/device, they are re-linked to their previous session and their data is preserved.
6. **Fingerprint mismatch means a new session** — if the fingerprint changes (browser update, new device, incognito mode), the old session is unrecoverable. Guests who do not create accounts accept this risk.
7. **Guest data migrates on signup** — when a guest creates an account, their tracked games are transferred to the new account automatically. The account always wins on conflict (same game tracked by both guest and account keeps the account's version).
8. **Login discards guest data** — logging into an existing account does not merge guest data. The account overwrites.
9. **Guest sessions are soft-deleted, not hard-deleted** — for revocability and future abuse prevention.
10. **Fingerprint-based blocking is the intended abuse mitigation** — blocking a guest by fingerprint prevents them from creating new sessions even after clearing cookies.

---

## How the fingerprint works

ThumbmarkJS is a client-side browser fingerprinting library. It collects characteristics of the browser environment (fonts, canvas rendering, audio fingerprint, hardware specs, etc.) and hashes them into a single string. This string is the fingerprint.

**The fingerprint lives in the client.** It is generated in the browser on every app load and stored in memory (Zustand). It is sent to the server as an HTTP header (`x-fingerprint`) on every tRPC request.

**The fingerprint is not a secret.** It is deterministic — the same browser will always produce the same hash. It is also reproducible — anyone with the same browser configuration can produce the same fingerprint.

### Why the token exists alongside the fingerprint

The fingerprint alone could serve as a session key, but it has a critical flaw: it cannot be invalidated. If it were stored directly in the cookie, anyone who captured that cookie value would have a permanent credential with no expiry and no way to revoke it — because the fingerprint is tied to the device, not to an issuance event.

The token solves this:
- It is a random UUID with no relationship to the device.
- It is rotated every time a browser session ends and the user returns (new token issued, old one dead).
- It can be revoked instantly by soft-deleting the `GuestSession` record — the cookie becomes worthless.
- The cookie reveals nothing about the device or fingerprint computation.

The mapping `fingerprint → token` lives only in the database. The browser holds the token. The server holds the fingerprint. Neither side alone has the full picture.

---

## Architecture decisions

### Why not create the guest session on every page load?

Early in the design, the fingerprint was going to be sent on page load and trigger guest session creation immediately. This was rejected because:
- Most guests never write anything. Creating DB records for pure browsers is wasteful.
- It contradicts the product rule: guests are view-only by default. A session should only exist when there is data to associate with it.

### Why is auth transparent at the infrastructure level?

Initially there was a `useGuestSession` hook with an `ensureGuestSession()` function that components were expected to call before any write action. This was rejected because:
- It leaks authentication concerns into business logic components.
- It is error-prone — any component that forgets to call it would silently fail.
- Both the better-auth cookie and the guest cookie already travel automatically on every request via `credentials: "include"`. The only gap was session creation, which belongs in the tRPC middleware, not in components.

### Why Zustand for the fingerprint?

The fingerprint needs to be read synchronously inside the tRPC client's `headers()` callback (which runs before every request). React state and async hooks are not accessible there. Zustand's store is readable synchronously outside of React via `useSessionStore.getState()`, which makes it the right tool for this bridge.

### Why not use better-auth for guest sessions?

better-auth manages fully authenticated sessions. Guest sessions are a different concept — they are not users, have no email or password, and have a completely different lifecycle (lazy creation, fingerprint-based re-identification, migration on signup). Mixing them would complicate the auth model significantly.

---

## Files changed and what each does

### Database (`packages/db`)

**`prisma/schema/guest_session.prisma`** — new model
- Stores one record per guest device
- `fingerprint`: the ThumbmarkJS hash (unique index)
- `token`: opaque UUID stored in the browser cookie (unique index)
- `deletedAt`: soft delete timestamp (null = active)

**`prisma/schema/user_game.prisma`** — modified
- `userId` changed from required to nullable
- `guestSessionId` added as nullable FK to `GuestSession`
- New unique constraint: `[guestSessionId, gameId]` (mirrors the existing `[userId, gameId]`)
- New index on `guestSessionId`
- Application-level rule: exactly one of `userId` or `guestSessionId` must be set

---

### API (`packages/api`)

**`src/context.ts`** — modified
- Runs on every tRPC request
- Calls better-auth to resolve an authenticated session
- If authenticated: stops here, `guestSession` is null
- If not: reads the `gxl_guest` cookie, looks up the token in DB
- If token matches an active record: `guestSession` is populated
- Does **not** create guest sessions — that is the middleware's job
- Exposes `session`, `guestSession`, and `honoContext` to all procedures

**`src/index.ts`** — modified, new `guestProcedure` added
- `publicProcedure`: no auth required, no session created (read-only routes)
- `protectedProcedure`: requires a full better-auth session, throws `UNAUTHORIZED` otherwise
- `guestProcedure`: for write mutations available to both guests and authenticated users
  - If authenticated: passes through immediately
  - If guest session already exists (cookie matched in context): passes through
  - If neither: reads `x-fingerprint` header, looks up fingerprint in DB
    - Found: rotates the token, re-links the session, issues new cookie
    - Not found: creates new `GuestSession` record, issues cookie
  - If fingerprint is also missing: throws `UNAUTHORIZED`

**`src/routers/guest-session.ts`** — new file
- `migrateToAccount`: called after signup. Requires auth (`protectedProcedure`). Finds all `UserGame` rows belonging to the guest session, filters out any that already exist on the account (account wins), transfers the rest to the new user ID, soft-deletes the guest session, clears the cookie.
- `invalidate`: called after login to existing account. Requires auth. Soft-deletes the guest session and clears the cookie. No migration.

---

### Web app (`apps/web`)

**`src/stores/session-store.ts`** — new file (Zustand)
- Holds the browser fingerprint in memory
- `initFingerprint()`: calls `new Thumbmark().get()`, stores `result.thumbmark`
- Idempotent: does nothing if fingerprint already set
- Read synchronously anywhere via `useSessionStore.getState().fingerprint`

**`src/utils/trpc.ts`** — modified
- `headers()` callback added to `httpBatchLink`
- Reads fingerprint from Zustand store synchronously before every request
- Adds `x-fingerprint` header if fingerprint is available
- `credentials: "include"` already ensures all cookies travel automatically

**`src/root.tsx`** — modified
- `RootLayout` now calls `initFingerprint()` in a `useEffect` on mount
- Fingerprint is ready before any user interaction triggers a write action

**`src/routes/login/sign-up/sign-up-form.tsx`** — modified
- After successful signup: calls `trpcClient.guestSession.migrateToAccount.mutate()` before navigating away

**`src/routes/login/sign-in/sign-in-form.tsx`** — modified
- After successful login: calls `trpcClient.guestSession.invalidate.mutate()` before navigating away

**`src/lib/use-guest-session.ts`** — deleted
- Replaced entirely by the transparent infrastructure approach

---

### Native app (`apps/native`)

**`lib/auth-client.ts`** — fixed
- `@better-auth/expo` storage interface expects `{ setItem, getItem }` (not the `Async`-suffixed names from `expo-secure-store`)
- Wrapped `setItemAsync` and `getItemAsync` to match the expected interface
- `deleteItemAsync` removed (not part of the storage type)

---

## Data flow

### First write action (no prior cookie)

```
1. App loads → RootLayout calls initFingerprint()
2. ThumbmarkJS runs in browser → fingerprint stored in Zustand
3. User clicks "Add to list"
4. tRPC mutation fires
   → headers: { x-fingerprint: "a3f9..." }
   → cookie: (none)
5. createContext: no auth session, no guest cookie → guestSession = null
6. guestProcedure middleware:
   → no guestSession, no auth
   → reads x-fingerprint: "a3f9..."
   → DB lookup: no existing record for this fingerprint
   → creates GuestSession { fingerprint: "a3f9...", token: "uuid-1" }
   → sets gxl_guest=uuid-1 cookie (httpOnly) in response
7. Mutation executes: UserGame created with guestSessionId set, userId null
```

### Every subsequent request (cookie established)

```
1. tRPC request fires
   → headers: { x-fingerprint: "a3f9..." }
   → cookie: gxl_guest=uuid-1
2. createContext:
   → reads token "uuid-1" from cookie
   → DB lookup: finds active GuestSession
   → guestSession populated
3. x-fingerprint header ignored entirely
4. Request proceeds normally
```

### Browser session ends, user returns

```
1. Browser closed → gxl_guest cookie cleared (session cookie)
2. User returns, app loads → fingerprint regenerated (same value)
3. First write action:
   → guestProcedure reads x-fingerprint: "a3f9..."
   → DB lookup: finds existing record (same fingerprint, not deleted)
   → rotates token: GuestSession updated { token: "uuid-2" }
   → sets gxl_guest=uuid-2 cookie
4. Guest data (UserGame rows) still intact, linked by guestSessionId
```

### Signup (guest → account)

```
1. User signs up via better-auth
2. onSuccess:
   → trpcClient.guestSession.migrateToAccount.mutate()
3. Server: ctx.session (new user) + ctx.guestSession (existing guest)
4. Fetches all guest UserGame rows
5. Filters out any gameId already in the new user's account
6. Updates remaining rows: userId = new user ID, guestSessionId = null
7. Soft-deletes GuestSession (deletedAt = now)
8. Clears gxl_guest cookie
9. User navigates to home — all their guest data is now under their account
```

### Login to existing account

```
1. User logs in via better-auth
2. onSuccess:
   → trpcClient.guestSession.invalidate.mutate()
3. Server: ctx.session (existing user) + ctx.guestSession (guest, if any)
4. Soft-deletes GuestSession — no migration, no merge
5. Clears gxl_guest cookie
6. Account data unchanged
```

---

## Future: fingerprint-based blocking

To block an abusive guest, add a `blockedAt` timestamp to `GuestSession`. Then check it in two places:

- **`createContext`**: if the token resolves to a blocked record, return `guestSession = null` (treat as if no session exists)
- **`guestProcedure`**: when looking up by fingerprint to create a new session, check for an existing blocked record for that fingerprint and throw before creating a new one

The second check is essential. Without it, a blocked guest clears their cookies, their next write action creates a fresh session via fingerprint, and the block is bypassed. Blocking the fingerprint itself at the creation point is what makes revocation durable.

Fingerprint blocking is effective against casual abusers. A sophisticated actor who understands ThumbmarkJS can alter their browser environment to produce a different fingerprint. For that edge case, IP-based rate limiting at the server or edge layer would be the next layer of defense.
