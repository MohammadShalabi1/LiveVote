# LiveVote – 2-Day Production Readiness & UX Sprint

> **Scope:** Junior-level improvements that can realistically be completed in about **2 focused days (12–16 hours)**.
>
> **Current architecture assumed from the project:** React + Vite + TypeScript, **plain CSS (no Tailwind)**, React Hook Form + Zod, TanStack Query, Supabase Postgres + Realtime, Recharts, QR sharing, deployed with Vercel/Supabase. If the current codebase still uses Tailwind, this sprint includes migrating the existing Tailwind classes to normal `.css` files and removing Tailwind afterward. Voting should remain possible **without requiring voters to create an account**.
>
> **Important:** The GitHub URL was not publicly accessible during this review, so begin with Task 0 and map the task names below to the actual files/tables in the repository before editing code.

---

## Sprint Goal

By the end of Day 2, LiveVote should:

- Prevent the most obvious unauthorized Supabase writes.
- Prevent accidental/normal duplicate votes at the database level.
- Validate user input on both the UI and database boundaries.
- Handle loading, errors, empty polls, closed polls, and failed realtime connections cleanly.
- Give users a smoother mobile voting flow.
- Support closing/expiring a poll.
- Let the poll creator control when voters can see results.
- Use normal CSS files with reusable CSS variables/components instead of Tailwind utility classes.
- Have basic production headers, environment checks, logging, and a small test checklist.

## Do NOT Add in This Sprint

Keep these for later because they can easily turn a 2-day cleanup into a multi-week project:

- Full user accounts for voters.
- Comments/chat.
- AI-generated polls.
- Complex admin dashboard.
- Multi-tenant organizations/teams.
- Payments.
- Advanced analytics.
- Redis/Kafka/microservices.
- Kubernetes.

---

# DAY 1 – Security + Data Integrity + Backend/Supabase

## Task 0 – Audit the Current Data Flow

**Priority:** P0  
**Estimate:** 30–45 min

### Goal

Understand exactly what the browser can currently read/write before changing anything.

### Steps

- [x] Find the Supabase client initialization.
- [x] Confirm the frontend only uses `VITE_SUPABASE_URL` and the public/anon key.
- [x] Search the entire repository for:
  - `service_role`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - hard-coded URLs/keys
  - `dangerouslySetInnerHTML`
  - direct `.insert()`, `.update()`, `.delete()` calls
- [x] List the current Supabase tables and columns used by LiveVote.
- [x] Identify who is allowed to:
  - create a poll
  - view a poll
  - vote
  - change/remove a vote
  - close/delete a poll
- [x] Check whether Row Level Security is enabled for every public table.
- [x] Check whether realtime subscriptions are cleaned up when React components unmount.

### Audit Notes

- Supabase is initialized in `src/lib/supabaseClient.ts` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, `dangerouslySetInnerHTML`, committed `.env*` files, or obvious hard-coded Supabase keys were found in tracked project files.
- Tables inferred from frontend queries are `polls`, `options`, and `votes`.
- Columns used by the app:
  - `polls`: `id`, `question`, `creator_token`, `is_closed`
  - `options`: `id`, `poll_id`, `label`, `position`
  - `votes`: `id`, `poll_id`, `option_id`, `voter_token`
- Browser write paths:
  - `src/hooks/useCreatePoll.ts` inserts `polls` and `options`.
  - `src/hooks/useVote.ts` inserts `votes`.
  - `src/hooks/useClosePoll.ts` updates `polls.is_closed`.
  - `src/hooks/useDeletePoll.ts` deletes `polls`.
- Current authorization model:
  - Anyone with the frontend can create and view public polls through the anon Supabase client.
  - Anonymous voters vote using a localStorage `voter_token`.
  - Poll creator controls use a localStorage `creator_token`.
  - Vote changes/removals are not intentionally supported by the UI.
  - Close/delete actions are attempted directly from the browser and must be protected by database RLS/grants or moved behind creator-token-aware RPCs in Task 1.
- Realtime in `src/pages/ResultPage.tsx` subscribes only to `votes` inserts for the current `poll_id` and removes the channel on unmount.
- No local Supabase migration/schema files exist in this repository, so actual remote RLS policies, grants, constraints, and indexes cannot be verified from local code. Treat Task 1 as requiring new checked-in SQL migrations or direct inspection of the Supabase project.

