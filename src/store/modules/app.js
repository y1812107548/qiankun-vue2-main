import Vue from 'vue'

const app = {
  state: {
    microApps: {
      loading: {},
      error: {}
    },
  },
  getters: {
    // 确保全局只有一个应用loading，避免多个应用同时加载
    microLoading: state => {
      const loadingContainer = Object.entries(state.microApps.loading).find(([key, value]) => value)
      if (loadingContainer) {
        return loadingContainer[0]
      }
      return ''
    },
    microLoadingText: state => {
      return Object.values(state.microApps.error).filter(error => !!error)[0] || '应用加载中'
    }
  },
  mutations: {
    TOGGLE_MICRO_LOADING: (state, { container, loading }) => {
      Vue.set(state.microApps.loading, container, loading)
      if (loading) {
        Vue.set(state.microApps.error, container, '')
      }
    },
    MICRO_ERROR: (state, { container, error }) => {
      Vue.set(state.microApps.error, container, error)
      Vue.set(state.microApps.loading, container, false)
    }
  },
  actions: {

  }
}

export default app
