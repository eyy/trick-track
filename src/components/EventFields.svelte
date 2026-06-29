<script lang="ts">
  import CategorySelect from './CategorySelect.svelte';
  import { toLocalInputValue, fromLocalInputValue, timeAgo } from '../lib/datetime';
  import { commonTexts } from '../lib/db';
  import { store } from '../lib/store.svelte';

  let {
    category = $bindable(''),
    text = $bindable(''),
    when = $bindable(''),
    inputEl = $bindable<HTMLInputElement | undefined>(undefined),
    onSubmit,
  }: {
    category?: string;
    text?: string;
    when?: string;
    inputEl?: HTMLInputElement;
    onSubmit?: () => void;
  } = $props();

  // Once a category is chosen, suggest its frequently-used notes (seen >= 3x).
  let suggestions = $state<string[]>([]);
  $effect(() => {
    const c = category.trim();
    void store.events; // re-run after events change (add/edit/delete) so suggestions stay live
    let cancelled = false;
    commonTexts(c).then((s) => {
      if (!cancelled) suggestions = s;
    });
    return () => {
      cancelled = true;
    };
  });

  // Category hint: for an exact match show when it was last logged; otherwise, if an
  // existing category differs only by case/spacing, nudge toward it ("did you mean?").
  const hint = $derived.by(() => {
    const c = category.trim();
    if (!c) return null;
    if (store.categories.includes(c)) {
      const last = store.events.find((e) => e.category === c);
      return last ? ({ kind: 'last', at: last.timestamp } as const) : null;
    }
    const lc = c.toLowerCase();
    const near = store.categories.find((x) => x.toLowerCase() === lc);
    return near ? ({ kind: 'didYouMean', category: near } as const) : null;
  });

  function resetToNow() {
    when = toLocalInputValue(Date.now());
  }

  // Nudge the timestamp back from its current value (or now if empty).
  function nudge(deltaMs: number) {
    const base = when ? fromLocalInputValue(when) : Date.now();
    when = toLocalInputValue(base - deltaMs);
  }

  function onNoteKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  }
</script>

<label class="field">
  <span class="label">Category</span>
  <CategorySelect bind:value={category} bind:inputEl />
</label>

{#if hint?.kind === 'last'}
  <p class="hint">last logged {timeAgo(hint.at)}</p>
{:else if hint?.kind === 'didYouMean'}
  <p class="hint">
    did you mean
    <button type="button" class="hint-link" onclick={() => (category = hint.category)}>
      {hint.category}
    </button>?
  </p>
{/if}

<label class="field">
  <span class="label">Note</span>
  <textarea
    bind:value={text}
    rows="2"
    placeholder="What happened?"
    onkeydown={onNoteKeydown}
  ></textarea>
  {#if suggestions.length > 0}
    <div class="suggestions">
      {#each suggestions as s (s)}
        <button type="button" class="chip" onclick={() => (text = s)}>{s}</button>
      {/each}
    </div>
  {/if}
</label>

<label class="field">
  <span class="label">
    When
    <span class="when-actions">
      <button type="button" class="link" onclick={() => nudge(60 * 60_000)}>-1h</button>
      <button type="button" class="link" onclick={() => nudge(15 * 60_000)}>-15m</button>
      <button type="button" class="link" onclick={resetToNow}>now</button>
    </span>
  </span>
  <input type="datetime-local" bind:value={when} />
</label>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .when-actions {
    display: flex;
    gap: 0.3rem;
  }
  .link {
    background: none;
    border: none;
    color: var(--accent);
    font: inherit;
    font-size: 0.8rem;
    padding: 0.3rem 0.4rem;
    cursor: pointer;
  }
  .hint {
    margin: -0.1rem 0 0;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .hint-link {
    background: none;
    border: none;
    color: var(--accent);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.1rem 0.3rem;
    cursor: pointer;
  }
  textarea,
  input[type='datetime-local'] {
    width: 100%;
    padding: 0.55rem 0.7rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    color: var(--text);
    font: inherit;
  }
  textarea {
    resize: vertical;
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }
  .chip {
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    color: var(--muted);
    background: none;
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 0.35rem 0.7rem;
  }
</style>
