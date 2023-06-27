<template>
  <div class="robot-container">
    <el-tooltip content="智能助手" placement="top">
      <div class="robot-button-container">
        <div class="robot-button" @click="dialogVisible = true">
          <svg-icon icon-class="robot-lenovo" />
        </div>
      </div>
    </el-tooltip>
    <el-dialog
      title="机器人"
      :modal="false"
      custom-class="el-dialog-aside el-dialog-aside__robot"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
    >
      <template slot="title">
        <img src="/static/images/logo-robot.png" width="87" height="84">
        <div>
          <p><b>Hi {{ allInfo.name }}</b></p>
          <p>欢迎使用智能助手</p>
        </div>
      </template>
      <ul ref="list" class="chat-list" @click.prevent="clickAction">
        <transition-group name="fade" mode="out-in">
          <li
            v-for="message in messages"
            :key="message.id"
            :class="[(message.isRobot || message.isEngineer) ? 'chat-engineer' : 'chat-user']"
            class="chat-item clearfix"
          >
            <p v-if="message.isEngineer" class="chat-timestamp">
              {{ message.name }} {{ message.time }}
            </p>
            <p v-else class="chat-timestamp">
              <svg-icon v-if="message.isRobot" icon-class="robot-lenovo" />
              {{ message.isRobot ? '小乐' : '我' }} {{ message.time }}
            </p>
            <div class="chat-msg-content">
              <div class="chat-content">
                <div v-if="message.Type === 'Image'" class="chat-content__answer">
                  <img :src="message.content" alt="查看图片">
                </div>
                <div v-else-if="message.answerType !== '11'" class="chat-content__answer" v-html="message.content" />
                <div v-if="message.relevantQuestion" class="chat-content__relevant">
                  <div v-html="message.relevantQuestion.header" />
                  <ul v-if="message.relevantQuestion">
                    <li
                      v-for="question in message.relevantQuestion.name"
                      class="link-type"
                      @click="askAction(question)"
                    >{{ question }}</li>
                  </ul>
                </div>
                <div v-if="message.answerEvaluate" class="chat-content__evaluate">
                  <div v-html="message.answerEvaluate.header" />
                  <button :disabled="loading('robot/answerEvaluation')" @click="clickEvaluateAction(message.askLogId, 2)">
                    <img class="chat-content__evaluateimage" src="/static/images/robot/icon-bad.png" alt="没帮助">{{ message.answerEvaluate.unsolvedTag }}
                  </button>
                  <!--
                  <button :disabled="loading('robot/answerEvaluation')" @click="clickEvaluateAction(message.askLogId, 1)">
                    <img class="chat-content__evaluateimage" src="/static/images/robot/icon-good.png" alt="有帮助">{{ message.answerEvaluate.solvedTag }}
                  </button>
                   -->
                </div>
              </div>
            </div>
          </li>
        </transition-group>
      </ul>
      <span slot="footer" class="dialog-footer">
        <el-autocomplete
          ref="input"
          v-model="input"
          :fetch-suggestions="querySearchAction"
          placeholder="请输入简短的文字提问哦！"
          type="textarea"
          rows="5"
          resize="none"
          :hide-loading="true"
          :trigger-on-focus="false"
          :select-when-unmatched="true"
          :disabled="loading('robot/robotqa')"
          @select="selectAction"
        >
          <template slot-scope="{ item }">
            <div v-html="item.text" />
          </template>
        </el-autocomplete>
        <el-button type="primary" :disabled="loading('robot/robotqa')" @click="askAction()">发 送</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script type="text/ecmascript-6">
  import { getDateFormat, isProd, scrollTo, uuid } from '@/utils'
  import request from '@/utils/request'
  import { mapGetters } from 'vuex'
  // import { getLocalStorage } from '@/utils/local-storage'
  import {
    closeRobot,
    getChatToken,
    getCurrentStatus,
    getSign,
    robotLogin,
    sendMessageToEngineer,
    getRobotUserId
  } from '@/views/layout/components/robot/api'
  import { IMActionType, MessageType } from '@call/enum'
  // import { getToken } from '@/utils/auth'
  import { initSocket } from '@/views/layout/components/robot/chat-ws'

  // 用于机器人交互的消息结构
  const createMessage = function(content, isRobot = false, data = {}) {
    return {
      ...data,
      isRobot,
      content,
      id: uuid('message'),
      time: getDateFormat()
    }
  }
  /**
   * 用于和人工交互的消息结构
   * "MessageBody": {
   *   "SessionID": "4F6ITZp1-rN",
   *   "ChatRoute": "webchat",
   *   "ClientType": "engineer",
   *   "SendTime": "2022-01-14 14:48:25",
   *   "message_from": "close",
   *   "Body": {
   *     "Type": "Text",
   *     "Content": {
   *       "Text": "当前会话已结束，请在右侧点评区域对我们的服务做出评价~",
   *       "Emotion": 2.5
   *     }
   *   }
   * }
   * @param message
   * @param engineerName
   * @param engineerCode
   * @return {*&{isEngineer: boolean, id: string, time: (string|*)}}
   */
  const createEngineerMessage = function(message, engineerName, engineerCode) {
    if (typeof message === 'string') {
      message = {
        MsgBody: {
          MessageBody: {
            Body: {
              Content: {
                Text: message
              }
            },
            SendTime: getDateFormat()
          }
        }
      }
    }
    const data = message.MsgBody.MessageBody
    return {
      ...data.Body,
      content: data.Body.Content.Text,
      name: !engineerName ? '系统' : `${engineerName}(${engineerCode})`,
      isEngineer: true,
      id: uuid('message'),
      time: data.SendTime
    }
  }
  // const transferKeywords = ['人工', '转人工']
  const UserStatus = {
    Defualt: 1,
    Robot: 3,
    ServiceQueuing: 4,
    ServiceChatting: 5,
    Unauthorized: 10999
  }
  const UserStatusMap = {
    [UserStatus.Defualt]: '',
    [UserStatus.Robot]: '智能机器人已经在为您服务...',
    [UserStatus.ServiceQueuing]: '人工排队中...',
    [UserStatus.ServiceChatting]: '人工会话中...',
    [UserStatus.Unauthorized]: '身份不合法'
  }
  // const MessageBodyContentMap = {
  //   Image: 'PicUrl',
  //   Text: 'Content',
  //   Video: 'MediaUrl',
  //   File: 'File'
  // }
  export default {
    name: 'RobotCloud',
    data() {
      return {
        dialogVisible: false,
        messages: [],
        sessionId: uuid('robot'),
        input: '',
        // 人工服务信息
        engineerService: {
          skill: '',
          access_id: '',
          project_id: '',
          status: UserStatus.Defualt,
          cube_uid: '',
          token: '',
          userSig: '',
          socket: null,
          engineer_code: '',
          engineer_name: ''
        },
        userIdentity: 'scengineerss',
        host: 'https://x.lenovo.com.cn'
      }
    },
    computed: {
      ...mapGetters(['allInfo']),
      ...mapGetters(['engineerCode']),
      ...mapGetters('api', ['loading']),
      inEngineerServiceChat() {
        return [UserStatus.ServiceChatting, UserStatus.ServiceQueuing].includes(this.engineerService.status)
      }
    },
    watch: {
      messages() {
        if (this.dialogVisible) {
          this.$nextTick(() => {
            const ul = this.$refs.list
            // ul.scrollTop = ul.scrollHeight
            scrollTo(ul, ul.scrollHeight, 400, 'top')
          })
        }
      },
      dialogVisible(visible) {
        if (!visible) {
          return
        }
        if (!this.messages.length) {
          this.welcome()
        }
        setTimeout(() => {
          this.$refs.input.focus()
        }, 600)
      }
    },
    mounted() {
      // 获取请求机器人的userIdentity
      getRobotUserId().then((res) => {
        const children = res && res.data && res.data[0] && res.data[0].children || []
        for (let i = 0, len = children.length; i < len; i++) {
          const item = children[i]
          if (item.paraCode === 'userIdentity') this.userIdentity = item.paraValue
          if (item.paraCode === 'host') this.host = item.paraValue
        }
        this.init()
      }).catch((e) => {
        console.log('getRobotUserId error', e)
        this.init()
      })
    },
    beforeDestroy() {
      delete window.sendQuestion
      delete window.manual
      if (this.engineerService.socket) {
        this.engineerService.socket.close()
        this.engineerService.socket = null
      }
    },
    methods: {
      init() {
        if (window.sendQuestion) {
          return
        }
        // 机器人问答里调用的全局方法：发送问题
        window.sendQuestion = (a, b) => {
          this.askAction(a, b)
        }
        // 机器人问答里调用的全局方法：转人工
        window.manual = (skill, access_id, project_id) => {
          if (!skill || !access_id) {
            return this.$message.warning('请在小乐后台正确配置转接人工的技能组或通路ID')
          }
          if (this.$isProject && !project_id) {
            return this.$message.warning('请在小乐后台正确配置转接人工的技能组隶属项目ID')
          }
          this.engineerService.skill = skill
          this.engineerService.access_id = access_id
          this.engineerService.project_id = project_id
          if (this.inEngineerServiceChat) {
            this.messages.push(createMessage(UserStatusMap[this.engineerService.status], true))
          } else {
            this.sendMessageToEngineerService(0)
          }
        }
      },
      // 首次显示聊天框时，检查是否处于人工服务中，否则展示机器人欢迎语
      welcome() {
        // const inEngineerService = getLocalStorage().getItem('ROBOT_IN_ENGINEER_SERVICE')
        // if (inEngineerService) {
        //   this.prepareEngineerService()
        // }
        this.prepareEngineerService().then(socket => {
          socket.on('message', this._messageHandle)
          this.updateEngineerServiceStatus().then(() => {
            if (this.inEngineerServiceChat) {
              this.messages.push(createEngineerMessage(UserStatusMap[this.engineerService.status]))
            }
            // 如果判断被卡在机器人会话中时，主动退出魔方的机器人对话
            if (this.engineerService.status === UserStatus.Robot) {
              closeRobot().then(() => {
                this.updateEngineerServiceStatus()
              })
            }
          })
        })
        this._request('welcome').then(res => {
          this.messages.push(createMessage(res.data.welcome, true))
        })
      },
      askAction(question = '', displayQuestion = '') {
        question = question || this.input
        if (!question.trim()) {
          return this.$message.warning('请输入问题')
        }

        // 强制让auto complate 组件释放提示
        this.$refs.input.handleInput('')
        this.messages.push(createMessage(displayQuestion || question))
        this.input = ''

        this.updateEngineerServiceStatus()

        // 已处于人工逻辑
        if (this.inEngineerServiceChat) {
          this.sendMessageToEngineerService(question)
          return
        }

        // 机器人问答逻辑
        this._request('robotqa', {
          userQuestion: question
        }).then(res => {
          this.messages.push(createMessage(res.data.answer, true, res.data))
        }).finally(() => {
          this.$refs.input.focus()
        })

        // // 转人工逻辑开始
        // if (transferKeywords.includes(question.trim())) {
        //   if (this.inEngineerServiceChat) {
        //     this.messages.push(createMessage(UserStatusMap[this.engineerService.status], true))
        //   } else {
        //     this.sendMessageToEngineerService(0).then(() => {
        //       this.engineerService.status = UserStatus.ServiceQueuing
        //     })
        //   }
        // } else {
        //   // 机器人问答逻辑
        //   this._request('robotqa', {
        //     userQuestion: question
        //   }).then(res => {
        //     this.messages.push(createMessage(res.data.answer, true, res.data))
        //   }).finally(() => {
        //     this.$refs.input.focus()
        //   })
        // }
      },
      clickAction(e) {
        const nodeName = e.target.nodeName
        if (nodeName === 'A') {
          // 文章类型
          if (e.target.href && !e.target.onclick) {
            this.$router.push({
              path: '/iframe',
              query: {
                url: e.target.href
              }
            })
            this.dialogVisible = false
          }
          e.stopPropagation()
        }
        // 图片预览
        if (nodeName === 'IMG' && e.target.className !== 'chat-content__evaluateimage') {
          window.dispatchEvent(new CustomEvent('CubeAppImageViewer.show', {
            detail: [e.target.src]
          }))
        }
      },
      clickEvaluateAction(id, evaluationState) {
        this._request('answerEvaluation', {
          id, evaluationState
        }).then(res => {
          this.messages.push(createMessage(res.data.info, true))
          const target = this.messages.find(message => message.askLogId === id)
          target.answerEvaluate = null
        })
      },
      querySearchAction(input, callback) {
        this._request('intellisense', {
          userQuestion: input,
          prefix: `<b style="color: #f44336;">`,
          suffix: `</b>`
        }).then(res => {
          callback(res.data.results)
        })
      },
      selectAction(item) {
        this.askAction(item.question)
        setTimeout(() => {
          this.input = ''
        }, 500)
      },
      // 转人工的前置准备，建立连接
      // 服务云可能不能获取坐席手机号，导致无法辨认用户信息
      prepareEngineerService() {
        if (this.engineerService.socket) {
          return Promise.resolve(this.engineerService.socket)
        }
        return robotLogin(this.allInfo.phone).then(res => {
          this.engineerService.cube_uid = res.data.cube_uid
          this.engineerService.token = res.data.token
          return getSign()
        }).then(res => {
          this.engineerService.userSig = res.data
          return initSocket(res.data).then(socket => {
            this.engineerService.socket = socket
            return socket
          })
        }).catch(this.$message.error)
      },
      updateEngineerServiceStatus() {
        return getCurrentStatus().then(res => {
          this.engineerService.status = parseInt(res.statusCode)
          if (this.engineerService.status === UserStatus.ServiceChatting) {
            this.engineerService.engineer_code = res.data.code
            this.engineerService.engineer_name = res.data.name
          }
          return this.engineerService.status
        })
      },
      sendMessageToEngineerService(content) {
        const messageBody = {
          message_body: {
            accesses_id: this.engineerService.access_id,
            Skill: this.engineerService.skill,
            MsgType: MessageType.Text.toLowerCase(),
            Content: content,
            project_id: this.engineerService.project_id,
            CreateTime: Date.parse(new Date()) / 1000
          },
          project_id: this.engineerService.project_id,
          token: getChatToken()
        }
        return sendMessageToEngineer(messageBody).catch(this.$message.error)
      },
      _messageHandle(message) {
        if (this.$get(message[0], 'MsgBody.MessageType') !== IMActionType.ChatMessage) {
          return
        }
        // 判定是否正式进入人工会话
        if (this.engineerService.status !== UserStatus.ServiceChatting) {
          if (this.$get(message[0], 'MsgBody.MessageBody.SessionID')) {
            this.engineerService.status = UserStatus.ServiceChatting
            this.engineerService.engineer_code = this.$get(message[0], 'MsgBody.MessageBody.engineer_code')
            this.engineerService.engineer_name = this.$get(message[0], 'MsgBody.MessageBody.engineer_name')
          }
        }
        // 判定是否已关闭会话
        if (this.$get(message[0], 'MsgBody.MessageBody.message_from') === 'close') {
          this.engineerService.status = UserStatus.Defualt
        }
        this.messages.push(createEngineerMessage(message[0], this.engineerService.engineer_name, this.engineerService.engineer_code))
      },
      _request(action, data) {
        const baseUrl = isProd ? `${this.host}/api/robot/` : '/robot/'
        return request({
          url: baseUrl + action,
          // url: '/robot/' + action,
          method: 'post',
          doNotCheck: true,
          headers: {
            userIdentity: this.userIdentity
          },
          data: {
            sessionId: this.sessionId,
            platform: 'assistant',
            terminal: 'web',
            userId: this.$store.getters.engineerCode,
            ...data
          }
        }).then(res => {
          if (res.error) {
            this.$message.error('机器人助手接口出错:' + res.code + res.message)
            return Promise.reject(res)
          }
          return res
        })
      }
    }
  }
