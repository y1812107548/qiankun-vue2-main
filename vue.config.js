const { defineConfig } = require('@vue/cli-service')
const BASE_API = process.env.VUE_APP_BASE_API
module.exports = defineConfig({
  transpileDependencies: true,
  devServer:{
    proxy:{
      '/api':{
        target:BASE_API,
        changeOrigin:true
      },
      '/qk_child':{
        target: BASE_API,
        changeOrigin: true
      }
    }
  }
})
