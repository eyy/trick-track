# AGENTS.md

trick-track — a small personal PWA to track events. Installable on iPhone (home-screen,
standalone, offline). Data is local-only in IndexedDB (via Dexie); there is no backend.

## What it does (features)

- Each event has a **timestamp** (defaults to now, editable), a **category** (pick an existing
  one from a datalist or type a new one), and a free-text **note**.
- Main view is a single **chronological** list of all events — newest first, with **day
  subheaders**. No filtering.
- Per-row actions: **Edit** (inline), **Duplicate** (copies category + note, stamped now),
  **Delete** (immediate, with an **Undo** snackbar to restore for ~5s).
- **Quick-log**: top categories by recent use (last ~30 days, max 4) shown as one-tap buttons
  that log instantly (now, empty note).
- Once a category is chosen, the form **suggests free-text completions** — notes used ≥3× in
  that category — as tap-to-fill chips (refreshed live as events change).
- **Per-category color**: a deterministic color dot per category name (no picker).
- **JSON export / import** for backup: replace clears first; merge is idempotent (content-key dedup).
- Requests **persistent storage** (`navigator.storage.persist()`) so the browser is less likely
  to evict the local data.
- App icon is "tt" on a train track (`public/logo.svg`).

## Product preferences

- **Dark-mode only** — no light theme.
- **Minimalist, utilitarian** design: flat separated rows, plain text buttons, minimal chrome.
- Visual identity is a **logbook / departures-board**: cool-ink surfaces, a single **signal-amber**
  accent (`--accent`), **monospace tabular** times + day labels + wordmark (`--font-mono`), and a
  curated muted categorical palette for dots (`src/lib/color.ts`). Derive colors/type from the
  `:root` tokens; spend boldness only on the amber accent.
- **CSS scoped to its component** as much as possible. `app.css` holds only the design tokens
  (`:root`) and the body reset — no global element styling.
- Local-first; cloud sync is a possible future, kept behind the `db.ts` data layer.
- Ships to a **private GitHub repo** with a minimal "vibecoded" README (not yet pushed).
- Possible future (not built): note search, CSV export, stats / calendar heatmap, cloud sync.

## After making changes — always run

```sh
bun run check    # type-check: svelte-check + tsc
bun run lint     # eslint (Svelte- and TS-aware)
```

Both must pass clean. If you touched the build/PWA config, manifest, or icons, also run
`bun run build` to confirm the service worker and icons still generate.

## End-to-end tests

A Playwright (Chromium) e2e suite in `e2e/` covers every user story (add, edit,
duplicate, delete-with-confirm, day grouping/ordering, default-now vs. edited
timestamps, free-text suggestions, JSON export/import round-trip + idempotent merge,
and persistence across reload).

```sh
bun run test:e2e   # playwright test — auto-starts the Vite dev server
```

It runs against the **dev** server (not the PWA preview build, whose service worker
caches aggressively and causes stale-state flakiness). Each test starts from a clean
IndexedDB (`event-tracker` is deleted + reloaded in a `beforeEach`). Keep the suite
**green**, and extend it whenever you change user-facing behavior.

## Stack & conventions

- **Svelte 5 (runes)** — use `$state`, `$derived`, `$props`, `$bindable`. No legacy stores/`$:`.
- **Vite** + **vite-plugin-pwa** (`registerType: 'autoUpdate'`); icons generated from `public/logo.svg`.
- **Dexie** for IndexedDB. All DB access goes through `src/lib/db.ts` — don't query Dexie from components.
- Shared reactive state lives in `src/lib/store.svelte.ts`; call `refresh()` after any mutation.
- **TypeScript:** avoid `as` casts and non-null `!`; fix the type instead.
- **Functional style over `for` loops** — prefer `map`/`filter`/`reduce` and **es-toolkit**
  helpers (`groupBy`, `countBy`, `uniqBy`, …) over imperative iteration.
- Package manager is **Bun**.

## Layout

- `src/lib/` — `db.ts` (data layer), `store.svelte.ts` (reactive state), `types.ts`, `datetime.ts`.
- `src/components/` — `EventForm`, `EventFields` (shared add/edit fields + suggestions),
  `EventList`, `CategorySelect`, `ExportImport`.
- `src/App.svelte` — composition root.
