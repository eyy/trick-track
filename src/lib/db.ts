import Dexie, { type EntityTable } from 'dexie';
import { countBy, uniqBy } from 'es-toolkit';
import type { TrackedEvent } from './types';

const db = new Dexie('event-tracker') as Dexie & {
  events: EntityTable<TrackedEvent, 'id'>;
};

db.version(1).stores({
  // ++id = auto-increment PK; timestamp & category indexed for sorting/filtering.
  events: '++id, timestamp, category',
});

export { db };

export function addEvent(event: Omit<TrackedEvent, 'id'>): Promise<number> {
  return db.events.add(event);
}

export function updateEvent(
  id: number,
  changes: Pick<TrackedEvent, 'category' | 'text' | 'timestamp'>,
): Promise<number> {
  return db.events.update(id, changes);
}

export function deleteEvent(id: number): Promise<void> {
  return db.events.delete(id);
}

/** Copy an event's category + text into a new row stamped now. */
export function duplicateEvent(event: TrackedEvent): Promise<number> {
  return addEvent({ category: event.category, text: event.text, timestamp: Date.now() });
}

export function allEventsNewestFirst(): Promise<TrackedEvent[]> {
  return db.events.orderBy('timestamp').reverse().toArray();
}

/** Distinct categories used so far, alphabetised, for the pick-or-new datalist. */
export async function distinctCategories(): Promise<string[]> {
  const keys = await db.events.orderBy('category').uniqueKeys();
  return keys.map(String).filter((c) => c.length > 0);
}

/** Most-used note texts for a category, kept only if seen at least `minCount` times.
 *  Used to suggest free-text completions once a category is chosen. */
export async function commonTexts(category: string, limit = 4, minCount = 3): Promise<string[]> {
  if (!category) return [];
  const events = await db.events.where('category').equals(category).toArray();
  const texts = events.map((e) => e.text.trim()).filter((t) => t.length > 0);
  const counts = countBy(texts, (t) => t);
  return Object.entries(counts)
    .filter(([, n]) => n >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

// Stable identity for an event's content, used to dedupe merge-imports. Two events
// with the same instant + category + text are treated as the same record.
type EventContent = Omit<TrackedEvent, 'id'>;
const contentKey = (e: EventContent) => `${e.timestamp}|${e.category}|${e.text}`;

export async function exportJson(): Promise<string> {
  const events = await db.events.orderBy('timestamp').toArray();
  // Export content only; ids are device-local and reassigned on import.
  const items: EventContent[] = events.map(({ timestamp, category, text }) => ({
    timestamp,
    category,
    text,
  }));
  return JSON.stringify({ version: 1, events: items }, null, 2);
}

/** Import events from an export blob. mode 'replace' clears existing data first;
 *  'merge' appends, skipping rows already present so re-importing is idempotent. */
export async function importJson(json: string, mode: 'merge' | 'replace'): Promise<number> {
  const parsed = JSON.parse(json);
  const incoming = Array.isArray(parsed) ? parsed : parsed?.events;
  if (!Array.isArray(incoming)) throw new Error('Unrecognised file: no events array.');

  const rows: EventContent[] = incoming.map((raw) => {
    const timestamp = Number(raw?.timestamp);
    if (!Number.isFinite(timestamp)) throw new Error('Invalid or missing timestamp in import.');
    return { timestamp, category: String(raw?.category ?? ''), text: String(raw?.text ?? '') };
  });

  return db.transaction('rw', db.events, async () => {
    if (mode === 'replace') await db.events.clear();
    let toAdd = rows;
    if (mode === 'merge') {
      // Drop rows already in the DB, then collapse duplicates within this same file.
      const existing = new Set((await db.events.toArray()).map(contentKey));
      toAdd = uniqBy(
        rows.filter((r) => !existing.has(contentKey(r))),
        contentKey,
      );
    }
    await db.events.bulkAdd(toAdd);
    return toAdd.length;
  });
}
