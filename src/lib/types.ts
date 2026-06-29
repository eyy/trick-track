export interface TrackedEvent {
  id: number; // auto-assigned by Dexie; omitted on insert (see addEvent)
  timestamp: number; // epoch ms; defaults to Date.now() on create
  category: string;
  text: string;
}
