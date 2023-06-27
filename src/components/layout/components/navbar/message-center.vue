<!--
 * @Author: ruanxin
 * @Date: 2021-08-25 14:19:05
 * @LastEditors: ruanxin
 * @LastEditTime: 2021-08-25 14:33:49
 * @Description: file content
-->
<template>
  <div>

    <cube-el-popover v-model="popoverVisible">
      <p class="message-tip" @click="showAnnouncement">
        <span style="font-weight: bold">{{ popoverOption.type }}</span>
        <span>{{ popoverOption.content }}</span>
      </p>
      <template v-slot:reference2>
        <div class="notice-button">
          <el-badge v-if="messageCenterCount" class="item" :value="messageCenterCount" :max="99" @click.native="showAnnouncement">
            <svg-icon icon-class="email_2" />
          </el-badge>
          <span v-else class="item" @click="showAnnouncement">
            <svg-icon icon-class="email_2" style="cursor: pointer" />
          </span>
        </div>
      </template>
    </cube-el-popover>
    <announce-dialog ref="announceDialog" :visible="announcementVisible" @close="announcementVisible = false" @changeNoticeCount="getMessageCenterCount" />

  </div>
</template>

<script type="text/ecmascript-6">
  import AnnounceDialog from '@/views/layout/components/navbar/announcement-dialog'
  import { getMessageBoxList } from '@/api/announce/message-center'
  import IM from '@call/im-proxy'
  import { IMActionType, BCNoticeMessageShowType } from '@call/enum'
  import CubeElPopover from './cube-el-popover'
  import { handleNoticeMessage } from './im-noticeMessage-card'
  export default {
    components: {
      AnnounceDialog, CubeElPopover
    },
    data() {
      return {
        messageCenterCount: 0,
        announcementVisible: false,
        popoverVisible: false,
        popoverOption: {
          type: '系统消息',
          content: ''
        }

      }
    },
    mounted() {
      // 消息中心-通知类
      this.getMessageCenterCount()
      IM.addEventListener(IMActionType.NoticeMessage, (message, messageType) => {
        if (message.showType === BCNoticeMessageShowType.DefaultBox) {
          handleNoticeMessage(this, message)
        } else {
          this.getMessageCenterCount()
          this.popoverVisible = true
          this.popoverOption.content = message.title
          this.popoverOption.type = `${message.namespace === 'system' ? '[系统公告]' : message.namespace === 'tickets' ? '[工单]' : '[人工]'}`
        }
      })
    },
    methods: {
      showAnnouncement() {
        this.announcementVisible = true
        this.$refs.announceDialog.changeType()
      },
      getMessageCenterCount() {
        // 更新消息数量
        getMessageBoxList({
          pageSize: 10,
          pageNum: 1,
          namespace: null,
          readStatus: 1
        }).then(res => {
          this.messageCenterCount = res.total
        })
      }
    }
  }
</script>
<style lang="scss" scoped>
  .notice-button{
    font-size: 20px;
    margin-right: 18px;
  }
  .message-tip{
    overflow: hidden;
    line-height: 54px;
    width: 100%;
    height: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin: 0;
  }
  .item {
    width: 20px;
    cursor: pointer;
    display: inline-block;
    /deep/ .el-badge__content.is-fixed {
      top: 36% !important;
      right: 11px !important;
      background-color: #FB4841;
    }
  }

</style>
