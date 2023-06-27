<template>
  <div :class="classObj" class="app-wrapper" >
    <div>侧边栏</div>
    <!-- <sidebar id="layout-container-sidebar" class="container-sidebar" /> -->
    <div class="container-main">
      <!-- <navbar /> -->
      <div>navbar</div>
      <!-- <tags-view :is-close-show="closeTool" @clickBrotherBtn="triggerBrotherMethods" /> -->
      <app-main />
    </div>
  </div>
</template>

<script>
  import AppMain from './components/app-main'
  // import Navbar from './components/navbar'
  // import Sidebar from './components/Sidebar'
  // import TagsView from './components/tags-view'
  // import ResizeMixin from './mixin/ResizeHandler'
  // import { mapGetters } from 'vuex'

  export default {
    name: 'Layout',
    components: {
      // Navbar,
      // Sidebar,
      AppMain,
      // TagsView,
    },
    // mixins: [ResizeMixin],
    data() {
      return {
        closeTool: false
      }
    },
    computed: {
      classObj() {
        return {
          hideSidebar: false,
          openSidebar: true,
          withoutAnimation: true,
        }
      }
    },
    methods: {

    }
  }
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  @import "../../styles/mixin.scss";

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;
  }

  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }
</style>
