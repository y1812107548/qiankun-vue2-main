<template>
  <div v-if="!item.hidden&&item.children" class="menu-wrapper">
    <el-submenu :index="item.name||item.path">
      <template v-if="getMenuLevel(item) === 1" slot="title">
        <svg-icon v-if="item.meta&&item.meta.icon" :icon-class="item.meta.icon" />
        <span v-if="item.meta&&item.meta.title" slot="title">{{ item.meta.title }}</span>
      </template>
      <template v-else slot="title">
        <svg-icon :icon-class="folderOpened(item.name||item.path) ? 'folder-opened2' : 'folder2'" />
        <span v-if="item.meta&&item.meta.title" slot="title">{{ item.meta.title }}</span>
      </template>

      <template
        v-for="child in item.children"
        v-if="!child.hidden"
      >
        <sidebar-item
          v-if="child.children&&child.children.length>0"
          :key="child.name"
          :is-nest="true"
          class="nest-menu"
          :item="child"
          :base-path="resolvePath(child)"
        />

        <app-link v-else :key="child.name" :to="resolvePath(child)" :meta="child.meta">
          <el-menu-item
            :index="resolvePath(child)"
            @click="navStatisticAction(child.meta.title)"
          >
            <svg-icon v-if="getMenuLevel(child) === 2" :icon-class="isCurrentMenu(child) ? 'folder-opened2' : 'folder2'" />
            <svg-icon v-if="getMenuLevel(child) > 2" icon-class="userStatus" />
            <span v-if="child.meta&&child.meta.title" slot="title">{{ child.meta.title }}</span>
          </el-menu-item>
        </app-link>
      </template>
    </el-submenu>
  </div>
</template>

<script>
  import path from 'path'
  import AppLink from './Link'
  import { mapGetters } from 'vuex'
  import { postNavStatistic } from '@/api/public'
  import { CUBE } from '@/configuration'

  export default {
    name: 'SidebarItem',
    components: { AppLink },
    inject: ['rootMenu'],
    props: {
      // route object
      item: {
        type: Object,
        required: true
      },
      isNest: {
        type: Boolean,
        default: false
      },
      basePath: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        onlyOneChild: null
      }
    },
    computed: {
      ...mapGetters(['allInfo', 'engineerCode'])
    },
    methods: {
      folderOpened(item) {
        return this.rootMenu.openedMenus.includes(item)
      },
      isCurrentMenu(item) {
        return this.rootMenu.activeIndex === item.path
      },
      // 获取当前菜单级数
      getMenuLevel(item) {
        return item.meta && item.meta.menuLevel
        // return item.path.split('/').filter(e => !!e).length
      },
      resolvePath(item) {
        return path.resolve(this.basePath, item.path)
      },
      // 埋点请求
      navStatisticAction(title) {
        if (CUBE.mode !== 'saas') return
        postNavStatistic({
          userName: this.allInfo.name,
          userCode: this.engineerCode,
          navName: title
        })
      }
    }
  }
</script>

