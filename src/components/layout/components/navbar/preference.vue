<template>
  <el-dialog
    :title="$t('@52B99:偏好设置')"
    :visible.sync="settingDialogVisible"
    custom-class="el-dialog-aside el-dialog-aside__small"
    :close-on-click-modal="false"
  >
    <el-alert
      v-if="localStoreDisabled"
      :title="$t('@52B99:偏好不能保存')"
      :description="$t('@52B99:处于无痕模式的浏览器，或者较高的安全设置，会导致偏好不能保存')"
      :closable="false"
      type="info"
    />
    <el-form label-width="150px" :disabled="localStoreDisabled">
      <section>
        <h3>{{ $t('@52B99:文本工作台设置') }}</h3>
        <el-form-item :label="$t('@52B99:新用户提示音')">
          <el-switch v-model="preference.playSoundForSession" class="el-switch--mark" />
        </el-form-item>
        <el-form-item :label="$t('@52B99:新消息提示音')">
          <el-switch v-model="preference.playSoundForMsg" class="el-switch--mark" />
        </el-form-item>
        <el-form-item :label="$t('@52B99:工单提示音')">
          <el-switch v-model="preference.playSoundForOrder" class="el-switch--mark" />
        </el-form-item>
        <el-form-item>
          <template slot="label">
            {{ $t('@52B99:桌面通知') }}
            <el-popover
              trigger="hover"
              :content="$t('@52B99:当浏览器窗口最小化状态下，有新用户或者新消息将发起桌面通知，仅支持FireFox、Chrome 等现代浏览器')"
            >
              <svg-icon slot="reference" icon-class="infor" />
            </el-popover>
          </template>
          <el-switch v-model="preference.desktopNotify" class="el-switch--mark" @change="handleDesktopNotify" />
        </el-form-item>
        <el-form-item v-if="!$isCloud" label="文本对话时间展示">
          <el-select v-model="preference.timeTotalDuration" @change="onTimeChange">
            <el-option label="总对话时长" :value="true" />
            <el-option label="响应计时" :value="false" />
          </el-select>
        </el-form-item>
      </section>

      <section v-if="hasVoicePermission">
        <h3>{{ $t('@52B99:电话工作台设置') }}</h3>
        <el-form-item :label="$t('@52B99:自动接起电话')">
          <el-switch v-model="preference.phoneAutoPickup" class="el-switch--mark" />
        </el-form-item>
        <el-form-item>
          <template slot="label">
            {{ $t('@52B99:自动就绪') }}
            <el-popover
              trigger="hover"
              :content="$t('@52B99:当挂断电话后，坐席自动就绪')"
            >
              <svg-icon slot="reference" icon-class="infor" />
            </el-popover>
          </template>
          <el-switch v-model="preference.phoneAutoReady" class="el-switch--mark" />
        </el-form-item>
        <el-form-item :label="$t('@52B99:就绪移除案面会话')">
          <el-switch v-model="preference.removeAcwSessionsBeforeReady" class="el-switch--mark" />
        </el-form-item>
        <!-- 手机随行开关 -->
        <softphone-pta />
      </section>

      <section>
        <h3>{{ $t('@52B99:通用设置') }}</h3>
        <el-form-item v-if="$isCloud" label="消息中心提示音">
          <el-switch v-model="preference.playSoundForNoticeMessage" class="el-switch--mark" />
        </el-form-item>
        <el-form-item :label="$t('@52B99:语言')">
          <el-select v-model="preference.language" @change="onLanguageChange">
            <el-option :label="$t('@52B99:中文')" value="zh_CN" />
            <el-option label="English" value="en" />
          </el-select>
        </el-form-item>
      </section>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="settingDialogVisible = false">{{ $t('@52B99:好的') }}</el-button>
    </span>
  </el-dialog>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'
  import Cookies from 'js-cookie'

  import { getLocalStorage } from '@/utils/local-storage'
  import { mapGetters } from 'vuex'
  import IM from '@call/im-proxy'
  import { IMActionType, IMNotifyType } from '@call/enum'
  import SoftphonePta from './softphone-pta'
  import { convertToDisplayMessage, convertToMessage } from '@call/convert'
  import { CUBE } from '@/configuration'

  const defaultPreference = {
    playSoundForSession: true,
    playSoundForMsg: true,
    playSoundForOrder: true, // 工单提示音
    desktopNotify: false,
    phoneAutoPickup: true,
    phoneAutoReady: false,
    removeAcwSessionsBeforeReady: false,
    language: 'zh_CN',
    playSoundForNoticeMessage: true,
    timeTotalDuration: true // 会话计时方式 默认按总时长计时
  }
  const audio = new Audio('static/sound/sound.mp3')
  export default {
    name: 'NavbarPreference',
    components: { SoftphonePta },
    props: {
      visible: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        localStoreDisabled: false,
        settingDialogVisible: false,
        preference: { ...defaultPreference }
      }
    },
    computed: {
      ...mapGetters(['engineerCode']),
      ...mapGetters('call', ['hasVoicePermission'])
    },
    watch: {
      preference: {
        deep: true,
        handler(val) {
          getLocalStorage(this.engineerCode).setItem('PREFERENCE', JSON.stringify(val))
        }
      },
      // 'preference.language': function(lang) {
      //   // this.$store.dispatch('app/setLanguage', lang)
      //   this.$i18n.locale = lang
      // },
      visible(val) {
        if (val) {
          this.settingDialogVisible = true
        }
      },
      settingDialogVisible(val) {
        !val && this.$emit('update:visible', false)
      }
    },
    mounted() {
      // 检查本地存储状态，无法在无痕模式浏览器下存储偏好
      this.localStoreDisabled = !getLocalStorage(this.engineerCode).localMode

      const localPreference = getLocalStorage(this.engineerCode).getItem('PREFERENCE')
      if (JSON.stringify(this.preference) !== localPreference) {
        this.preference = Object.assign(defaultPreference, JSON.parse(localPreference))
        // 中文语言标识符统一，临时过渡下
        if (this.preference.language === 'zh') {
          this.preference.language = 'zh_CN'
        }
      }
      // 桌面通知权限处理
      this.checkDesktopNotifyPermission()
      // IM
      IM.addEventListener(IMActionType.Notification, this.handleNotification)
      IM.addEventListener(IMActionType.NoticeMessage, this.handleNoticeMessage)
      IM.addEventListener(IMActionType.ChatMessage, this.handleMessage)

      // 页面显隐控制
      document.addEventListener('visibilitychange', this.handlePageVisible)
    },
    beforeDestroy() {
      IM.removeEventListener(IMActionType.Notification, this.handleNotification)
      IM.removeEventListener(IMActionType.NoticeMessage, this.handleNoticeMessage)
      IM.removeEventListener(IMActionType.ChatMessage, this.handleMessage)
      document.removeEventListener('visibilitychange', this.handlePageVisible)
    },
    methods: {
      handleMessage(message) {
        if (this.preference.playSoundForMsg) {
          this.soundNotify()
        }
        this.desktopNotify(message)
      },
      handleNotification(message, messageType, bodyType) {
        if (bodyType === IMNotifyType.CreateSession) {
          if (this.preference.playSoundForSession) {
            this.soundNotify()
          }
          this.desktopNotify(message, true)
        }
        if (bodyType === IMNotifyType.Reminder) {
          if (this.preference.playSoundForOrder) {
            this.soundNotify()
          }
        }
      },
      handleNoticeMessage() {
        if (this.preference.playSoundForNoticeMessage) {
          this.soundNotify()
        }
      },
      checkDesktopNotifyPermission() {
        if (!('Notification' in window)) {
          return Promise.reject($t('@52B99:当前浏览器不支持桌面通知'))
        }
        if (!this.preference.desktopNotify) {
          return Promise.resolve('default')
        }
        return Notification.requestPermission().then(result => {
          if (result !== 'granted') {
            this.preference.desktopNotify = false
          }
          return result
        })
      },
      // 桌面通知权限处理
      handleDesktopNotify(val) {
        if (!val) {
          return
        }
        this.checkDesktopNotifyPermission().then(result => {
          if (result === 'denied') {
            this.$message.warning($t('@52B99:桌面通知未被授权，请重试'))
            this.preference.desktopNotify = false
            return
          }
          if (result === 'default') {
            this.$message.info($t('@52B99:桌面通知未被授权，请重试'))
            return
          }
          this.$message.success($t('@52B99:桌面通知授权成功'))
          // Do something with the granted permission.
        }).catch(this.$message.error)
      },
      soundNotify() {
        audio.currentTime = 0
        audio.play()
      },
      desktopNotify(imMessage, isNewSession = false) {
        if (document.visibilityState === 'visible') {
          return
        }
        const title = isNewSession ? $t('@52B99:新用户提醒') : $t('@52B99:新消息提醒')
        // document title 提醒
        document.title = `【${title}】` + CUBE.enterprise.name
        // desktop notify
        if (this.preference.desktopNotify) {
          let body = $t('@52B99:新用户提醒')
          if (!isNewSession) {
            const message = convertToMessage(imMessage, {})
            body = $t('@52B99:收到新消息：') + convertToDisplayMessage(message, false)
          }
          new Notification(title, {
            body: body,
            icon: '/static/images/logo-cube.png'
          })
        }
      },
      onTimeChange() {
        location.reload()
      },
      onLanguageChange() {
        this.$i18n.locale = this.preference.language
        Cookies.set('lang', this.preference.language)
        // todo 提示刷新
        sessionStorage.removeItem('tag-view:views')
        location.reload()
      },
      handlePageVisible() {
        if (document.visibilityState === 'visible') {
          document.title = CUBE.enterprise.name
        }
      }
    }
  }
</script>
