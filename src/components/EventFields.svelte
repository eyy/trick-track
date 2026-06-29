<script lang="ts">
  import CategorySelect from './CategorySelect.svelte';
  import { toLocalInputValue } from '../lib/datetime';
  import { commonTexts } from '../lib/db';
  import { store } from '../lib/store.svelte';

  let {
    category = $bindable(''),
    text = $bindable(''),
    when = $bindable(''),
  }: { category?: string; text?: string; when?: string } = $props();

  // Once a category is chosen, suggest its frequently-used notes (seen >= 3x).
  let suggestions = $state<string[]>([]);
  $effect(() => {
    const c = category.trim();
    void store.events.length; // re-run after events change so suggestions stay live
    let cancelled = false;
    commonTexts(c).then((s) => {
      if (!cancelled) suggestions = s;
    });
    return () => {
      cancelled = true;
    };
  });

  function resetToNow() {
    when = toLocalInputValue(Date.now());
  }
</script>

<label class="field">
  <span class="label">Category</span>
  <CategorySelect bind:value={category} />
</label>

<label class="field">
  <span class="label">Note</span>
  <textarea bind:value={text} rows="2" placeholder="What happened?"></textarea>
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
    <button type="button" class="link" onclick={resetToNow}>now</button>
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
  .link {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 0.8rem;
    padding: 0;
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
    padding: 0.2rem 0.6rem;
  }
</style>
