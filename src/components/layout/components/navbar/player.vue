<template>
  <el-popover
    ref="popover"
    placement="bottom-end"
    width="400"
    trigger="hover"
    popper-class="player"
  >
    <span v-show="title" class="title">{{ title }}</span>
    <span class="text-right">
      <!--      <a-->
      <!--        :disabled="!src"-->
      <!--        class="el-button el-button&#45;&#45;text el-button&#45;&#45;small"-->
      <!--        :class="{ 'is-disabled': !src }"-->
      <!--        target="_blank"-->
      <!--        :href="src"-->
      <!--        download-->
      <!--      >{{ $t('@A3044:下载') }}</a>-->
      <a
        class="el-button el-button--text el-button--small"
        @click="close"
      >{{ $t('@A3044:关闭') }}</a>
    </span>
    <audio
      ref="audio"
      controls
      :controlsList="isDownload"
      :src="src"
      preload="auto"
      @play="onPlay"
      @ended="onEnd"
      @pause="onEnd"
    />
    <p>
      {{ $t('@A3044:播放速度：') }}
      <el-button size="mini" :type="rate === 1 ? 'success' : 'info'" @click="rate = 1">X1</el-button>
      <el-button size="mini" :type="rate === 1.5 ? 'success' : 'info'" @click="rate = 1.5">X1.5</el-button>
      <el-button size="mini" :type="rate === 2 ? 'success' : 'info'" @click="rate = 2">X2</el-button>
    </p>
    <el-button v-show="src && display!== 'none'" slot="reference" type="success" size="mini" @click="play">
      <svg-icon v-if="!playing" icon-class="audio" />
      <svg-icon v-else icon-class="audioPlay" />
      {{ playing ? $t('@A3044:播放中') : $t('@A3044:已停止') }}
    </el-button>
  </el-popover>
</template>

<script type="text/ecmascript-6">
  import { mapGetters } from 'vuex'

  export default {
    name: 'NavPlayer',
    data() {
      return {
        src: '',
        title: '',
        rate: 1,
        // rateSupport: Audio.prototype.playbackRate
        playing: false,
        playerId: this._uid,
        display: 'block'// 播放组件展示
      }
    },
    computed: {
      // 复用聊天页面中的语音播放消息，控制全局唯一播放
      ...mapGetters('call', ['audioPlaying']),
      ...mapGetters(['buttonPermission']),
      isDownload() {
        return this.buttonPermission('AudioDownload') ? '' : 'nodownload'
      }
    },
    watch: {
      'rate': function(rate) {
        if (this.$refs.audio) {
          this.$refs.audio.playbackRate = rate
        }
      },
      'audioPlaying': function(playItem) {
        if ((playItem && this.playerId !== playItem && this.playing) || (playItem === false && this.playing)) {
          this.playing = false
          this.$refs.audio.pause()
          this.$refs.audio.currentTime = 0
        }
      }
    },
    mounted() {
      window.addEventListener('CubeAppAudio.play', (event) => {
        if (!event.detail) {
          return
        }
        if (this.$refs && this.$refs.audio) {
          this.$refs.audio.pause()
          this.$refs.audio.currentTime = 0
        }
        this.src = event.detail.src
        this.title = event.detail.title
        // 如果传递过来uid就使用传递过来，否则使用组件的_uid
        if (event.detail.uid) {
          this.playerId = event.detail.uid
        }
        this.display = event.detail.display ? event.detail.display : 'block'
        this.rate = 1

        this.playing = false

        this.play()
      })
      window.addEventListener('CubeAppAudio.close', (event) => {
        this.close()
      })
    },
    methods: {
      play() {
        this.$nextTick(() => {
          if (this.playing) {
            this.$refs.audio.pause()
            // this.$refs.audio.currentTime = 0
            this.$store.commit('call/AUDIO_PLAYING', false)
          } else {
            this.$refs.audio.play()
            this.$store.commit('call/AUDIO_PLAYING', this.playerId)
          }
          this.playing = !this.playing
        })
      },
      onPlay() {
        this.$store.commit('call/AUDIO_PLAYING', this.playerId)
        this.playing = true
      },
      onEnd() {
        this.$store.commit('call/AUDIO_PLAYING', false)
        this.playing = false
      },
      close() {
        this.onEnd()
        this.src = ''
        this.title = ''
        this.$refs.popover.doClose()
      }
    }
  }
</script>

<style lang='scss' type="text/scss" scoped>
  .player {
    height: 40px;
    vertical-align: bottom;
    display: inline-block;
    .title {
      max-width: 250px;
    }
    span {
      line-height: 40px;
      height: 40px;
      vertical-align: top;
      display: inline-block;
      margin-right: 15px;
    }
    audio {
      height: 40px;
      width: 100%;
    }
    audio::-webkit-media-controls-enclosure {
      background-color: #bdcde7;
      border-radius: 5px;
    }
  }
</style>
