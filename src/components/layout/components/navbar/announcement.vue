<!--
 * @Author: ruanxin
 * @Date: 2021-06-25 21:21:47
 * @LastEditors: ruanxin
 * @LastEditTime: 2021-08-18 14:26:27
 * @Description: file content
-->
<template>
  <el-carousel v-if="announcements.length" height="30px" direction="vertical" :interval="5000" :autoplay="true">
    <el-carousel-item v-for="(item, index) in announcements" :key="index" @click.native="clickItem(item)">
      <el-popover
        placement="top-start"
        title=""
        width="280"
        trigger="hover"
        :content="item.content"
      >
        <div slot="reference" class="medium announce-text" @mouseenter="announceenter" @mouseleave="announceleave">
          <div v-if="(item.title + item.content).length < 29">
            <svg-icon v-show="showoriginsvg" style="margin-right:6px;" icon-class="announce" />
            <svg-icon v-show="!showoriginsvg" style="margin-right:6px;" icon-class="announce-hover" />
            {{ item.title }} : {{ item.content }}
          </div>
          <div v-else>
            <svg-icon v-show="showoriginsvg" style="margin-right:6px;" icon-class="announce" />
            <svg-icon v-show="!showoriginsvg" style="margin-right:6px;" icon-class="announce-hover" />
            {{ (item.title+ ':' + item.content).slice(0, 29) + '...' }}
          </div>
        </div>
      </el-popover>
    </el-carousel-item>
  </el-carousel>
</template>

<script>
  import { getLoginAlert } from '@/api/announce'
  export default {
    data() {
      return {
        showoriginsvg: true,
        announcements: []
      }
    },

    mounted() {
      this.init()
    },

    methods: {
      init() {
        const data = {
          page: 1,
          limit: 10,
          per_page: 10,
          perPage: 10,
          size: 10,
          alert: ''
        }
        getLoginAlert(data).then(res => {
          this.announcements = res.data
        }).catch(err => console.error(err))
      },
      announceenter() {
        this.showoriginsvg = false
      },
      announceleave() {
        this.showoriginsvg = true
      },
      clickItem(item) {
        // this.$emit('handlerAnnouncement', item)
      }
    }
  }
</script>

<style lang='scss' type="text/scss" scoped>
  .announce-text:hover {
    color: #3E8DDD;
  }
  ::v-deep.el-carousel .el-carousel__indicators {
    display: none;
  }
</style>
