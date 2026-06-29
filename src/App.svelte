<script lang="ts">
  import QuickLog from './components/QuickLog.svelte';
  import EventForm from './components/EventForm.svelte';
  import EventList from './components/EventList.svelte';
  import ExportImport from './components/ExportImport.svelte';
  import { refresh } from './lib/store.svelte';

  // Load events on mount.
  refresh();
</script>

<main>
  <header>
    <h1>trick-track</h1>
  </header>

  <section class="panel">
    <QuickLog />
  </section>

  <section class="panel">
    <EventForm />
  </section>

  <section class="panel">
    <EventList />
  </section>

  <footer>
    <ExportImport />
  </footer>
</main>

<style>
  main {
    max-width: 32rem;
    margin: 0 auto;
    padding: calc(1rem + env(safe-area-inset-top)) 1rem calc(2rem + env(safe-area-inset-bottom));
  }
  header {
    margin-bottom: 1.25rem;
  }
  /* Wordmark as a logbook stamp; twin amber rule underneath echoes the rail icon. */
  header h1 {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    margin: 0;
  }
  header h1::after {
    content: '';
    display: block;
    height: 3px;
    margin-top: 0.35rem;
    border-top: 1px solid var(--accent);
    border-bottom: 1px solid var(--accent);
  }
  .panel {
    margin-bottom: 1.5rem;
  }
  footer {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }
</style>
