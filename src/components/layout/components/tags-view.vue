<template>
  <div class="tags-view-container">
    <div ref="scrollOuter" class="tags-view__outer">
      <div ref="scrollContainer" class="tags-view-wrapper">
        <router-link
          v-for="tag in visitedViews"
          ref="tags"
          :key="tag.fullPath"
          :class="isActive(tag)"
          :to="tag"
          :title="tag.title"
          class="tags-view-item"
          @contextmenu.prevent.native="openMenu(tag,$event)"
        >
          <span class="tags-view-item__title">{{ tag.title }}</span>
          <span class="tags-view-item__close el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
        </router-link>
      </div>
    </div>

    <ul v-show="visible" class="contextmenu" :style="{left:left+'px',top:top+'px'}">
      <li @click="refreshSelectedTag(selectedTag)">{{ $t('@F5CB8:刷新') }}</li>
      <li @click="closeSelectedTag(selectedTag)">{{ $t('@F5CB8:关闭') }}</li>
      <li @click="closeOthersTags">{{ $t('@F5CB8:关闭其他所有') }}</li>
      <li @click="closeAllTags">{{ $t('@F5CB8:关闭所有') }}</li>
    </ul>
  </div>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'
  import { scrollToDelta } from '@/utils'
  import IM from '@/store/modules/call-center/im-proxy'
  import { IMActionType } from '@call/enum'

  const STORAGE_KEY = 'tag-view:views'
  const CALL_CENTER = 'CallCenterChatIndex'
  export default {
    props: {
      isCloseShow: {
        type: Boolean,
        default() {
          return false
        }
      }
    },
    data() {
      return {
        visible: false,
        top: 0,
        left: 0,
        scrollVisible: false,
        selectedTag: {},

        hasNewMsg: false
      }
    },
    computed: {
      ...mapGetters('tagsView', ['visitedViews'])
    },
    watch: {
      visitedViews(views) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(views))
        // 更新是否可见的滚动条操作
        this.$nextTick(() => {
          const scrollWidth = this.$refs.scrollContainer.scrollWidth
          // 这个值会出现小数导致下方有微略差异
          const domWidth = Math.floor(this.$refs.scrollOuter.getBoundingClientRect().width + 5)
          this.scrollVisible = scrollWidth > domWidth
        })
      },
      $route(route) {
        this.addViewTags()
        this.moveToCurrentTag()

        if (route.name === CALL_CENTER) {
          this.hasNewMsg = false
          // this.hideVoiceApp(route.name)
        }
      },
      isCloseShow(val) {
        this.visible = false
      },
      visible(value) {
        if (value) {
          document.body.addEventListener('click', this.closeMenu)
        } else {
          document.body.removeEventListener('click', this.closeMenu)
        }
      }
    },
    created() {
      const storeViews = sessionStorage.getItem(STORAGE_KEY)
      if (storeViews) {
        this.initAllViews(JSON.parse(storeViews))
      }
      this.addViewTags()

      IM.addEventListener(IMActionType.ChatMessage, this.receiveMsgNotify)
    },
    beforeDestroy() {
      IM.removeEventListener(IMActionType.ChatMessage, this.receiveMsgNotify)
    },
    methods: {
      ...mapActions('tagsView', [
        'initAllViews',
        'addView',
        'updateVisitedView',
        'delCachedView',
        'delView',
        'delOthersViews',
        'delAllViews'
      ]),
      // 当用户没有在呼叫中心页面，收到用户消息时做出提示
      receiveMsgNotify(txMessage) {
        if (this.$route.name !== CALL_CENTER) {
          this.hasNewMsg = true
        }
      },
      generateRoute() {
        if (this.$route.name) {
          return this.$route
        }
        return false
      },
      isActive(route) {
        if (route.exclusive) {
          return `${this.$route.name}_${this.$route.params.id || this.$route.query.id}` === route.exclusive ? 'active' : ''
        } else if (route.path === this.$route.path) {
          return 'active'
        }
        if (this.hasNewMsg && route.name === CALL_CENTER) {
          return 'notify'
        }
      },
      addViewTags() {
        const route = this.generateRoute()
        if (!route) {
          return false
        }
        if (route.meta.isGeneral) {
          return false
        }
        this.addView(route)
      },
      moveToCurrentTag() {
        this.$nextTick(() => {
          const viewObj = this.findView()
          const view = viewObj.view
          // when query is different then update
          if (view && view.fullPath !== this.$route.fullPath) {
            this.updateVisitedView(this.$route)
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.visitedViews))
          }

          // if scroll, scroll to it
          const index = viewObj.index
          if (index > -1) {
            const $elRect = this.$refs.tags[index].$el.getBoundingClientRect()
            const $containerRect = this.$refs.scrollContainer.getBoundingClientRect()
            const deltX = ($elRect.x - $containerRect.x) - $containerRect.width + $elRect.width
            if ($elRect.x - $containerRect.x < 0) {
              scrollToDelta(this.$refs.scrollContainer, $elRect.x - $containerRect.x, 200, 'left')
            } else if (deltX > 0) {
              scrollToDelta(this.$refs.scrollContainer, deltX, 200, 'left')
            }
          }
        })
      },
      hideVoiceApp(name) {
        if (name === CALL_CENTER) {
          this.$nextTick(() => {
            document.getElementById('micro-workbench-voice-app').style.display = 'none'
          })
        }
      },
      // 刷新
      refreshSelectedTag(view) {
        // 重新获取当前用户的项目
        this.$store.dispatch('getEngineerProjects')
        // this.hideVoiceApp(view.name)
        // 子项目直接交给项目内部处理刷新动作
        if (view.meta && view.meta.isMicro) {
          return window.dispatchEvent(new CustomEvent('CubeAppRefreshView', {
            detail: view
          }))
        }

        this.delCachedView(view).then(() => {
          const { fullPath } = view
          this.$nextTick(() => {
            this.$router.replace({
              path: '/redirect' + fullPath
            })
          })
        })
        // 判断是否是晨星远程协作页面
        if (this.$route.name === 'RemoteCollaborationIndex') {
          this.$emit('clickBrotherBtn')
        }
      },
      closeSelectedTag(view) {
        this.delView(view).then(({ visitedViews }) => {
          if (this.isActive(view)) {
            const latestView = visitedViews.slice(-1)[0]
            if (latestView) {
              this.$router.push(latestView)
            } else {
              this.$router.push('/')
            }
          }
        })
      },
      closeOthersTags() {
        this.$router.push(this.selectedTag)
        this.delOthersViews(this.selectedTag).then(() => {
          this.moveToCurrentTag()
        })
      },
      closeAllTags() {
        this.delAllViews().then(() => {
          this.$router.push('/')
        })
      },
      handleScroll(e) {
        scrollToDelta(this.$refs.scrollContainer, e.deltaY / 3, 100, 'left')
      },
      openMenu(tag, e) {
        const menuMinWidth = 105
        const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
        const offsetWidth = this.$el.offsetWidth // container width
        const maxLeft = offsetWidth - menuMinWidth // left boundary
        const left = e.clientX - offsetLeft + 15 // 15: margin right

        if (left > maxLeft) {
          this.left = maxLeft
        } else {
          this.left = left
        }
        this.top = e.clientY

        this.visible = true
        this.selectedTag = tag
      },
      closeMenu() {
        this.visible = false
      },
      scrollLeft() {
        scrollToDelta(this.$refs.scrollContainer, -50, 200, 'left')
      },
      scrollRight() {
        scrollToDelta(this.$refs.scrollContainer, 50, 200, 'left')
      },
      findView() {
        let index = -1
        const vis = this.visitedViews.filter(v => v.path === this.$route.path).map((v, i) => i)
        if (vis.length > 1) {
          index = this.visitedViews.findIndex(v => v.fullPath === this.$route.fullPath)
        } else {
          index = vis[0] || -1
        }
        return { index, view: this.visitedViews[index] }
      }
    }
  }
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  $bg-tag: #D0DBEE;
  $bg-tag-active: #7D87A5;

  .tags-view-container {
    height: 34px;
    width: 100%;
    background: white;
    border-bottom: 1px solid #d8dce5;

    .tags-view__outer {
      display: flex;
      justify-content: space-between;

      .tags-view-wrapper {
        flex: 1 auto;
        scrollbar-width: none;
      }

      a.tag-arrow {
        line-height: 30px;
        height: 30px;
        width: 20px;
        margin-top: 2px;
        display: inline-block;
        background-color: white;
      }
    }

    .tags-view-wrapper {
      height: 33px;
      width: 100%;
      display: flex;
      overflow-x: hidden;
      white-space: nowrap;
      padding-left: 5px;
      padding-right: 5px;
      transition: all 200ms;

      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        display: none;
      }

      .tags-view-item {
        flex-basis: 200px;

        color: #333;
        background: $bg-tag;
        display: flex;
        height: 26px;
        line-height: 26px;
        padding: 0 6px;
        font-size: 12px;
        margin-left: 5px;
        margin-top: 4px;
        transition: all 200ms;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;

        min-width: 50px;

        .tags-view-item__title {
          display: inline-block;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          flex: 1;
        }
        .tags-view-item__close {
          display: inline-block;
          margin-top: 5px;
        }

        &:first-of-type {
          margin-left: 0;
        }

        &.active {
          background-color: $bg-tag-active;
          color: white;

          //&::before {
          //  content: '';
          //  background: #fff;
          //  display: inline-block;
          //  width: 6px;
          //  height: 6px;
          //  border-radius: 50%;
          //  position: relative;
          //  margin-right: 2px;
          //  top: -1px;
          //}

          &:hover {
            background: darken($bg-tag-active, 5%);
          }
        }

        &.notify {
          animation: notify 800ms ease-out 1s infinite alternate;
        }

        @keyframes notify {
          from {
            background: $bg-tag;
          }

          to {
            background-color: #ffd8ca;
          }
        }

        &:hover {
          background: darken($bg-tag, 5%);
        }
      }
    }

    .contextmenu {
      margin: 0;
      background: #fff;
      z-index: 2110;
      position: absolute;
      list-style-type: none;
      padding: 5px 0;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 400;
      color: #333;
      box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, .3);

      li {
        margin: 0;
        padding: 7px 16px;
        cursor: pointer;

        &:hover {
          background: #eee;
        }
      }
    }
  }
</style>

<style rel="stylesheet/scss" lang="scss">
  //reset element css of el-icon-close
  .tags-view-wrapper {
    .tags-view-item {
      .el-icon-close {
        width: 16px;
        height: 16px;
        vertical-align: 2px;
        border-radius: 50%;
        text-align: center;
        transition: all .3s cubic-bezier(.645, .045, .355, 1);
        transform-origin: 100% 50%;

        &:before {
          transform: scale(1);
          display: inline-block;
          vertical-align: -3px;
        }

        &:hover {
          background-color: #000;
          color: #fff;
        }
      }
    }
  }
</style>