### Done When

- [x] No secret/service-role key exists in frontend code or committed environment files.
- [x] You know every browser-to-Supabase write path before continuing.

---

## Task 1 – Lock Down Supabase with RLS

**Priority:** P0  
**Estimate:** 1.5–2 hr

### Problem

A Supabase anon key is safe to expose only when **Row Level Security policies are correct**. If tables allow broad anonymous updates/deletes, a user can bypass the UI and call Supabase directly.

### Goal

Use RLS as the real authorization boundary instead of trusting buttons hidden in React.

### Steps

- [x] Enable RLS on every public table used by the app, especially:
  - polls
  - poll_options/options
  - votes
- [x] Review Postgres grants for `anon`/`authenticated`; revoke operations those roles do not need. RLS policies and SQL grants should both follow least privilege.
- [x] Allow anonymous users to `SELECT` only the poll data required by the public voting page.
- [x] Do **not** give anonymous clients unrestricted `UPDATE` or `DELETE` access to polls/options.
- [x] Make sure a voter cannot directly update another voter's vote.
- [x] If creator/admin actions currently happen directly from the browser, move privileged operations behind a Supabase RPC or Edge Function instead of opening a broad RLS policy.
- [x] Keep policies small and readable. Add comments explaining what each policy protects.

### Implementation Notes

- Added `supabase/migrations/202608280001_lock_down_rls.sql`.
- The migration enables RLS on `polls`, `options`, and `votes`.
- Direct anonymous table grants are limited to public reads and vote inserts.
- Anonymous `UPDATE` and `DELETE` are not granted on `polls`, `options`, or `votes`.
- Vote inserts are allowed only when the poll is open and the selected option belongs to that poll.
- Poll creation, closing, and deletion now use `create_poll`, `close_poll`, and `delete_poll` RPCs.
- Close/delete RPCs validate the caller's browser `creator_token` against the poll row before changing data.
- This local migration must be applied to the Supabase project before the RLS protections are active in production.

### Minimum Security Rule

The frontend must never be considered trusted. A user should not gain extra permissions by manually sending requests from DevTools/Postman.

### Done When

- [x] A normal visitor can load an open poll and vote.
- [x] A visitor cannot directly delete a poll using the anon Supabase client.
- [x] A visitor cannot update arbitrary poll rows.
- [x] A visitor cannot modify another browser's vote identifier.

### Manual Test

Try the same forbidden `.update()`/`.delete()` operation manually from the browser console or a small script. Supabase should reject it.

---

## Task 2 – Add Anonymous Voter Identity + Database Duplicate Protection

**Priority:** P0  
**Estimate:** 1–1.5 hr

### Problem

A UI-only `hasVoted` flag can be bypassed by refreshing the page or calling the database directly.

### Goal

Give each browser an anonymous voter ID and make duplicate-vote prevention a database rule.

### Steps

- [x] On first visit, create a UUID with `crypto.randomUUID()`.
- [x] Save it in localStorage using a clear key such as `livevote_voter_id`.
- [x] Send `voter_id` with a vote.
- [x] Add a database uniqueness rule such as:

```sql
unique (poll_id, voter_id)
```

- [x] If the product allows changing a vote, use an atomic `upsert`/RPC instead of inserting multiple rows.
- [x] Handle duplicate-key errors in the UI with a friendly message instead of a generic crash.

### Implementation Notes

- The existing database column is `votes.voter_token`, so the implementation keeps that column name and treats it as the anonymous voter ID.
- `src/hooks/useVoterToken.ts` now stores new voter IDs under `livevote_voter_id` and migrates existing `livevote:voter_token` values.
- Added `supabase/migrations/202608280002_prevent_duplicate_votes.sql`.
- The migration requires `votes.poll_id`, `votes.option_id`, and `votes.voter_token`, then adds uniqueness for `(poll_id, voter_token)`.
- Vote changing is not currently supported, so voting remains insert-only and duplicate inserts return a friendly message.
- Existing duplicate vote rows must be cleaned before applying the migration if Supabase rejects the unique constraint.

### Important Limitation

This blocks normal duplicate voting from the same browser, but a determined user can clear browser storage or use another device. Do **not** claim this provides one-person-one-vote identity security.

