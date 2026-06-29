<script lang="ts">
  import { groupBy } from 'es-toolkit';
  import { store, refresh, prefillCategory } from '../lib/store.svelte';
  import { addEvent } from '../lib/db';
  import { categoryColor } from '../lib/color';

  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // ~last 30 days
  const LONG_PRESS_MS = 450;

  // Top categories by recent frequency, tiebroken by most-recent use.
  const top = $derived.by(() => {
    const now = Date.now();
    const recent = store.events.filter((e) => now - e.timestamp <= WINDOW_MS);
    return Object.entries(groupBy(recent, (e) => e.category))
      .map(([category, evs]) => ({
        category,
        count: evs.length,
        last: Math.max(...evs.map((e) => e.timestamp)),
      }))
      .sort((a, b) => b.count - a.count || b.last - a.last)
      .slice(0, 4)
      .map((s) => s.category);
  });

  // Tap logs the category instantly (now, empty note); long-press prefills the form.
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressed = false;

  function startPress(category: string) {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      prefillCategory(category);
    }, LONG_PRESS_MS);
  }

  function endPress() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  async function onClick(category: string) {
    if (longPressed) {
      longPressed = false; // the long-press already prefilled; don't also log
      return;
    }
    await addEvent({ category, text: '', timestamp: Date.now() });
    await refresh();
  }
</script>

{#if top.length > 0}
  <div class="quicklog">
    {#each top as c (c)}
      <button
        type="button"
        onpointerdown={() => startPress(c)}
        onpointerup={endPress}
        onpointerleave={endPress}
        onpointercancel={endPress}
        onclick={() => onClick(c)}
      >
        <span class="dot" style="background:{categoryColor(c)}"></span>{c}
      </button>
    {/each}
  </div>
{/if}

<style>
  .quicklog {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    color: var(--text);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 0.5rem 0.9rem;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }
  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex: none;
  }
</style>
