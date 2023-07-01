import store from '@/store'

/**
 * 如果是子应用，不再使用路由内容动态加载
 * @param routes
 * @param mainMenus
 * @param routePrefixs
 */
export const isMicroAppRoute = function(routes = [], mainMenus = [], routePrefixs = []) {
  routes.forEach(route => {
    const isMicro = route.meta.auth ? routePrefixs.some(prefix => route.meta.auth.startsWith(prefix)) : false
    if (isMicro) {
      route.component = null
      route.meta.isMicro = true
    }
  })

  mainMenus.forEach(menu => {
    if (!menu.meta) {
      menu.meta = {}
    }
    const isMicro = menu.meta.auth ? routePrefixs.some(prefix => menu.meta.auth.startsWith(prefix)) : false
    // const isMicro = routePrefixs.some(prefix => menu.path.startsWith('/' + prefix))
    if (isMicro) {
      menu.meta.isMicro = true
    }
    if (menu.children && menu.children.length) {
      isMicroAppRoute([], menu.children, routePrefixs)
    }
  })
}

/**
 * 用于判定该路由是否需要激活子应用
 * @param location {Location}
 * @param routes
 * @param authPrefixs
 * @return {boolean|*}
 */
export const isMicroActiveLocation = function(location, routes = [], authPrefixs = []) {
  // TODO 更好的做法是，path to regx 去匹配location
  const matchedRoutes = routes.filter(route => location.href.includes(route.path.split(':')[0]))
  if (matchedRoutes.length) {
    return matchedRoutes.some(route => {
      if (route.meta && route.meta.auth) {
        return authPrefixs.some(prefix => route.meta.auth.startsWith(prefix))
      }
      return false
    })
  }
  return false
}

/**
 * 判定该路由是否需要激活子应用
 * @param location {Location}
 * @param authPrefixs {Array}
 */
export const isMicroActive = function(location, authPrefixs = []) {
  return authPrefixs.some(prefix => {
    return location.hash.startsWith('#/' + prefix)
  })
}

/**
 * 获取一个多容器模式的路由判定函数
 * @return {(function(*=, *=, *=): (boolean|*|boolean))|*}
 */
export const getActiveRuleHandleFunction = function(name, authPrefixs = [], routes = []) {
  let microAppHasLoaded = false

  return function(location, exact = false) {
    // 如果子应用已经出现了加载异常，则不再显示该页面
    if (store.state.app.microApps.error[name] && !exact) {
      return false
    }
    // 已加载的应用始终保持激活状态
    if (microAppHasLoaded && !exact) {
      return true
    }

    const re = isMicroActiveLocation(location, routes, authPrefixs)
    if (re) {
      microAppHasLoaded = true
    }
    return re
  }
}

/**
 * 将路由树展开
 * @param cubeRouters
 * @param flattenRoutes
 * @param parentPath
 */
export const flatRoutes = function(cubeRouters = [], flattenRoutes = [], parentPath = '') {
  cubeRouters.forEach(item => {
    const nextPath = item.path.startsWith('/') ? item.path : `${parentPath}/${item.path}`
    const route = {
      ...item,
      path: nextPath
    }
    flattenRoutes.push(route)
    if (item.children) {
      flatRoutes(item.children, flattenRoutes, nextPath)
    }
  })
}

const microCache = new Map()
/**
 * 给子应用提供一个存储和恢复页面数据的地方
 * @param vm
 */
export const cachePush = function(vm) {
  const data = JSON.stringify(vm.$data)
  microCache.set(vm.name, data)
}
/**
 * 给子应用提供一个存储和恢复页面数据的地方
 * @param vm
 */
export const cachePop = function(vm) {
  if (!microCache.has(vm.name)) {
    return
  }
  const data = JSON.parse(microCache.get(vm.name))
  Object.keys(data).forEach(key => {
    vm.$set(vm, key, data[key])
  })
  microCache.delete(vm.name)
}