### Done When

- [x] Double-clicking Vote does not create two vote rows.
- [x] Refreshing does not create a second vote for the same poll/browser.
- [x] Two different browser profiles can still vote independently.

---

## Task 3 – Make Voting Atomic

**Priority:** P0  
**Estimate:** 1 hr

### Problem

Multiple separate client operations can create race conditions, especially with realtime updates or double clicks.

### Goal

One vote action should either complete fully or fail fully.

### Steps

- [x] Disable the vote button immediately while a vote request is pending.
- [x] Use one database operation for casting/changing a vote.
- [x] Prefer a Supabase `upsert` or small Postgres RPC for vote changes.
- [x] Enforce that the referenced option belongs to the referenced poll.
- [x] Prevent voting when the poll is closed/expired.
- [x] Return a predictable result/error code to the UI.

### Implementation Notes

- Added `supabase/migrations/202608280003_cast_vote_rpc.sql`.
- The migration revokes direct anonymous `votes` inserts and replaces the insert policy with a `cast_vote` RPC.
- `cast_vote` checks for a non-empty voter ID, an open poll, and an option that belongs to that poll before inserting.
- Duplicate votes still rely on the Task 2 `(poll_id, voter_token)` database constraint.
- `src/hooks/useVote.ts` now calls `cast_vote` instead of doing a separate poll read and vote insert.
- The vote page maps duplicate and closed-poll failures to friendly messages.

### Done When

- [x] Rapid clicks do not create corrupted or duplicate data.
- [x] A vote cannot be stored for an option belonging to another poll.
- [x] Failed requests leave the previous vote state unchanged.

---

## Task 4 – Validate Poll and Vote Data at Both Layers

**Priority:** P0  
**Estimate:** 1 hr

### Goal

Use Zod for good UX and database constraints for real integrity.

### Frontend Validation

- [x] Poll title: trim whitespace, minimum 3 chars, maximum 120 chars.
- [x] Option text: trim whitespace, minimum 1 char, maximum 80 chars.
- [x] Require at least 2 options.
- [x] Set a reasonable maximum, for example 10 options.
- [x] Reject duplicate options after trimming and lowercasing.
- [x] Prevent empty-space-only values.
- [x] Show errors next to the field, not only in the console.

### Database Validation

- [x] Add matching maximum lengths/check constraints where practical.
- [x] Add foreign keys with intentional delete behavior.
- [x] Add `NOT NULL` where values are actually required.
- [x] Add created timestamps if missing.

### Implementation Notes

- Added `supabase/migrations/202608280004_validate_poll_vote_data.sql`.
- The migration adds `created_at` columns when missing, required-column rules, length checks, and cascade-delete foreign keys.
- The `create_poll` RPC now enforces question length, option length, 2-10 options, blank rejection, and duplicate option rejection.
- `src/pages/CreatePollPage.tsx` now uses matching Zod validation and shows field-level messages.
- `src/hooks/useCreatePoll.ts` trims values before using the temporary direct-insert fallback.
- Existing invalid database rows may need cleanup before applying this migration.

### XSS Check

- [x] Keep React's normal escaped text rendering.
- [x] Do not render poll titles/options with `dangerouslySetInnerHTML`.

### Done When

Invalid data is rejected even if someone bypasses the React form.

---

## Task 5 – Add Poll Status / Expiration

**Priority:** P1  
**Estimate:** 1–1.5 hr

### Feature

Allow a poll to naturally stop accepting votes.

### Data

Add either:

```text
status: open | closed
```

and/or:

```text
expires_at: timestamp nullable
```

### Steps

- [x] Show `Open`, `Closed`, or `Ended` clearly on the poll page.
- [x] Disable voting when closed/expired.
- [x] Enforce the same rule in the database/RPC, not only in React.
- [x] Keep results visible after a poll closes.
- [x] If an expiration time exists, display it in the user's local time.

### Implementation Notes

- Added `polls.expires_at` in `supabase/migrations/202608280005_add_poll_expiration.sql`.
- Updated `create_poll` to accept optional `p_expires_at`.
- Updated `cast_vote` to reject closed, expired, or missing polls.
- Added `src/lib/pollStatus.ts` to keep `Open`, `Closed`, and `Ended` logic in one place.
- Added an optional expiration field to the poll creation form with future-date validation.
- Vote and dashboard pages now display expiration times in the user's local format.

