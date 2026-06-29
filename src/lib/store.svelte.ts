import { allEventsNewestFirst, distinctCategories } from './db';
import type { TrackedEvent } from './types';

// Shared reactive state for the event list + known categories.
// Components call refresh() after any mutation to reload from IndexedDB.
export const store = $state({
  events: [] as TrackedEvent[],
  categories: [] as string[],
  loaded: false,
});

export async function refresh(): Promise<void> {
  const [events, categories] = await Promise.all([
    allEventsNewestFirst(),
    distinctCategories(),
  ]);
  store.events = events;
  store.categories = categories;
  store.loaded = true;
}
