<template>
  <div>
    <el-popover
      ref="popover"
      v-model="popoverVisible"
      class="cube-el-popover"
      :placement="placement"
      width="200"
      trigger="manual"
      popper-class="cube-el-popover-popper"
    >
      <slot />
      <i class="el-icon-close cube-el-popover-close" @click="close" />
    </el-popover>
    <div v-popover:popover>
      <slot name="reference2" />
    </div>
  </div>

</template>
<script>
  export default {
    props: {
      placement: {
        type: String,
        default: 'bottom'
      },
      trigger: {
        type: String,
        default: 'manual'
      },
      value: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        popoverVisible: this.value,
        timer: null
      }
    },
    watch: {
      value(val) {
        this.popoverVisible = val
        if (this.popoverVisible) {
          this.timeoutCLose()
        }
      }
    },
    methods: {
      timeoutCLose() {
        if (this.timer)clearTimeout(this.timer)// 如果已经存在则重新计时。
        this.timer = setTimeout(() => {
          this.close()
        }, 5 * 1000)// 5s关闭
      },
      close() {
        this.popoverVisible = false
        this.$emit('input', this.popoverVisible)
      }
    }

  }
</script>
<style lang="scss">
  .cube-el-popover-popper.el-popper:hover{
    background:#404a66 !important
  }
    .cube-el-popover-popper.el-popper{
        display: flex;
        background: #545F7F;
        height: 56px;
        color: #fff;
        align-items: center;
        justify-content: space-between;
        border-radius: 10px;
        padding: 0px 20px;
        width: 300px !important;
        font-size: 14px;
      cursor: pointer;
        .popper__arrow::after{
            border-bottom-color: #545F7F !important;
        }
    }
    .cube-el-popover-popper.el-popper[x-placement^=bottom]{
        margin-top: -3px;
    }
</style>
<style lang="scss" scoped>
    .cube-el-popover-close{
        font-size: 16px;
        color: #fff;
        cursor: pointer;
        font-weight: bold;
        cursor: pointer;
       margin-left: 14px;

    }

</style>
