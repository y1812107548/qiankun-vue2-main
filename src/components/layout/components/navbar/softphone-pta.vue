<template>
  <el-form-item v-if="hasPtaPermission">
    <template slot="label">
      {{ $t('@BB9BD:手机随行') }}
      <el-popover
        trigger="hover"
        :content="$t('@BB9BD:将来电转接至坐席绑定的手机上。')"
      >
        <svg-icon slot="reference" icon-class="infor" />
      </el-popover>
    </template>
    <el-switch v-model="pta" class="el-switch--mark" @change="handleChange" />
  </el-form-item>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'

  import { mapGetters } from 'vuex'
  import { setPhoneEngineerPta } from '@/api/softphone-freeswitch/call-center-phone'
  import { AGENTSTATE, CALLSTATE, MessageID } from '@call/voice-freeswitch/enum'
  import { CUBE } from '@/configuration'
  import { addEventListener, removeEventListener } from '@/api/softphone-freeswitch/ws'

  export default {
    data() {
      return {
        pta: false,
        hasPtaPermission: CUBE.permission.phone.accompanying
      }
    },
    computed: mapGetters('call', ['dnInfo', 'agentState', 'callState']),
    watch: {
      'dnInfo.pta.status': function(status) {
        this.pta = status
      }
    },
    mounted() {
      this.pta = this.$get(this.dnInfo, 'pta.status', false)
      addEventListener(this.messageEventHandle)
    },
    beforeDestroy() {
      removeEventListener(this.messageEventHandle)
    },
    methods: {
      handleChange(val) {
        let error = ''
        if (AGENTSTATE.READY === this.agentState) {
          error = $t('@BB9BD:不能在就绪状态下设置手机随行功能')
        }
        if (CALLSTATE.Released !== this.callState) {
          error = $t('@BB9BD:不能在通话状态下设置手机随行功能')
        }
        if (error) {
          this.pta = !val
          return this.$message.warning(error)
        }

        const tip = val ? $t('@BB9BD:打开') : $t('@BB9BD:关闭')
        this.$confirm(`${tip}【${this.dnInfo.agentID}】${$t('@BB9BD:手机随行功能，请确认')}`).then(() => {
          setPhoneEngineerPta(val ? 1 : 0).then((res) => {
            this.$message.success(`${$t('@BB9BD:随行功能已经在号码【')}${res.data[1]}】` + tip)
            // 只能在非就绪非通话情况下打开手机随行
            // 后端判定并报错后，恢复原先状态
            this.$store.commit('call/SET_VOICE_DNINFO', {
              pta: {
                status: Boolean(res.data[2])
              }
            })
            this.pta = Boolean(res.data[2])
          }).catch(() => {
            this.$message.warning($t('@BB9BD:随行设置失败，请重试'))
          })
        }).catch(() => {
          this.pta = !val
        })
      },
      messageEventHandle(message) {
        // enabled为0是关，为1是开，reasoncode和devicestate不用管
        // {"creationTime":1596103765709,"thisDN":"100001010","agentID":"100001010","messageId":531,"reasonCode":-1,"deviceState":1,"enabled":0}
        const { messageId, enabled } = message
        if (MessageID.EventPtaEnableUpdate === messageId) {
          const tipStr = enabled ? $t('@BB9BD:已开启') : $t('@BB9BD:已关闭')
          this.$message.info(this.dnInfo.agentID + $t('@BB9BD:手机随行') + tipStr)
          this.$store.commit('call/SET_VOICE_DNINFO', {
            pta: {
              status: Boolean(enabled)
            }
          })
          this.pta = Boolean(enabled)
        }
      }
    }
  }
</script>