### Done When

- [x] Changing the DOM/button state cannot bypass a closed poll.

---


## Task 5.1 – Add Result Visibility Controls

**Priority:** P1  
**Estimate:** 45–60 min

### Feature

Let the poll creator decide **when voters are allowed to see poll results**.

Use a small setting such as:

```text
results_visibility: always | after_vote | after_close
```

### Behavior

- `always` → results are visible before and after voting.
- `after_vote` → results stay hidden until that browser successfully votes.
- `after_close` → results stay hidden until the poll is closed or expired.

### Steps

- [x] Add `results_visibility` to the poll data with a safe default such as `always`.
- [x] Add a simple select/radio group to the poll creation form.
- [x] Validate the value with Zod.
- [x] Show a friendly message when results are intentionally hidden, for example `Results will be available after you vote.`
- [x] Do not rely only on hiding a chart with CSS. Make sure the query/API/RPC does not expose data that should still be hidden if the current architecture supports enforcing this at the data boundary.
- [x] Keep the logic in one helper such as `canViewResults(...)` instead of repeating conditions in several components.

### Implementation Notes

- Added `supabase/migrations/202608280006_add_result_visibility.sql`.
- The migration adds `polls.results_visibility` with allowed values `always`, `after_vote`, and `after_close`.
- `create_poll` now accepts `p_results_visibility`, validates it, and saves it with a default of `always`.
- Direct anonymous reads from `votes` are revoked, and result reads now go through `get_poll_results`.
- `has_voted` replaces the frontend's direct vote-row lookup.
- `get_poll_results` returns aggregate option counts only when visibility rules allow it, with creator override through the existing browser `creator_token`.
- Vote and result pages now show friendly hidden-result messages and only subscribe to realtime updates when results are visible.

### Done When

- A creator can choose one of the three modes.
- `after_vote` reveals results only after a successful vote for that browser.
- `after_close` reveals results only after the poll has ended.
- Refreshing the page does not incorrectly reveal hidden results.


## Task 6 – Add Basic Database Indexes

**Priority:** P1  
**Estimate:** 20–30 min

### Add/Verify Indexes

- [x] `poll_options(poll_id)`
- [x] `votes(poll_id)`
- [x] `votes(option_id)` if queried directly
- [x] unique index for `(poll_id, voter_id)`
- [x] index for `polls(created_at)` if recent polls are listed

### Implementation Notes

- Added `supabase/migrations/202608280007_add_basic_indexes.sql`.
- The actual options table in this repo is `public.options`, so the migration adds `options_poll_id_position_idx` on `(poll_id, position)`.
- Added indexes for `votes(poll_id)`, `votes(option_id)`, `polls(creator_token)`, and `polls(created_at)`.
- The existing Task 2 unique constraint on `(poll_id, voter_token)` already creates the duplicate-vote supporting index.

### Done When

The app does not need to scan the entire votes/options table for common poll-page queries.

---

# DAY 2 – UX + Reliability + Production Polish

## Task 7 – Improve the Voting Interaction

**Priority:** P0  
**Estimate:** 1–1.5 hr

### Goal

Make voting feel immediate, understandable, and safe from accidental repeated actions.

### Steps

- [x] Make the entire option card clickable, not only a tiny radio control.
- [x] Clearly show the selected option.
- [x] Disable the submit button while saving.
- [x] Show a small loading indicator while submitting.
- [x] On success, show `Vote submitted` or `Vote updated`.
- [x] On failure, keep the user's selection and show a retry action.
- [x] If changing votes is supported, explicitly label it `Change vote`.
- [x] Avoid optimistic count updates unless rollback is implemented correctly.

### Implementation Notes

- The vote page now uses a select-then-submit flow instead of submitting immediately when an option is tapped.
- Selected options get a visible selected state and an explicit `Selected` marker.
- The submit button is disabled until an option is selected and shows `Submitting...` with a spinner while saving.
- Failed submissions keep the user's selected option and change the submit button to `Retry vote`.
- Successful submissions show `Vote submitted.` and invalidate the relevant vote state/results queries.
- Vote changing is not supported, so no `Change vote` action is shown.

