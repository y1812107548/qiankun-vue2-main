<template>
  <div id="test">
    <el-button @click="jump">点击按钮{{ complaintId }}</el-button>
  </div>
</template>
<script>
  export default {
    data() {

    },
    methods: {
      jump() {
        this.$router.push({
          name: 'ComplaintHandleInfoIndex',
          query: {
            complaintId: 'ssss',
            source: 'ComplaintHandleList',
            firstEndTime: 'sadasd'
          }
        })
      }
    }

  }
</script>
