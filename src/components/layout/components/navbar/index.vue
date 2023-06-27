<template>
  <div>
    <div class="navbar flex-wrp flex-between flex-align-center">
      <div class="flex-wrp flex-align-center pl10">
        <hamburger :toggle-click="toggleSideBar" :is-active="sidebar.opened" class="flex-wrp flex-align-center" />
        <span class="brand">
          <img :src="enterprise.logo">
          <span class="font">{{ enterprise.name }}</span>
        </span>
        <div v-if="CUBE.permission.cube_diy && CUBE.permission.cube_diy.check_in_check_out_switch">
          <button v-if="!state.sign" round class="qian signBtn" @click="handleUnsigned">
            <p class="unsign"><svg-icon icon-class="unSign" class="icon imgPop" /></p>未签入&nbsp;
          </button>
          <button v-else round class="qian signBtn" @click="handleSigned">
            <p class="sginp"><span /><svg-icon icon-class="Sgin" class="icon imgPop" />已签入&nbsp;</p>
          </button>
        </div>
      </div>

      <announce class="announce-box" />

      <div class="right-menu flex-wrp flex-align-center">
        <div v-if="memoryInfo.size" class="memoryInfo">
          <el-tag :type="memoryInfo.overflow?'danger':'success'">{{ memoryInfo.size }}</el-tag>
        </div>
        <message-center v-if="$isCloud" />
        <!-- 服务云下，没有呼叫中心权限时，不需要下列功能 -->
        <notification v-if="!isCloudOnly" />
        <softphone v-if="!isCloudOnly" />
        <player v-if="!isCloudOnly" />
        <status-switch v-if="!isCloudOnly" :state="state" />
        <el-dropdown trigger="hover">
          <span class="pointer">
            {{ info.name }} | {{ info.code }} <i class="el-icon-caret-bottom" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item disabled>{{ $t('@DBA18:登录时间：') }} {{ info.last_login_time }}</el-dropdown-item>
            <el-dropdown-item icon="el-icon-setting" @click.native="settingDialogVisible = true">{{ $t('@DBA18:偏好设置') }}</el-dropdown-item>
            <el-dropdown-item icon="el-icon-document" @click.native="messageLogDialogVisible = true">{{ `${$t('@DBA18:系统日志')}` }}</el-dropdown-item>
            <el-dropdown-item v-if="hide_edit_password" icon="el-icon-user" divided @click.native="showChangePassword = true">{{ $t('@DBA18:修改密码') }}</el-dropdown-item>
            <!-- <el-dropdown-item v-if="$isCloud" icon="el-icon-document" @click.native="privateProtocolDialogVisible = true">查看隐私协议</el-dropdown-item> -->
            <el-dropdown-item v-if="logoutable" icon="el-icon-switch-button" @click.native="logout"><span class="danger">{{ $t('@DBA18:退出登录') }}</span></el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <message-log :visible.sync="messageLogDialogVisible" @on-close="messageLogDialogVisible = false" />
      </div>
    </div>

    <preference :visible.sync="settingDialogVisible" />
    <change-password
      v-if="showChangePassword"
      @closeAlert="showChangePassword = false"
    />

    <robot-cloud v-if="$isCloud && hasPermission('EngineerAssistant')" />
    <el-dialog
      title="安全隐私协议"
      :visible.sync="privateProtocolDialogVisible"
      width="800px"
      append-to-body
    >
      <iframe src="https://doc.lenovo.com.cn/scloud/privacy.htm" style="height: 70vh;border: 1px solid darkgray;" width="100%" frameborder="0" />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="privateProtocolDialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import { $t } from '@/lang/static'

  import { mapActions, mapGetters } from 'vuex'
  import Hamburger from '@/components/Hamburger/index'
  import MessageLog from '@/components/MessageLog/index'
  import ChangePassword from './change-password'
  import ChangePasswordCloud from './change-password-cloud'
  import Preference from './preference'
  import Notification from './im-notification'
  import Softphone from './softphone'
  import Announce from './announcement'
  import Player from './player'
  import MessageCenter from './message-center'
  import { CUBE } from '@/configuration'
  import { isCloud } from '@/utils'
  import StatusSwitch from '@/views/layout/components/navbar/status-switch'
  import RobotCloud from '@/views/layout/components/robot'
  import { SessionState, ClientType } from '@call/enum'
  import { updateSignStatus, getSignStatus } from '@/api/customization'

  // session key
  // const STATUS_BEFORE_REFRESH = 'STATUS_BEFORE_REFRESH'

  export default {
    components: {
      RobotCloud,
      StatusSwitch,
      Hamburger,
      MessageLog,
      ChangePassword: isCloud ? ChangePasswordCloud : ChangePassword,
      Preference,
      Notification,
      Player,
      Softphone,
      Announce,
      // AnnounceDialog,
      MessageCenter
    },

    data() {
      return {
        settingDialogVisible: false,
        messageLogDialogVisible: false,
        privateProtocolDialogVisible: false,
        logoutable: false,
        time: new Date(),

        timer: [],

        showChangePassword: false,
        enterprise: CUBE.enterprise,
        hide_edit_password: CUBE.permission.cube_diy ? !CUBE.permission.cube_diy.hide_edit_password : true,
        state: {
          sign: false,
          offLine: false
        }
      }
    },

    computed: {
      ...mapGetters([
        'isCloudOnly',
        'sidebar',
        'buttonPermission',
        'hasPermission',
        'memoryInfo'
      ]),
      ...mapGetters('call', ['sessions']),
      ...mapGetters({
        info: 'allInfo'
      }),
      inServiceSessions() {
        return Object.values(this.sessions).filter((session) => {
          return ![SessionState.Queue, SessionState.History, SessionState.LeaveMessage].includes(session.state) && session.client_type !== ClientType.Telephone
        })
      },
      inServiceSessionsPhone() {
        return Object.values(this.sessions).filter((session) => {
          return ![SessionState.Queue, SessionState.LeaveMessage].includes(session.state) && session.client_type === ClientType.Telephone && session.callState
        })
      }
    },

    watch: {
      // 提供一个通过路由的退出功能，避免多次被调起弹框
      '$route.query.cubeLogout': function(isLogout) {
        if (isLogout === 'confirm') {
          this._logoutAction()
        }
      },
      'info.offLine': function(val) {
        console.log('info.offLine', val)
        if (val) {
          this.state.sign = true
        }
      }
    },

    methods: {
      ...mapActions(['changeWorkStatus', 'LogOut', 'initEngStatus', 'showSign']),
      toggleSideBar() {
        this.$store.dispatch('toggleSideBar')
      },
      getSignState() {
        getSignStatus().then(res => {
          const boo = res.data.sign_status === 'in'
          localStorage.setItem('sign', boo)
          this.state.sign = boo
          this.showSign(boo)
        })
      },
      _logoutAction() {
        sessionStorage.removeItem('queryHomeCode')
        this.LogOut().then(() => {
          if (CUBE.permission.cube_diy.login_url) {
            window.open(CUBE.permission.cube_diy.login_url, '_self')
          } else {
            this.$router.replace('/login', () => {
              // 为了重新实例化vue-router对象 避免bug
              location.reload()
            })
          }
        })
      },
      logout() {
        this.$confirm($t('@DBA18:请确认您的所有操作已保存'), $t('@DBA18:即将退出系统'), {
          confirmButtonText: $t('@DBA18:退出'),
          cancelButtonText: $t('@DBA18:取消'),
          type: 'warning'
        }).then(() => {
          this._logoutAction()
        })
      },
      handleUnsigned() {
        if (localStorage.getItem('sign').toString() === 'true') {
          this.state.sign = true
          this.$message({
            type: 'warning',
            message: '当前已经为签入状态'
          })
          this.state.offLine = false
        } else {
          this.$confirm('是否确定签入系统？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            updateSignStatus({ sign_status: 'in' }).then(res => {
              localStorage.setItem('sign', true)
              this.state.sign = true
              this.state.offLine = true
              this.showSign(true)
              this.$message({
                type: 'success',
                message: '账号已签入!'
              })
            }).catch(err => {
              this.state.sign = true
              this.showSign(true)
              localStorage.setItem('sign', true)
              this.$message.error(err)
            })
          })
        }
      },
      handleSigned() {
        const talk = ['振铃', '通话']
        if (this.inServiceSessions.length > 0) {
          this.$message({
            type: 'warning',
            message: '当前账号文本有未关闭会话，请关闭会话后操作！'
          })
        } else if (this.inServiceSessionsPhone.length > 0 || talk.includes(sessionStorage.getItem('updateContent'))) {
          this.$message({
            type: 'warning',
            message: '当前账号语音有未结束会话，请关闭会话后操作！'
          })
        } else if (localStorage.getItem('sign').toString() === 'false') {
          this.$message({
            type: 'warning',
            message: '当前已经为签出状态'
          })
          this.state.sign = false
          this.state.offLine = false
          this.showSign(false)
          localStorage.setItem('sign', false)
        } else {
          this.$confirm('是否确定签出系统？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            updateSignStatus({ sign_status: 'out' }).then(res => {
              if (res.statusCode === 200) {
                localStorage.setItem('sign', false)
                this.state.sign = false
                this.state.offLine = true
                this.showSign(false)
                this.$message({
                  type: 'success',
                  message: '账号已签出!'
                })
              }
            }).catch(err => {
              this.state.sign = false
              this.showSign(false)
              localStorage.setItem('sign', false)
              this.$message.error(err)
            })
          })
        }
      }
    },

    mounted() {
      // 云上检查是否支持主动退出 logoutable = false
      if (this.$route.query.logoutable !== 'false') {
        this.logoutable = CUBE.permission.cube_diy ? !CUBE.permission.cube_diy.hide_logout_button : true
      }
      if (CUBE.permission.cube_diy && CUBE.permission.cube_diy.check_in_check_out_switch) {
        this.getSignState()
      }
      // 初始化 store 客服状态
      // const initEngPromise = this.initEngStatus()

      // 实验特性 先做个配置进行保留
      // if (config.system.logoutBeforeUnload) {
      //   initEngPromise.then((currentStatus) => {
      //     const sessionCurrentStatus = sessionStorage.getItem(STATUS_BEFORE_REFRESH) ? JSON.parse(sessionStorage.getItem(STATUS_BEFORE_REFRESH)) : null
      //     // 如果检测到session status 并且时间记录小于定值，则去恢复原有状态
      //     const hasRevertStatus = sessionCurrentStatus && (new Date().getTime() - sessionCurrentStatus.time < 60 * 1000)
      //     if (hasRevertStatus && sessionCurrentStatus.status !== currentStatus) {
      //       this.changeWorkStatus(sessionCurrentStatus.status)
      //     }
      //     sessionStorage.removeItem(STATUS_BEFORE_REFRESH)
      //   })
      //
      //   // 关闭浏览器时，logout，发起同步请求
      //   window.addEventListener('unload', () => {
      //     sessionStorage.setItem(STATUS_BEFORE_REFRESH, JSON.stringify({
      //       time: new Date().getTime(),
      //       status: this.currentStatus
      //     }))
      //     this.LogOut(true)
      //   }, false)
      // }
    }
  }
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  .navbar {
    height: 50px;
    line-height: 50px;
    border-radius: 0px !important;
    padding-right: 30px;
    .brand {
      padding-left: 15px;
      cursor: default;
      font-size: 20px;
      overflow: auto;

      svg {
        font-size: 30px;
        float: left;
        margin: 10px 5px 0 0;
      }

      .font {
        float: left;
      }

      img {
        height: 30px;
        float: left;
        margin: 10px 5px 0 0;
      }
    }
    .announce-box {
      margin-left: auto;
      margin-right: 30px;
      background:#EDEFF3;
      border-radius:4px;
      padding: 0px 4px;
      height: 28px;
      line-height:28px;
      width: 450px;
    }
    .signBtn{
      background: #fff;
      box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.06);
      border: 1px solid #FFF;
      font-weight: 700;
      height: 28px;
      border-radius: 14px;

      .sginp{
        background: #50C1B9;
        border-radius: 14px;
        height: 24px;
        margin: 0;
        color: #FFF;
        line-height: 25px;
        overflow: hidden;
        position: relative;
        margin-left: 2px;
        span{
          display: inline-block;
          width: 26px;
          height: 24px;
          opacity: 0.2;
          background: #17746D;
          border-radius: 14px 0px 0px 14px;
          margin-right: 4px;
          float: left;
        }
        svg{
          position: absolute;
          top: 4.5px;
          left: 6.5px;
        }
      }
      .unsign{
        display: inline-block;
        width: 24px;
        height: 24px;
        border-radius: 12px;
        background: #F0F4FB;
        margin: 0px 4px 0px 2px;
        line-height: 24px;

      }
    }
    .qian{
      padding: 0px 2px 0px 0px;
      margin-left: 16px;
    }
    .sign_img{
      width:15px;
    }
  }
</style>
