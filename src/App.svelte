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
    <img class="logo" src="{import.meta.env.BASE_URL}logo.svg" alt="" />
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
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 1.25rem;
  }
  /* Reuses public/logo.svg (also the PWA-icon source); its ink tile blends into the page. */
  .logo {
    width: 1.7rem;
    height: 1.7rem;
    flex: none;
  }
  header h1 {
    font-family: var(--font-mono);
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    margin: 0;
  }
  .panel {
    margin-bottom: 1.5rem;
  }
  footer {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }
</style>
