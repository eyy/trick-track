<script lang="ts">
  import { exportJson, importJson } from '../lib/db';
  import { refresh, store } from '../lib/store.svelte';

  let replace = $state(false);
  let fileInput: HTMLInputElement;
  let status = $state('');

  async function onExport() {
    const json = await exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trick-track-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile() {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const count = await importJson(await file.text(), replace ? 'replace' : 'merge');
      await refresh();
      status = `Imported ${count} event${count === 1 ? '' : 's'}.`;
    } catch (err) {
      status = `Import failed: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      fileInput.value = '';
    }
  }
</script>

<div class="io">
  <button type="button" onclick={onExport} disabled={store.events.length === 0}>
    Export JSON
  </button>

  <label class="import">
    <input
      bind:this={fileInput}
      type="file"
      accept="application/json,.json"
      onchange={onImportFile}
    />
    <span class="btn">Import JSON</span>
  </label>

  <label class="replace">
    <input type="checkbox" bind:checked={replace} />
    Replace existing
  </label>
</div>
{#if status}<p class="status">{status}</p>{/if}

<style>
  .io {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }
  button {
    cursor: pointer;
    border-radius: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .import input[type='file'] {
    display: none;
  }
  .import .btn {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--card);
    color: var(--text);
    cursor: pointer;
  }
  .replace {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--muted);
  }
  .status {
    margin: 0.6rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
