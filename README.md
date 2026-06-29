# trick-track

A small personal PWA to track events — each has a timestamp, a category, and a note.
Data is stored locally on-device (IndexedDB) with JSON export/import for backup.

Vibecoded with Claude Code.

## Develop

```sh
bun install
bun run dev      # local dev server
bun run check    # type-check
bun run build    # production build into dist/
bun run preview  # serve the production build
```
