import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import "bootstrap-icons/font/bootstrap-icons.css";

const app = createApp(App)
app.use(router)
app.use(ArcoVue)
app.use(store)
app.mount('#app')