import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { registerAntd } from './plugins/registerAntd'
import { pinia } from './stores/pinia'
import { useAuthStore } from './stores/auth'
import 'ant-design-vue/dist/reset.css'
import './style.css'

const app = createApp(App)

app.use(pinia)
useAuthStore(pinia).restoreFromStorage()
app.use(router)
registerAntd(app)

app.mount('#app')
