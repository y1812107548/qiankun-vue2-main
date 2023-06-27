<template>
  <cube-video-call-workbench
    v-if="chatAudio"
    ref="cubeVideoCall"
    :i-m-server="IM"
    :request="request"
    :users-config="usersConfig"
    :from-account="$store.state.user.allInfo.code"
  />
  <!--  <cube-video-call-workbench-->
  <!--    v-if="chatAudio"-->
  <!--    ref="cubeVideoCall"-->
  <!--    :i-m-server="IM"-->
  <!--    :request="request"-->
  <!--    :config="defaultVideoConfig"-->
  <!--    :from-account="$store.state.user.allInfo.code"-->
  <!--    :to-account="currentSession ? currentSession.cube_uid: ''"-->
  <!--    :users-config="usersConfig"-->
  <!--    :send-message="sendMessageCall"-->
  <!--  />-->
</template>
<script type="text/ecmascript-6">

  import { cubeVideoCallWorkbench } from 'cube-video-call'
  import request from '@/utils/request'
  import { CUBE } from '@/configuration'
  import { mapGetters } from 'vuex'

  const IM = window.cubeim
  export default {
    components: { cubeVideoCallWorkbench },

    data() {
      return {
        IM,
        request,
        chatAudio: CUBE.permission['chat-audio'], // 是否配置视频功能
        useVideo: false // 聊天中视频的按钮是否显示
      }
    },
    computed: {
      ...mapGetters('call', ['currentSession', 'currentSessionID', 'userInfo']),
      ...mapGetters(['allInfo']),
      usersConfig() {
        console.log('currentSessionID=', this.currentSessionID)
        console.log('音视频组件初始化$store.state.user.allInfo.code=', this.$store.state.user.allInfo)
        let userInfo = this.userInfo
        if (this.currentSession) {
          userInfo = {
            user_avatar: this.currentSession.user_avatar,
            avatar: this.currentSession.user_avatar,
            user_name: this.currentSession.user_name || this.currentSession.customer_name
          }
        }
        const obj = {
          userInfo,
          engineer: this.$store.state.user.allInfo,
          sessionId: this.currentSessionID,
          projectId: this.currentSession ? this.currentSession.project_id : ''
        }
        return obj
      }
    },
    mounted() {
      const sendVideo = (options, style = 'video') => {
        console.log('发起视频通话')
        this.$refs.cubeVideoCall.init(options, style)
      }
      this.$store.commit('call/SET_SENDVIDEOHANDLE', sendVideo)
    }

  }

</script>
