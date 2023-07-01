<template>
  <section
     v-loading="isMicroLoading"
    element-loading-text="应用加载中..."
    class="app-main"
  >
    <transition name="fade-transform" mode="out-in">
        <router-view />
    </transition>
    <!-- 子应用将在这里建立单独的容器 -->
    <div
      v-show="isMicroService"
      id="micro-service"
      class="micro-app"
    ></div>
  </section>
</template>

<script type="text/ecmascript-6">
  import { mapGetters } from 'vuex'
  export default {
    name: 'AppMain',
    components: {

    },
    data() {
      return {

      }
    },
    computed: {
      ...mapGetters(['microLoading']),
      isMicroService() {
        return this.$route.meta.isMicro
      },
      isMicroLoading() {
        return !!this.microLoading
      },
    },
    created() {

    },
    mounted() {

    },
  }
</script>

<style scoped lang="scss">
  .app-main {
    /*84 = navbar + tags-view = 50 +34 */
    min-height: calc(100vh - 84px);
    width: 100%;
    position: relative;
    /*overflow: hidden;*/
    overflow: auto;
    height: calc(100vh - 84px);
  }
  .remoteStartClass {
    width: 100%;
    height: 100%;
  }
  .micro-app {
    height: 100%;
  }
  #micro-workbench-side-app {
    position: absolute;
    bottom: 0;
    top: 0;
    right: 50px;
    width: 430px;
    z-index: 20;
    overflow: auto;
  }
  ::v-deep #micro-workbench-side-app>div:first-child{
    height: 100%;
  }
  ::v-deep #micro-workbench-voice-app>div:first-child{
    height: 100%;
  }

  @media (max-width: 1366px){
    #micro-workbench-side-app {
      width: 360px;
      right: 40px;
    }
  }
  #micro-workbench-voice-app {
    position: absolute;
    left: 280px;
    right: 480px;
    height: calc(100vh - 84px - 243px);
    z-index: 21;
    overflow: auto;
    padding-left: 15px;
    padding-right: 15px;
  }
</style>
