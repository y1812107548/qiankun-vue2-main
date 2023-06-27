<template>
  <div class="status-switch">
    <!-- 服务云需求：在没有工作台菜单时 不显示状态切换按钮 -->
    <el-dropdown v-if="hasPermission('CallCenterChatIndex')" trigger="click" class="status-change" @command="handleCommand">
      <div class="pointer status">
        <i v-show="loading('/api/wb/engineer/workUpdate')" class="el-icon-loading" />
        <span class="status-color" :style="{backgroundColor: currentStatusColor}" />
        {{ currentStatusName }}<i class="el-icon-caret-bottom" />
      </div>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="online"> {{ $t('@DBA18:就 绪 ') }}</el-dropdown-item>
        <el-dropdown-item command="rest"> {{ $t('@DBA18:小 休 ') }}</el-dropdown-item>
        <el-dropdown-item command="hangup"> {{ $t('@DBA18:挂 起 ') }}</el-dropdown-item>
        <el-dropdown-item command="offline"> {{ $t('@DBA18:离 线 ') }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <rest-dialog ref="restForms" :visible="restVisible" @handleRestLog="handleRestLog" @close="restVisible = false" />
  </div>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'
  import { mapActions, mapGetters } from 'vuex'
  import RestDialog from './rest-dialog'
  import IM from '@call/im-proxy'
  import { EngineerStatus, IMActionType } from '@call/enum'
  // import { retry, sleep } from '@/utils'
  import { CUBE } from '@/configuration'
  import { getSignStatus } from '@/api/customization'

  const statusMap = {
    online: $t('@DBA18:就绪'),
    rest: $t('@DBA18:小休'),
    hangup: $t('@DBA18:挂起'),
    offline: $t('@DBA18:离线')
  }

  const statusColorMap = {
    online: '#33FF99',
    rest: '#FF9966',
    hangup: '#0099FF',
    offline: '#CC0066'
  }

  export default {
    name: 'StatusSwitch',
    components: {
      RestDialog
    },
    props: {
      state: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
    data() {
      return {
        timer: [],
        restVisible: false
      }
    },

    computed: {
      ...mapGetters([
        'isCloudOnly',
        'sidebar',
        'currentStatus',
        'hasPermission'
      ]),
      ...mapGetters({
        info: 'allInfo'
      }),
      ...mapGetters('api', ['loading']),
      ...mapGetters('call', ['sessions']),
      currentStatusName() {
        const re = statusMap[this.currentStatus]
        return re || statusMap.offline
      },
      currentStatusColor() {
        const re = statusColorMap[this.currentStatus]
        return re || statusColorMap.offline
      }
    },
    watch: {
      // 手动签出，设置为离线状态
      // 'state': {
      //   deep: true,
      //   handler: function(newVal) {
      //     console.log('newVal', newVal)
      //     if (newVal.sign && newVal.offLine) {
      //       this.changeWorkStatus(EngineerStatus.Hangup)
      //     }
      //   }
      // },
      'info.offLine'(val) {
        if (val === false) {
          this.changeWorkStatus(EngineerStatus.Offline)
        }
      }
    },
    mounted() {
      // this.initEngStatus()
      this.initEngStatus().then(currentStatus => {
        // 当坐席没有工作台权限，但当前又处于就绪状态时，强制离线
        if (!this.hasPermission('CallCenterChatIndex') && currentStatus === EngineerStatus.Online) {
          this.changeWorkStatus(EngineerStatus.Offline)
          this.$message.info('当前坐席没有客服工作台权限，已强制离线')
        }
      })

      IM.addEventListener(IMActionType.Notification, this.notificationHandle)

      // 坐席工作状态轮询检查
      this.timer.push(setInterval(() => {
        const statusBeforeAutochange = this.currentStatus
        this.initEngStatus().then(currentStatus => {
          if (statusBeforeAutochange !== currentStatus) {
            this.$message.info($t('@DBA18:坐席工作状态发生变化，请查看'))
          }
        })
      }, 5 * 60 * 1000))
    },
    beforeDestroy() {
      this.timer.forEach(clearInterval)
      IM.removeEventListener(IMActionType.Notification, this.notificationHandle)
    },
    methods: {
      ...mapActions(['changeWorkStatus', 'LogOut', 'initEngStatus', 'showSign']),
      handleRestLog(restForm) {
        console.log(restForm)
        this.$store.commit('SET_REST_LOG', restForm)
        this.restVisible = false
        this.handleCommand(EngineerStatus.Rest)
      },
      handleCommand(command) {
        if (CUBE.permission.cube_diy && CUBE.permission.cube_diy.check_in_check_out_switch) {
          if (this.currentStatus === command && EngineerStatus.Offline === command) {
            return
          }
          getSignStatus().then(res => {
            const boo = res.data.sign_status === 'in'
            localStorage.setItem('sign', boo)
            this.showSign(boo)
            if (!boo) {
              this.$message({
                type: 'warning',
                message: '当前账号未签入，无法操作！'
              })
              return
            }
            this.handleExtraction(command)
          })
        } else {
          this.handleExtraction(command)
        }
      },
      // 补充增加监听班长操作的通知
      notificationHandle(message, messageType, bodyType) {
        if (bodyType === 'chatMonitor') {
          let msg = message.Body.Content.message
          const session = this.sessions[message.Body.Content.sessionId]
          if (session) {
            msg = msg.replace('[user]', `${session.user_name || $t('@DBA18:匿名用户')}`)
          }
          this.$notify({
            title: $t('@DBA18:班长操作通知'),
            type: 'warning',
            message: msg
          })
          const nextState = message.Body.Content.nextState
          if (nextState) {
            this.changeWorkStatus(nextState)
          }
        }
      },
      handleExtraction(command) {
        // 相同状态下不做切换
        if (this.currentStatus === command) {
          return
        }
        // 小休状态提交小休记录
        if (CUBE.permission.workStatus && CUBE.permission.workStatus.cancel_work_status) {
          const restForm = {
            reason: '其他',
            explain: ''
          }
          this.$store.commit('SET_REST_LOG', restForm)
        } else {
          if (command === EngineerStatus.Rest && !this.$refs.restForms.restForm.reason) {
            this.restVisible = true
            return
          }
        }
        this.changeWorkStatus(command).then(() => {
          this.$message.success($t('@DBA18:切换状态成功'))
        }).catch(() => {
          this.$message.error($t('@DBA18:切换工作状态失败'))
        })
      }
    }
  }
</script>

<style lang='scss' type="text/scss" scoped>
  .status-switch {
    font-size: 16px;
    line-height: 50px;
    display: inline-block;
    margin-left: 15px;
    .status {
      line-height: 50px;
    }
    .status-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
      display: inline-block;
    }
  }
  .status-change {
    min-width: 85px;
  }
</style>
