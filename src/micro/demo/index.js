import Layout from '@/components/layout/layout'
import RouterView from '@/components/layout/RouterView'
import store from '@/store'
import { isMicroActive } from '../util'

let microAppHasLoaded= false
export async function initRoute() {
  return [
    {
      path: '/micro',
      name: 'micro-demo',
      component: Layout,
      alwaysShow: true,
      meta: {
        title: '微前端Demo',
        isMicro: true,
      },
      children: [
        {
          path: 'team-system',
          name: 'team-system',
          component: RouterView,
          meta: {
            title: '班组管理',
            isMicro: true
          }
        }
      ]
    }
  ]
}

export function initMicroGlobalState() {
  return {}
}

export const esdRoutePrefixs = [
  'about'
]

export function initAppConfig() {
  return {
    name: 'qk_demo',
    title:'demo演示',
    entry: 'http://localhost:8090/qk_child/',
    activeRule: (location,exact = false)=>{
      if(store.state.app.microApps.error['qk_demo'] && !exact) return false
      if(microAppHasLoaded && !exact) return true
      const flag = isMicroActive(location,esdRoutePrefixs)
      console.log('activeRule已匹配-qkdemo',flag);
      if(flag) microAppHasLoaded = true
      return flag
    }
  }
}
