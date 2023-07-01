import router from '@/router';
import store from '@/store';
import InterceptMessage from '@/utils/message-intercept'
import { sleep } from '@/utils'
import { registerMicroApps, start as qiankunStart,initGlobalState,addErrorHandler } from 'qiankun';

const context = require.context('@/micro/',true,/index\.js$/)
const requireAll = context => context.keys().map(context)
const micros = requireAll(context).filter(micro=> micro.initAppConfig)

// 初始化 state
const commonState = {
  token: '19757',
  // 给子项目提供关闭页签的呢能力
  closeCurrentPage: function() {
    console.log('closeCurrentPage');
  },
  logout:function(){
    console.log('logout');
  },
   // 提供子项目操作主项目路由的方法
   routerPush: function(route){
    router.push(route)
   },
   routerReplace: function(route){
    router.replace(route)
   },
}
const actions = initGlobalState(commonState);
actions.onGlobalStateChange((state, prev) => {
  // state: 变更后的状态; prev 变更前的状态
  // console.log(state, prev);
});
actions.offGlobalStateChange();
// 微应用注册
const microAppConfigs = micros.map(micro => {
  const appState = micro.initMicroGlobalState()
  const app = micro.initAppConfig()
  // console.log('appstate',appState);
  app.loader = loading => {
    if(loading){
      store.commit('TOGGLE_MICRO_LOADING', {
        container: app.name,
        loading
      })
    }else{
      // 为了避免加载不全时被切换页面，这里做下延时
      sleep(1000).then(() => {
        store.commit('TOGGLE_MICRO_LOADING', {
          container: app.name,
          loading
        })
      })
      actions.setGlobalState({
        ...commonState,
        [app.name]:appState
      })
    }
  }
  // 保存每个子应用的初始全局状态
  app.appState = appState
  return app
})
console.log('microAppConfigs',microAppConfigs);

const lifeCycles = ()=>{
  return {
    afterMount:()=>{
      // console.log('after-Mount', app.name)
    },
    afterUnmount:()=>{},
    // beforeLoad: (app) => console.log('before load', app.name),
    // beforeMount: [(app) => console.log('before mount', app.name)],
  }
}


/**
 * 批量处理micro 下的微应用入口
 * @param mainRoutes 主应用的所有route
 * @return {[]}
 */
const generateRoutes = function(mainRoutes = [],mainMeans=[]) {
  const re = []
  micros.forEach(async micro => {
    const routes = await micro.initRoute(mainRoutes,mainMeans)
    if (Array.isArray(routes)) {
      re.push(...routes)
    } else {
      re.push(routes)
    }
  })
  return re
}
/**
 * 更新应用全局state，并通知到每个应用
 * @param state
 */
const updateGlobalState = function(state) {
  microAppConfigs.forEach(app => {
    setGlobalState({
      ...globalState,
      ...getTokenState(),
      ...state,
      [app.name]: app.appState
    })
  })
}

/**
 * 多容器模式的子应用启动
 * @param optional
 */
const start = (optional)=> {
  // 检查和创建子应用的单独容器
  microAppConfigs.forEach(app => {
    if (!app.container) {
      let appContainer = document.getElementById(app.name)
      if (!appContainer) {
        appContainer = document.createElement('div')
        appContainer.id = app.name
      }
      document.getElementById('micro-service').appendChild(appContainer)
      app.container = '#' + app.name
      console.log('app container',app.container);
    }
  })
  registerMicroApps(microAppConfigs, lifeCycles())

  qiankunStart(optional)

  addErrorHandler(error => {
    if (error.appOrParcelName) {
      const app = microAppConfigs.find(config => config.name === error.appOrParcelName)
      const errorMsg = `${app.title || '应用'} 加载失败\n${error.message}`
      store.commit('MICRO_ERROR', {
        container: error.appOrParcelName,
        error: errorMsg
      })
      InterceptMessage.error(errorMsg)
      console.error('ErrorHandler', errorMsg)
    }
  })
}


// 避免在子应用加载过程中频繁切换
// router.beforeEach((to, from, next) => {
//   console.log(store.getters.microLoading);
//   if (store.getters.microLoading) {
//     InterceptMessage.info('应用加载中，请稍后操作')
//     return next(false)
//   }
//   next()
// })
// 未被激活的应用，容器级别隐藏
router.afterEach(() => {
  microAppConfigs.forEach(app => {
    console.log('router-beforeach-app',app);
    const appContainer = document.getElementById(app.name)
    if (appContainer) {
      const isActive = app.activeRule(window.location, true)
      appContainer.style.display = isActive ? '' : 'none'
    }
  })
})

export default {
  microAppConfigs,
  start,
  onGlobalStateChange:actions.onGlobalStateChange,
  setGlobalState:actions.setGlobalState,
  updateGlobalState,
  generateRoutes
}
