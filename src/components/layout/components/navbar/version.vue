<template>
  <div>
    <span class="version pointer" @click="versionCheck">{{ version }}</span>
    <span v-show="newVisible" class="new-icon"><span>new</span></span>

    <el-dialog
      width="30%"
      title=""
      :visible.sync="aboutDialogVisible"
      class="about-cube"
      center
      :close-on-click-modal="false"
    >
      <div class="version-wrap">
        <div v-for="(item, i) in historyVersion" :key="i">
          <p class="title">{{ item.title }} {{ item.version }}</p>
          <p class="time">{{ $t('@9E113:更新时间:') }} {{ item.version_time }}</p>
          <ul class="version-list">
            <li v-for="(list, index) in item.all_children" :key="index">
              {{ index+1 }}.{{ list.title }}
            </li>
          </ul>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="aboutDialogVisible = false">{{ $t('@9E113:我知道了') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script type="text/ecmascript-6">
  import { getVersionHistory } from '@/api/public'

  export default {
    name: '',
    data() {
      return {
        aboutDialogVisible: false,
        newVisible: false, // new icon
        version: '', // 版本号
        historyVersion: [] // 历史版本
      }
    },
    mounted() {
      // todo 如果增加了版本检测
    },
    methods: {
      versionHistoryList() {
        getVersionHistory().then(response => {
          this.historyVersion = response.data.versions
        }).catch(err => {
          console.log(err)
        })
      },
      versionCheck() {
        this.versionHistoryList()
        this.aboutDialogVisible = true
        this.newVisible = false
      }
    }
  }
</script>

<style lang='scss' type="text/scss" scoped>
  .version {
    color: #3E8DDD;
    font-size: 12px;
    padding-left: 10px;
    margin-top: 10px;
    cursor: default;
  }

  .status {
    font-size: 14px;
    font-weight: normal;
    color: #606266;
    margin-right: 15px;

    &:hover {
      color: #409EFF;
    }
  }

  .new-icon {
    margin: 5px;
    padding: 7px 0 0;

    span {
      background-color: #F37261;
      color: #fff;
      font-size: 12px;
      padding: 0 5px;
      border-radius: 10px;
    }
  }

  .version-wrap {
    max-height: calc(100vh - 300px);
    font-size: 14px;
    overflow: auto;

    .title {
      text-align: center;
      font-size: 16px;
      color: #303133;
      font-weight: bold;
    }

    .time {
      text-align: center;
      color: #909399;
    }

    .version-list {
      margin: 20px 0 30px 20px;

      li {
        line-height: 26px;
      }
    }
  }
</style>
