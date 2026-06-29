<script lang="ts">
  import EventFields from './EventFields.svelte';
  import { addEvent } from '../lib/db';
  import { refresh } from '../lib/store.svelte';
  import { toLocalInputValue, fromLocalInputValue } from '../lib/datetime';

  let text = $state('');
  let category = $state('');
  let when = $state(toLocalInputValue(Date.now()));

  const canSubmit = $derived(category.trim().length > 0);

  async function submit(e: Event) {
    e.preventDefault();
    if (!canSubmit) return;
    await addEvent({
      text: text.trim(),
      category: category.trim(),
      timestamp: when ? fromLocalInputValue(when) : Date.now(),
    });
    // Keep the category for quick repeated logging; reset text and stamp now.
    text = '';
    when = toLocalInputValue(Date.now());
    await refresh();
  }
</script>

<form class="form" onsubmit={submit}>
  <EventFields bind:category bind:text bind:when />
  <button type="submit" class="primary" disabled={!canSubmit}>Add event</button>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
