<template>
  <div>
    <el-tag v-show="ImStatus" type="danger">{{ ImStatus }}</el-tag>
  </div>
</template>

<script type="text/jsx">
  import { mapGetters } from 'vuex'

  export default {
    name: 'ImInit',
    data() {
      return {}
    },
    computed: {
      ...mapGetters('call', ['ImStatus'])
    }
  }
</script>

<style lang="scss" type="text/scss" scoped>
  .noScrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  .wrap{
    word-break: break-all;
    word-wrap: break-word;
  }
</style>
<style >
  .async-export-notify{
    position:absolute!important;
    bottom: 0 !important;
    right:0 !important;
    width: 100% !important;
    height: 60px;
    background: #FFFFFF;
    box-shadow: 0px 0px 12px 2px rgba(0, 0, 0, 0.15);
    border-radius: 0!important;
    display: flex!important;
    align-items: center;
    justify-content: flex-end;
    z-index: 888 !important;
  }
  .link-btn{
    width: 100px;
    height: 32px;
    margin-right: 10px!important;
    padding: 0px 20px!important;
    line-height: 32px!important;
  }
</style>
