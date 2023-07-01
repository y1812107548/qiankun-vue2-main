import Layout from '@/components/layout/layout'
import RouterView from '@/components/layout/RouterView'
import store from '@/store'
import { isMicroActive } from '../util'
let microAppHasLoaded = false

export async function initRoute() {
  return [

  ]
}

export function initMicroGlobalState() {
  return {
    cubeToken:'get token'
  }
}

export const esdRoutePrefixs = [
  'order'
]

export function initAppConfig() {
  return {
    name: 'qk_order',
    title:'工单系统',
    entry: 'http://localhost:8090/qk_child/',
    activeRule: (location, exact = false) => {
      // 如果子应用已经出现了加载异常，则不再显示该页面
      if (store.state.app.microApps.error['qk_order'] && !exact) return false
      if (microAppHasLoaded && !exact) return true

      // TODO 更好的做法是，path to regx 去匹配location
      // const matchedRoutes = cacheRoutes.filter(route => location.href.includes(route.path.split(':')[0]))
      // if (matchedRoutes.length) {
      //   return matchedRoutes.some(route => {
      //     if (route) {
      //       if (route.meta.isMicro) {
      //         microAppHasLoaded = true
      //       }
      //       return route.meta.isMicro
      //     }
      //     return false
      //   })
      // }
      const flag = isMicroActive(location,esdRoutePrefixs)
      console.log('activeRule已匹配-qkorder',flag);
      if(flag) microAppHasLoaded = true
      return flag
    },
    props:{
      getMainStore:()=> store
    }
  }
}