</script>

<style lang='scss' scoped>
  .robot-container {
    .robot-button-container {
      overflow-x: hidden;
      position: absolute;
      right: 0;
      bottom: 25px;
      z-index: 100;
    }

    .robot-button {
      transform: translateX(20px);
      opacity: 0.7;
      color: white;
      background-image: linear-gradient(180deg, #0061C4 0%, #0D85FF 73%);
      box-shadow: 0 3px 8px -2px #047AF1;
      border-radius: 8px 0 0 8px;
      font-size: 28px;
      width: 46px;
      height: 40px;
      line-height: 40px;
      text-align: center;
      cursor: pointer;
      transition: all .2s;
      //&:after {
      //  position: absolute;
      //  right: 20px;
      //  bottom: 10px;
      //  content: ' ';
      //  display: inline-block;
      //  width: 5px;
      //  height: 1px;
      //  border-color: white;
      //  box-shadow: 1px 1px 4px white;
      //  opacity: 0.8;
      //}

      &:hover {
        //right: 0;
        transform: translateX(0);
        opacity: 1;
      }
    }

    /deep/ .el-dialog__wrapper {
      left: calc(100vw - 550px);
    }

    /deep/ .el-dialog-aside__robot {
      box-shadow: 0 2px 20px 10px #CED5E2;

      .el-dialog__header {
        background-image: linear-gradient(134deg, #047AF1 0%, #0067CE 100%);
        color: white !important;
        height: 137px;

        img {
          float: left;
          margin-right: 20px;
        }
        p {
          font-size: 20px;
          margin: 5px 0;
        }

        .el-dialog__close {
          color: white;
        }
      }
      .el-dialog__body {
        background: #F5F7FA;
        border-radius: 6px 6px 0 0;
        margin: -32px 15px 0;
        padding: 50px 0 0;
      }
      .el-dialog__footer {
        height: 195px;
        background: #F5F7FA;
        padding: 15px;
        margin: 0 15px;
        line-height: inherit;

        .el-autocomplete {
          width: 100%;
        }
        .el-button {
          height: 48px !important;
          font-size: 18px !important;
          width: 100%;
        }
      }
    }

    $link: #3E8DDD;
    $link-hover: darken($link, 10%);
    //聊天窗口中提示文字颜色
    $chat-timestamp: #A0ADBE;
    //消息相关配置
    $message-user-bg: #fff;
    $message-user-content: #222;
    $message-engineer-bg: #047AF1;
    $message-engineer-content: #fff;
    $message-border-darken: 10%;
    $message-hover-darken: 5%;

    .chat-list {
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
      padding: 0 15px;
    }
    .chat-item {
      margin-top: 10px;

      .chat-timestamp {
        font-size: 13px;
        color: $chat-timestamp;
        display: block;
        text-align: left;
        margin-bottom: 5px;
        clear: both;
        /deep/ .svg-icon {
          font-size: 22px;
          color: $message-engineer-bg;
          margin-bottom: -3px;
          margin-right: 5px;
        }
      }

      .chat-content {
        /*max-width: 90%;*/
        /*font-family: 'SimHei';*/
        font-size: 14px;
        line-height: 20px;
        padding: 6px 8px;
        margin: 0;
        background-color: $message-user-bg;
        border: 1px solid darken($message-user-bg, $message-border-darken);
        float: left;
        border-radius: 5px;
        position: relative;
        cursor: default;
        color: $message-user-content;
        word-break: break-word;

        transition: background-color 200ms, border-color 200ms;

        /deep/ p {
          margin: 0;
        }
        /deep/ a {
          color: $link !important;
        }
        /deep/ img {
          cursor: pointer;
        }
        /deep/ b.keyword {
          color: $link;
        }

        // 角标基础样式
        &:before {
          content: "";
          width: 0;
          height: 0;
          border: 6px solid transparent;
          position: absolute;
          top: 10px;
          z-index: 1;
        }

        &:after {
          content: "";
          width: 0;
          height: 0;
          border: 6px solid transparent;
          position: absolute;
          top: 10px;
          z-index: 2;
        }

        .chat-content__answer + .chat-content__relevant {
          border-top: 1px solid #DCDFE6;
          margin-top: 5px;
          padding-top: 5px;
        }
        .chat-content__evaluate {
          border-top: 1px solid #DCDFE6;
          margin-top: 5px;
          padding-top: 5px;
          div {
            color: #7D87A5;
          }
          button {
            line-height: 26px;
            margin-top: 5px;
            margin-bottom: 5px;
            vertical-align: middle;
            padding-left: 5px;
            padding-right: 10px;
            background: #F5F7FA;
            border: 1px solid #E9ECF5;
            border-radius: 2px;
            cursor: pointer;
            &:hover {
              background: #dde8fa;
            }
            img {
              width: 18px;
              height: 18px;
              margin-right: 10px;
              vertical-align: sub;
            }
          }
        }
      }

      .chat-msg-content {
        position: relative;
        display: inline-block;
        max-width: 80%;
        padding-left: 5px;
        padding-right: 5px;

        p > a {
          color: $link !important;
        }
      }

      &.chat-engineer {
        .chat-content {
          &:hover {
            background: darken($message-user-bg, $message-hover-darken);
          }

          // :before style display like border
          &:before {
            border-right-color: darken($message-user-bg, $message-border-darken);
            left: -13px;
          }

          &:after {
            border-right-color: $message-user-bg;
            left: -12px;
          }

          // https://stackoverflow.com/questions/5777210/how-to-write-hover-condition-for-abefore-and-aafter
          &:hover::after {
            border-right-color: darken($message-user-bg, $message-hover-darken);
          }
        }

        .chat-msg-content {
          float: left;
        }
      }

      &.chat-user {
        .chat-timestamp {
          text-align: right;
        }

        .chat-content {
          float: right;
          background-color: $message-engineer-bg;
          border: 1px solid darken($message-engineer-bg, $message-border-darken);
          color: $message-engineer-content;

          /deep/ a {
            color: $link;
            &:hover {
              color: $link-hover;
            }
          }

          &:hover {
            background: darken($message-engineer-bg, $message-hover-darken);
          }

          // :before style display like border
          &:before {
            border-left-color: darken($message-engineer-bg, $message-border-darken);
            right: -13px;

            a {
              color: $link;
            }
          }

          &:after {
            border-left-color: $message-engineer-bg;
            right: -12px;
          }

          &:hover::after {
            border-left-color: darken($message-engineer-bg, $message-hover-darken);
          }
        }

        .chat-msg-content {
          float: right;
        }
      }
    }
  }
</style>
