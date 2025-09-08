import { createRouter, createWebHistory } from 'vue-router'
import MicroLatentSpace from "../views/MicroLatentSpace.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'MicroLatentSpace',
      component: MicroLatentSpace
    }
  ]
})

export default router