### Done When

A slow network does not make users wonder whether they voted twice.

---

## Task 8 – Create Proper Loading, Empty, Error, Not-Found, and Closed States

**Priority:** P0  
**Estimate:** 1 hr

### Required UI States

- [ ] Poll loading skeleton.
- [ ] Poll not found state.
- [ ] Poll has no options state.
- [ ] Network/API failure state with Retry.
- [ ] Closed/expired poll state.
- [ ] Realtime disconnected state that still allows refresh/retry.
- [ ] Results loading state.

### Error Rule

Never show raw Supabase/Postgres errors directly to users. Log useful developer details separately and display a short friendly message.

### Done When

The poll page always has a deliberate state instead of a blank screen or console-only error.

---

## Task 9 – Improve Share + QR Experience

**Priority:** P1  
**Estimate:** 45 min

### Steps

- [ ] Use the Web Share API when available.
- [ ] Fall back to copying the poll URL.
- [ ] Show visible `Copied!` feedback.
- [ ] Add an accessible label to the QR code.
- [ ] Make sure the shared URL points directly to the poll.
- [ ] Do not expose internal database/admin identifiers that are not needed in the public URL.

### Done When

A mobile user can share a poll in one or two taps.

---

## Task 10 – Improve Results UI

**Priority:** P1  
**Estimate:** 1 hr

### Steps

- [ ] Show total vote count.
- [ ] Show both raw count and percentage per option.
- [ ] Handle `0 votes` without division-by-zero/NaN UI.
- [ ] Sort only if sorting does not confuse option order; otherwise keep creator order.
- [ ] Add a simple visual marker for the leading option.
- [ ] Make chart labels readable on mobile.
- [ ] Ensure Recharts does not overflow its container.
- [ ] Keep a text/list representation so results are understandable without relying only on color.

### Done When

Results are readable at ~375px mobile width and with zero votes.

---

## Task 11 – Realtime Reliability Cleanup

**Priority:** P1  
**Estimate:** 45–60 min

### Steps

- [ ] Confirm each poll subscribes only to changes relevant to that poll.
- [ ] Remove/unsubscribe from the channel on component unmount.
- [ ] Avoid creating a new subscription on every render.
- [ ] On realtime event, invalidate/refetch the relevant TanStack Query key instead of manually duplicating server-state logic in many places.
- [ ] If realtime disconnects, keep the page usable and allow normal refetch.

### Done When

Navigating between polls does not continuously increase the number of active realtime subscriptions.

---

## Task 12 – Accessibility + Mobile Pass

**Priority:** P1  
**Estimate:** 1 hr

### Accessibility

- [ ] Every input has a label.
- [ ] Option selection works with keyboard controls.
- [ ] Buttons have visible focus states.
- [ ] Icon-only buttons have `aria-label`.
- [ ] Error messages are connected to their inputs.
- [ ] Do not communicate winner/selected state using color alone.
- [ ] Use semantic headings in order (`h1` then `h2`, etc.).

### Mobile

Test at roughly:

- [ ] 375 × 667
- [ ] 390 × 844
- [ ] 768 × 1024

Check:

- [ ] no horizontal scrolling
- [ ] no clipped chart labels
- [ ] buttons are easy to tap
- [ ] QR/share controls do not overflow
- [ ] long poll titles wrap correctly

---


## Task 12.1 – Remove Tailwind and Use Plain CSS

**Priority:** P1  
**Estimate:** 1.5–2 hr

### Goal

Keep the frontend styling simple and junior-friendly: **regular CSS files, no Tailwind utility classes**.

### Suggested Structure

```text
src/
  styles/
    globals.css
    variables.css
  components/
    PollCard.tsx
    PollCard.css
    VoteOption.tsx
    VoteOption.css
  pages/
    PollPage.tsx
    PollPage.css
```

You do not have to use this exact structure, but keep styles close to the component/page they belong to.

### Steps

- [ ] Create CSS variables in `:root` for the main design tokens:
  - background
  - surface/card background
  - text
  - muted text
  - primary action color
  - border color
  - success/error colors
  - spacing values
  - border radius
  - shadow
