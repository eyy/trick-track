<script lang="ts">
  import { groupBy } from 'es-toolkit';
  import { store, refresh } from '../lib/store.svelte';
  import { addEvent, deleteEvent, duplicateEvent, updateEvent } from '../lib/db';
  import { dayLabel, timeLabel, toLocalInputValue, fromLocalInputValue } from '../lib/datetime';
  import { categoryColor } from '../lib/color';
  import type { TrackedEvent } from '../lib/types';
  import EventFields from './EventFields.svelte';

  // Row currently being edited (one at a time).
  let editingId = $state<number | null>(null);
  let editCategory = $state('');
  let editText = $state('');
  let editWhen = $state('');

  // Recently deleted events, kept until ~5s after the LAST delete (the window rolls
  // forward on each delete). Deletes accumulate; one Undo restores the whole batch.
  let pendingDeleted = $state<TrackedEvent[]>([]);
  let undoTimer: ReturnType<typeof setTimeout> | null = null;

  // Group the (already newest-first) events into day buckets. Input is sorted by time
  // desc, so each day's events are contiguous and groupBy preserves their order.
  const groups = $derived.by(() =>
    Object.entries(groupBy(store.events, (e) => dayLabel(e.timestamp))).map(
      ([label, events]) => ({ label, events }),
    ),
  );

  function startEdit(e: TrackedEvent) {
    editingId = e.id;
    editCategory = e.category;
    editText = e.text;
    editWhen = toLocalInputValue(e.timestamp);
  }

  function cancelEdit() {
    editingId = null;
  }

  async function saveEdit(e: TrackedEvent) {
    if (!editCategory.trim()) return;
    await updateEvent(e.id, {
      category: editCategory.trim(),
      text: editText.trim(),
      timestamp: editWhen ? fromLocalInputValue(editWhen) : e.timestamp,
    });
    editingId = null;
    await refresh();
  }

  async function onDuplicate(e: TrackedEvent) {
    await duplicateEvent(e);
    await refresh();
  }

  async function onDelete(e: TrackedEvent) {
    await deleteEvent(e.id);
    pendingDeleted = [...pendingDeleted, e];
    await refresh();
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      pendingDeleted = [];
      undoTimer = null;
    }, 5000);
  }

  async function undoDelete() {
    if (pendingDeleted.length === 0) return;
    if (undoTimer) {
      clearTimeout(undoTimer);
      undoTimer = null;
    }
    // Re-add the batch (each gets a fresh id), preserving original times.
    const toRestore = pendingDeleted;
    pendingDeleted = [];
    await Promise.all(
      toRestore.map((e) =>
        addEvent({ category: e.category, text: e.text, timestamp: e.timestamp }),
      ),
    );
    await refresh();
  }
</script>

{#if store.events.length === 0}
  <p class="empty">{store.loaded ? 'No events yet.' : 'Loading…'}</p>
{:else}
  {#each groups as group (group.label)}
    <section class="day">
      <h2 class="day-label">{group.label}</h2>
      <ul>
        {#each group.events as e (e.id)}
          <li class="event">
            {#if editingId === e.id}
              <div class="edit">
                <EventFields
                  bind:category={editCategory}
                  bind:text={editText}
                  bind:when={editWhen}
                  onSubmit={() => saveEdit(e)}
                />
                <div class="actions">
                  <button class="primary" onclick={() => saveEdit(e)} disabled={!editCategory.trim()}>
                    Save
                  </button>
                  <button onclick={cancelEdit}>Cancel</button>
                </div>
              </div>
            {:else}
              <div class="row">
                <span class="time">{timeLabel(e.timestamp)}</span>
                <span class="dot" style="background:{categoryColor(e.category)}"></span>
                <span class="category">{e.category}</span>
                {#if e.text}<span class="text">{e.text}</span>{/if}
                <span class="actions">
                  <button class="icon" aria-label="Edit" onclick={() => startEdit(e)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button class="icon" aria-label="Duplicate" onclick={() => onDuplicate(e)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                  </button>
                  <button class="icon danger" aria-label="Delete" onclick={() => onDelete(e)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                    </svg>
                  </button>
                </span>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{/if}

{#if pendingDeleted.length > 0}
  <div class="snackbar" role="status">
    <span>{pendingDeleted.length === 1 ? 'Deleted' : `Deleted ${pendingDeleted.length}`}</span>
    <button onclick={undoDelete}>Undo</button>
  </div>
{/if}

<style>
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 2rem 0;
  }
  .day {
    margin-bottom: 1.25rem;
  }
  .day-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin: 0 0 0.3rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* One compact line per event, no rules between them. */
  .event {
    padding: 0.3rem 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }
  .time {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    font-size: 0.85rem;
    letter-spacing: -0.02em;
    flex: none;
  }
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    flex: none;
  }
  .category {
    font-weight: 600;
    white-space: nowrap;
    flex: none;
  }
  /* Note fills the middle and ellipsises so the row stays a single line. */
  .text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted);
  }
  /* Bordered panel, matching the add form, so an in-progress edit reads as one group. */
  .edit {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
  }
  .actions {
    display: flex;
    align-items: center;
  }
  .row .actions {
    margin-left: auto;
    flex: none;
    gap: 0.1rem;
  }
  .edit .actions {
    margin-top: 0.2rem;
    gap: 0.5rem;
  }
  /* Touch device: static states (no hover/focus reveals), generous tap padding. */
  .actions button {
    cursor: pointer;
    background: none;
    border: none;
    color: var(--muted);
    font: inherit;
    font-size: 0.85rem;
    padding: 0.45rem 0.55rem;
  }
  /* Icon action buttons (row) — square, compact, tappable. */
  .actions .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem;
  }
  .actions .icon svg {
    width: 1.25rem;
    height: 1.25rem;
    display: block;
  }
  .actions .primary {
    color: var(--accent);
    font-weight: 600;
  }
  .actions .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .actions .danger {
    color: var(--danger);
  }
  .snackbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(1rem + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  .snackbar button {
    cursor: pointer;
    background: none;
    border: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    margin: -0.3rem -0.3rem -0.3rem 0;
  }
</style>
