<template>
  <el-tag v-if="!softphoneInit" type="danger" @click="check">{{ $t('@42BD0:检查电话权限失败，点击这里重试') }}</el-tag>
</template>
<script type="text/ecmascript-6">
  import { mapActions } from 'vuex'
  // todo 当下一步微前端模式到来后，这里的初始化工作应该交给子应用的bootstrap hook 下
  export default {
    name: 'NavSoftphone',
    data() {
      return {
        softphoneInit: true
      }
    },
    mounted() {
      // 延迟1s 加载电话
      // 能够解决部分刷新后无法恢复电话通话状态的问题
      setTimeout(() => {
        this.check()
      }, 1000)
    },
    methods: {
      ...mapActions('call', ['checkSoftphoneSession', 'revertAgentSoftphoneState']),
      check() {
        this.checkSoftphoneSession().then(() => {
          this.softphoneInit = true
          // 根据魔方之前存储的状态，尝试恢复电话坐席状态
          // 仅当工作台页面开启时进行切换，避免出现提前ready、手动接听无法响应的问题
          const ctiOperation = this.$route.name === 'CallCenterChatIndex'
          this.revertAgentSoftphoneState(ctiOperation)
        }).catch(() => {
          // this.$message.error(error.toString())
          this.softphoneInit = false
        })
      }
    }
  }
</script>