- [ ] Replace Tailwind class strings with meaningful CSS class names such as:
  - `.poll-card`
  - `.vote-option`
  - `.vote-option--selected`
  - `.primary-button`
  - `.error-message`
  - `.results-grid`
- [ ] Move responsive behavior into normal `@media` queries.
- [ ] Keep hover, focus, disabled, loading, selected, success, and error states in CSS.
- [ ] Avoid inline style objects unless a value must truly be calculated at runtime.
- [ ] Search the project for remaining Tailwind utility classes.
- [ ] Remove Tailwind imports/directives from the main CSS file.
- [ ] Remove Tailwind/PostCSS config that exists only for Tailwind.
- [ ] Remove Tailwind-related packages from `package.json` after the migration is complete.
- [ ] Run the app and compare the main pages before/after so the migration does not accidentally break spacing or responsiveness.

### UX Rules for the CSS Pass

- [ ] Use consistent spacing instead of random pixel values everywhere.
- [ ] Keep buttons at least comfortable for touch on mobile.
- [ ] Use a clear visual hierarchy for poll title, options, actions, and results.
- [ ] Keep forms and poll cards readable around 375px width.
- [ ] Add visible keyboard focus styles with `:focus-visible`.
- [ ] Respect `prefers-reduced-motion` if animations/transitions are added.

### Done When

- No Tailwind classes remain in JSX/TSX.
- Tailwind is no longer required to build the project.
- The main pages still look correct on desktop and mobile.
- Styling is understandable by reading normal CSS files.


## Task 13 – Add Production Security Headers

**Priority:** P1  
**Estimate:** 30–45 min

### Goal

Add basic browser protections at the Vercel/static hosting layer.

### Headers

