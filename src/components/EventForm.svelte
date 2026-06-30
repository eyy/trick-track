<script lang="ts">
  import { untrack } from 'svelte';
  import EventFields from './EventFields.svelte';
  import { addEvent } from '../lib/db';
  import { refresh, compose } from '../lib/store.svelte';
  import { toLocalInputValue, fromLocalInputValue } from '../lib/datetime';

  let text = $state('');
  let category = $state('');
  let when = $state(toLocalInputValue(Date.now()));
  let categoryEl = $state<HTMLInputElement>();

  const canSubmit = $derived(category.trim().length > 0);

  // A long-pressed quick-log chip prefills the category here. Trigger on the nonce only and
  // read the category untracked, so unrelated reactivity can't yank focus mid-typing.
  $effect(() => {
    void compose.nonce;
    const c = untrack(() => compose.category);
    if (c) {
      category = c;
      categoryEl?.focus();
    }
  });

  async function submit() {
    if (!canSubmit) return;
    await addEvent({
      text: text.trim(),
      category: category.trim(),
      timestamp: when ? fromLocalInputValue(when) : Date.now(),
    });
    // Keep the category for quick repeated logging; reset text, stamp now, refocus.
    text = '';
    when = toLocalInputValue(Date.now());
    await refresh();
    categoryEl?.focus();
  }

  function onFormSubmit(e: Event) {
    e.preventDefault();
    submit();
  }
</script>

<form class="form" onsubmit={onFormSubmit}>
  <EventFields bind:category bind:text bind:when bind:inputEl={categoryEl} onSubmit={submit} />
  <button type="submit" class="primary" disabled={!canSubmit}>Add event</button>
</form>

<style>
  /* Bordered panel so the add form reads as one contained group. */
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
  }
  .primary {
    padding: 0.7rem 1rem;
    background: var(--accent);
    color: var(--accent-ink);
    border: none;
    border-radius: 0.5rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
