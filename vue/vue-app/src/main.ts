import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'   // ✅ no "/index"

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import App from './App.vue'
import router from './router'

const app = createApp(App);
app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura, // swap to imported theme you like
    options: {
      darkModeSelector: '.app-dark', // optional dark toggle
    },
  },
})

app.mount('#app')
