import { mount } from 'svelte'
import { registerSW } from 'virtual:pwa-register'
import './app.css'
import App from './App.svelte'

// Keep the installed app up to date; auto-applies new versions.
registerSW({ immediate: true })

// Ask the browser not to evict our local IndexedDB data.
void navigator.storage?.persist?.()

const target = document.getElementById('app')
if (!target) throw new Error('Missing #app mount point')

const app = mount(App, { target })

export default app
