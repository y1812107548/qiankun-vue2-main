<template>
  <div class="dialog-content-right scroll">
    <div class="right-title">
      <h5>{{ detailData.subject || detailData.content }}</h5>
      <p>{{ detailData.sendTime }}
        <!-- <span>12:00:00</span> -->
      </p>
    </div>
    <div class="right-content">
      <!--      当发生类型包含16时是下载，flow后端逻辑-->
      <div v-if="url_loading">
        <p v-if="!detailData.content.des" class="right-content-p1">
          <span>您的“</span>
          <span>{{ detailData.content.file_name }}</span>
          <span>”已准备完毕，现在可以下载了。请点击下方链接进行下载。
            <span v-if="overtime">请您注意，为确保工单数据的时效性与准确性，此文件下载的有效期为自提交之时起
              <strong style="color: red">{{ detailData.content.overtime }}</strong>
              小时，过期系统会自动清理，请您及时完成下载。</span>
          </span>
        </p>
        <div class="content_des" v-html="detailData.content.des" />
        <span v-loading="loadding" class="right-content-a2" href="javascript" target="_blank" download @click="download(detailData.content.url)">
          <svg-icon class="rc-1" :icon-class="fileTypeClass(detailData.content.file_type)" />
          <span :title="detailData.content.file_name + '.'+detailData.content.file_type" class="rc-2">{{ detailData.content.file_name }}.{{ detailData.content.file_type }}</span>
          <span class="rc-3"><svg-icon icon-class="down_load_2" /></span>

        </span>

      </div>

      <div v-else style="line-height: 2" v-html="detailData.content" />
    </div>
  </div>
</template>
<script>
// 推送消息为json时，个字段意义
// conetnt = {
//   file_type:'',
//   url:'',
//   file_name:'',
//   overtime:'描述信息为固定话术时超时时间默认为2',
//   des:'描述信息为后端传过来的vhtm，',
//
// }
  import { handleDownload } from '@/utils'
  import { downloadFile } from '@/api/announce/message-center'
  import { BCNoticeMessageSendType, BCNoticeMessageShowType } from '@call/enum'
  function isLoadd(data) {
    return (data.sendType & BCNoticeMessageSendType.DefaultLoadding) === BCNoticeMessageSendType.DefaultLoadding ||
      (data.sendType === BCNoticeMessageSendType.CommonBox &&
      (data.showType === BCNoticeMessageShowType.PrivateLoadding ||
      data.showType === BCNoticeMessageShowType.PublicLoadding))
  }
  export default {
    props: {
      data: {
        type: Object,
        default() {
          return {}
        }
      }
    },
    data() {
      return {
        detailData: this.formData(this.data),
        loadding: false,
        fileTypeList: { 'xlsx': 'xlsx', 'xls': 'xlsx', 'pptx': 'pptx', 'ppt': 'ppt', 'zip': 'zip', 'docx': 'docx', 'doc': 'docx', 'pdf': 'pdfx', 'excel': 'excel', 'txt': 'txt', 'csv': 'csv' }
      }
    },
    computed: {
      url_loading() {
        const detailData = this.detailData
        if (isLoadd(detailData) && detailData.content && detailData.content.url) {
          return true
        } else {
          return false
        }
      },
      overtime() {
        if (this.detailData.content.overtime) {
          return true
        } else {
          return false
        }
      }
    },
    watch: {
      data(val) {
        this.detailData = this.formData(val)
      }
    },
    methods: {
      fileTypeClass(type) {
        if (this.fileTypeList[type]) {
          return this.fileTypeList[type]
        } else {
          return 'folder-new'
        }
      },
      formData(data) {
        // 当发生类型包含下载
        if (data.content && isLoadd(data)) {
          try {
            data.content = JSON.parse(data.content)
            if ((data.sendType & 16) === 16 && !data.content.overtime) {
              data.content.overtime = 2
            }
          } catch (e) {
            console.log('json格式化出错')
          }
        }
        return data
      },
      // 下载
      download(url) {
        if (this.detailData.showType === BCNoticeMessageShowType.PrivateLoadding) {
          this.loadding = true
          // 私有桶下载
          downloadFile({ filePath: this.detailData.content.url }).then((res) => {
            this.loadding = false
            handleDownload(`${this.detailData.content.file_name}.${this.detailData.content.file_type}`, new Blob([res]))
          }).catch((e) => {
            console.log('downloadFile error', e)
            this.loadding = false
          })
        } else {
          // 普通链接下载
          handleDownload(`${this.detailData.content.file_name}.${this.detailData.content.file_type}`, this.detailData.content.url, 'url')
        }
      }
    }
  }
</script>
<style lang="scss" scoped>
  .dialog-content-right {
    width: 50%;
    border-left: 1px solid #efefef;
    padding: 5px;
    overflow-y: auto;

    .right-title {
      padding-bottom: 10px;
      line-height: 32px;
      display: flex;
      flex-direction: column;

      h5 {
        font-size: 14px;
        margin: 0;
        line-height: 22px;
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      p {
        font-size: 12px;
        line-height: 1;
        margin: 0;
      }
    }

    .right-content {
      padding: 10px 10px 0;
      background-color: #f5f7fa;
      height: calc(100% - 60px);

      p {
        margin: 0;
        padding: 0;
      }

      .right-content-p1 {
        line-height: 24px;
        font-size: 13px;
      }

      .right-content-a2 {
        width: 100%;
        height: 62px;
        background: #FFFFFF;
        border-radius: 4px;
        margin-top: 40px;
        display: flex;
        align-items: center;
        cursor: pointer;

        .rc-1 {
          font-size: 38px;
          margin-left: 10px;
          width: 26px;
          margin-right: 5px;
        }

        .rc-2 {
          flex: 1;
          text-decoration-line: underline;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: keep-all;
          white-space: nowrap;
        }

        .rc-3 {
          font-size: 21px;
          margin-right: 10px;
        }
      }

      .right-content-a2:hover {
        .rc-2, .rc-3 {
          color: #3E8DDD;
        }
      }
    }
    .content_des{
      line-height: 22px;
    }
  }
</style>
