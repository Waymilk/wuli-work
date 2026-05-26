import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerAntd } from './plugins/registerAntd'
import 'ant-design-vue/dist/reset.css'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
registerAntd(app)

app.mount('#app')
