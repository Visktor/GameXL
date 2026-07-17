# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Styling (Tailwind)

- Use `cn()` from `@GameXL/ui/lib/utils` (clsx + tailwind-merge) instead of hand-interpolating template-literal class strings whenever merging 2+ conditional classes or merging with a caller-supplied `className` prop — plain string interpolation doesn't dedupe conflicting Tailwind utilities (`twMerge` does), and `clsx` skips falsy branches cleanly. A single one-off ternary (e.g. `score === null ? "opacity-40" : ""`) is fine as-is.
- Use `cva()` (`class-variance-authority`, already a dependency) for components with enumerable variant axes (size, tone, state) instead of ad-hoc conditionals — see `packages/ui/src/components/tabs.tsx` and `button.tsx` for the convention. Define the variant map outside the component body so it isn't rebuilt every render.
- Order inside `cn()`: base classes → conditionals → caller `className` override last, so the caller can win.

### State Management

- `useState` is for **UI-local** state only: toggles, hover/focus flags, open/closed, input focus — state with no meaning outside the component.
- **Business/domain state** (tracked/entity status, filters, search query, selections, anything tied to app data or synced with the backend) must NOT live in `useState`. Move it to a zustand slice in `apps/web/src/stores/`.
  - Check `apps/web/src/stores/` first for an existing slice covering the domain (e.g. `search-store.ts`, `session-store.ts`, `tracked-games-store.ts`) before creating a new one.
  - If the state is per-entity (keyed by id) and multiple components may render the same entity, key the store by id (`Record<string, T>`) instead of storing a single value — otherwise instances desync (see `tracked-games-store.ts`).
  - One `create()` call per feature/domain slice, flat `/stores` directory, no barrel file — matches existing convention.
  - Never store server data itself in zustand (that's TanStack Query's job) — only client-side/optimistic state derived from it.

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

### E2E Testing (Playwright)

- Location: `apps/web/e2e/*.spec.ts`. Run with `cd apps/web && pnpm e2e` (or `pnpm --filter web e2e` from the repo root).
- Config lives at `apps/web/playwright.config.ts`. It has its own `webServer` that auto-starts a dedicated Vite instance on port `3457` — never reuses the normal dev-server ports (web `5180`, server `3050`), so running e2e tests doesn't conflict with a dev session already running.
- **No real backend or database.** Every tRPC call is intercepted with `page.route` — don't spin up the server/DB to run these tests. Use the `mockTrpcProcedure(page, procedurePath, responder)` helper in `apps/web/e2e/support/trpc-route.ts`:
  ```ts
  await mockTrpcProcedure(page, "releases.list", (input) => ({
    games: [...],
    nextOffset: null,
  }));
  ```
- Mock the auth session too, for logged-out flows: `page.route("**/api/auth/get-session**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }))`.
- Use web-first assertions (`await expect(locator).toBeVisible()`, `expect.poll(...)`) instead of manual `waitForTimeout`/sleeps — they retry until the condition holds or the timeout expires.
- Prefer user-facing locators (`getByRole`, `getByPlaceholder`) over raw CSS selectors when the target has an accessible role/name.

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
