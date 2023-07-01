import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import microApps from './micro'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI)
Vue.config.productionTip = false


// 延迟启用微应用能力，避免容器div 尚未加载的情况
let timer = null
const startMicroApps = ()=> {
  timer = setTimeout(() => {
    if (document.getElementById('micro-service')) {
      // 尝试过放在app-main 组件内，但会导致白屏
      microApps.start({
        singular: false,
        prefetch: false,
        excludeAssetFilter: url => {
          // 避免qiankun 劫持fetch 导致百度地图API加载失效问题
          return url?.includes('api.map.baidu.com')
        }
      })
    } else {
      startMicroApps()
    }
    clearTimeout(timer)
    timer = null
  }, 500)
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app').$nextTick(()=>{
  startMicroApps()
})
