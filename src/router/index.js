import Vue from 'vue'
import VueRouter from 'vue-router'
import { constantRouterInfo as routes } from './routeInfo'

Vue.use(VueRouter)

const router = new VueRouter({
  scrollBehavior:()=>({
    y:0
  }),
  routes
})

export default router
