<script lang="ts">
  import { store } from '../lib/store.svelte';

  let {
    value = $bindable(''),
    inputEl = $bindable<HTMLInputElement | undefined>(undefined),
  }: { value?: string; inputEl?: HTMLInputElement } = $props();
</script>

<input
  bind:this={inputEl}
  class="category-input"
  list="category-options"
  bind:value
  placeholder="Category"
  autocomplete="off"
  autocapitalize="none"
/>
<datalist id="category-options">
  {#each store.categories as c (c)}
    <option value={c}></option>
  {/each}
</datalist>

<style>
  .category-input {
    width: 100%;
    padding: 0.55rem 0.7rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    color: var(--text);
    font: inherit;
  }
</style>