Configure sensible values for:

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy`
- [ ] `Permissions-Policy`
- [ ] `Content-Security-Policy`
- [ ] `Strict-Transport-Security` when the production site is HTTPS-only

### CSP Notes

Allow only the origins LiveVote really needs, including the Supabase HTTPS/WebSocket endpoints. Do not blindly use `*`.

### Done When

The production site still loads Supabase/realtime correctly and browser security headers are visible in DevTools Network responses.

---

## Task 14 – Environment & Logging Cleanup

**Priority:** P1  
**Estimate:** 30 min

### Steps

- [ ] Keep `.env`, `.env.local`, and production secrets out of Git.
- [ ] Prefer Supabase's current **publishable key** in frontend code (`sb_publishable_...`). If the project still uses the legacy `anon` key, plan the small migration now; never replace it with a secret/service-role key in the browser.
- [ ] Keep an `.env.example` containing names only, never real values.
- [ ] Validate required Vite environment variables at startup.
- [ ] Fail with a useful developer error if Supabase URL/key is missing.
- [ ] Remove noisy production `console.log` statements.
- [ ] Keep useful `console.error` messages for unexpected failures, without printing secrets or full sensitive payloads.

### Done When

A fresh developer knows which env variables are required without receiving any real secret.

---

## Task 15 – Add Small, High-Value Tests

**Priority:** P1  
**Estimate:** 1–1.5 hr

Do not build a huge test suite. Test the risky paths.

### Minimum Automated Tests

- [ ] Poll validation rejects fewer than 2 options.
- [ ] Poll validation rejects duplicate/blank options.
- [ ] Percentage calculation handles 0 votes.
- [ ] Vote button is disabled while submitting.
- [ ] Closed poll does not show an enabled vote action.

### Manual Security Tests

- [ ] Try deleting/updating a poll through the anon Supabase client.
- [ ] Try voting twice using the same `voter_id`.
- [ ] Try voting for an option from a different poll.
- [ ] Try voting after poll expiration.
- [ ] Try very long titles/options.
- [ ] Try HTML/script-looking text such as `<script>alert(1)</script>` and confirm it renders as text, not code.

---

## Task 16 – Final Production Checklist

**Priority:** P0  
**Estimate:** 45 min

### Build

- [ ] `npm run build` passes.
- [ ] TypeScript has no errors.
- [ ] Lint passes, if linting is configured.
- [ ] No secrets are present in Git-tracked files.

### User Flow

Test from a fresh/incognito browser:

1. [ ] Open/create a poll.
2. [ ] Share the poll URL.
3. [ ] Open it from another browser/device profile.
4. [ ] Select an option.
5. [ ] Submit a vote.
6. [ ] Verify realtime result update.
7. [ ] Refresh and confirm the browser's vote state behaves correctly.
8. [ ] Close/expire the poll.
9. [ ] Verify new votes are rejected.
10. [ ] Confirm results still display.

### Failure Flow

- [ ] Turn the network offline and verify a friendly error appears.
- [ ] Restore the network and Retry works.
- [ ] Invalid poll ID shows Not Found instead of an infinite loader.

---

# Suggested 2-Day Schedule

## Day 1 – ~7.5 hours

| Time | Task |
|---|---|
| 0:00–0:45 | Task 0 – Data-flow/security audit |
| 0:45–2:30 | Task 1 – Supabase RLS |
| 2:30–3:45 | Task 2 – Anonymous voter ID + unique constraint |
| 3:45–4:45 | Task 3 – Atomic vote operation |
| 4:45–5:45 | Task 4 – Validation + DB constraints |
| 5:30–6:20 | Task 5 – Poll close/expiration |
| 6:20–7:10 | Task 5.1 – Result visibility controls |
| 7:10–7:30 | Task 6 – Indexes + quick regression test |

## Day 2 – ~8 hours

| Time | Task |
|---|---|
| 0:00–1:15 | Task 7 – Voting interaction |
| 1:15–2:15 | Task 8 – UI states |
| 2:15–3:00 | Task 9 – Share/QR |
| 3:00–4:00 | Task 10 – Results UI |
| 4:00–4:45 | Task 11 – Realtime cleanup |
| 4:30–5:15 | Task 12 – Accessibility/mobile |
| 5:15–6:45 | Task 12.1 – Replace Tailwind with plain CSS |
| 6:45–7:15 | Tasks 13–14 – Headers + env cleanup |
| 7:15–8:00 | Tasks 15–16 – Tests + final production pass |

---

# Recommended Feature Backlog After the 2-Day Sprint

These are useful additions, but **do not include them unless the core sprint finishes early**.

## P2 – Poll Creator Management

- Creator-only edit/delete/close controls.
- Use Supabase Auth or a secure server-side creator token strategy.
- Never protect admin actions only by hiding frontend buttons.

## P2 – Poll Settings

- Allow vote changes: yes/no.
- Expiration date.
- Maximum options.
- Optional poll description.

## P2 – Better Social Preview

Add title/description/Open Graph metadata so shared poll links look better in messaging apps.

## P2 – Basic Privacy Controls

- Public poll.
- Unlisted poll accessible only through its link.

Avoid claiming an unlisted URL is strong authentication. It is only link-based access.

## P2 – Lightweight Analytics

Show the poll creator:

- total votes
- created date
- closed date
- participation over time

Do not store unnecessary personal voter data just for analytics.

---

# Definition of Done for This Sprint

The sprint is complete when all **P0** tasks and most **P1** tasks pass these conditions:

- [ ] No privileged Supabase secret is exposed to the browser.
- [ ] RLS prevents unauthorized direct writes.
- [ ] Duplicate votes are blocked at the database level for the same anonymous browser identity.
- [ ] Poll/option relationships are validated by the database.
- [ ] Closed/expired polls reject votes at the data layer.
- [ ] Result visibility (`always`, `after_vote`, `after_close`) behaves correctly.
- [ ] Inputs are validated and bounded.
- [ ] Loading/error/empty/not-found/closed states exist.
- [ ] Realtime subscriptions are cleaned up.
- [ ] Voting works well on mobile.
- [ ] Tailwind is removed and the UI uses plain CSS files.
- [ ] Share/copy feedback works.
- [ ] Production build passes.
- [ ] No secrets are committed.
- [ ] Manual security checklist passes.

---

# Commit Strategy

Keep commits small enough to understand and revert:

```text
chore: audit supabase access and env config
security: add rls policies for polls options and votes
fix: prevent duplicate anonymous votes
fix: make vote write atomic
feat: add poll close and expiration state
feat: add result visibility modes
ux: improve vote loading error and success states
ux: improve results sharing and mobile layout
refactor: replace tailwind styles with plain css
security: add production response headers
test: cover poll validation and vote states
chore: run final production cleanup
```

This makes the work easier to review and gives each change a clear purpose.
