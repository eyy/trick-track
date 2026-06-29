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

  // Most-recently deleted event, kept briefly so the delete can be undone.
  let lastDeleted = $state<TrackedEvent | null>(null);
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
    lastDeleted = e;
    await refresh();
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      lastDeleted = null;
      undoTimer = null;
    }, 5000);
  }

  async function undoDelete() {
    if (!lastDeleted) return;
    if (undoTimer) {
      clearTimeout(undoTimer);
      undoTimer = null;
    }
    // Re-add the same content (gets a fresh id), preserving its original time.
    await addEvent({
      category: lastDeleted.category,
      text: lastDeleted.text,
      timestamp: lastDeleted.timestamp,
    });
    lastDeleted = null;
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
                <EventFields bind:category={editCategory} bind:text={editText} bind:when={editWhen} />
                <div class="actions">
                  <button class="primary" onclick={() => saveEdit(e)} disabled={!editCategory.trim()}>
                    Save
                  </button>
                  <button onclick={cancelEdit}>Cancel</button>
                </div>
              </div>
            {:else}
              <div class="meta">
                <span class="time">{timeLabel(e.timestamp)}</span>
                <span class="dot" style="background:{categoryColor(e.category)}"></span>
                <span class="category">{e.category}</span>
              </div>
              {#if e.text}<p class="text">{e.text}</p>{/if}
              <div class="actions">
                <button onclick={() => startEdit(e)}>Edit</button>
                <button onclick={() => onDuplicate(e)}>Duplicate</button>
                <button class="danger" onclick={() => onDelete(e)}>Delete</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{/if}

{#if lastDeleted}
  <div class="snackbar" role="status">
    <span>Deleted</span>
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
  /* Flat, separated rows — no card chrome. */
  .event {
    padding: 0.6rem 0;
    border-top: 1px solid var(--border);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .time {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    font-size: 0.85rem;
    letter-spacing: -0.02em;
  }
  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex: none;
  }
  .category {
    font-weight: 600;
  }
  .text {
    margin: 0.2rem 0 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .edit {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .actions {
    display: flex;
    gap: 1.1rem;
    align-items: center;
    margin-top: 0.5rem;
  }
  /* Text buttons — minimal, no box. */
  .actions button {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.2rem 0;
    color: var(--muted);
    font: inherit;
    font-size: 0.85rem;
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
    padding: 0;
  }
</style>
