import { applySavedOverrides } from '@/theme/theme';
import './assets/tailwind.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import './assets/main.css'
import "/node_modules/@fortawesome/fontawesome-free/css/all.min.css";


import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useRightsStore } from './stores/rights'


const app = createApp(App)
library.add(fas)
app.component('font-awesome-icon', FontAwesomeIcon)
const pinia = createPinia()
app.use(pinia)
app.use(router)

applySavedOverrides();
const rights = useRightsStore(pinia)
rights.hydrateFromSession()
app.mount('#app')

