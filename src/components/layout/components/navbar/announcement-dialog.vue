<!--
 * @Author: ruanxin
 * @Date: 2021-07-23 10:47:34
 * @LastEditors: ruanxin
 * @LastEditTime: 2021-08-25 18:10:43
 * @Description: file content
-->
<template>
  <div class="my-dialog">
    <!-- Form -->
    <el-dialog
      ref="my-dialog"
      custom-class="el-dialog-body-center"
      width="800px"
      :visible.sync="visible"
      :border="false"
      :show-close="false"
      :before-close="() => void $emit('close')"
      :close-on-click-modal="true"
    >
      <div slot="title" class="bold dialog-footer el-dialog-body-center">
        <div class="dialog-header">
          <el-button type="text" :class="!readStatus ? 'borderBottom': ''" :style="{color: !readStatus?'#409EFF':'#606266'}" @click="clickStatus()">全部 </el-button>
          <el-button type="text" :class="readStatus===1 ? 'borderBottom': ''" :style="{color: readStatus===1?'#409EFF':'#606266'}" @click="clickStatus(1)">未读</el-button>
          <el-button type="text" :class="readStatus===2 ? 'borderBottom': ''" :style="{color: readStatus===2?'#409EFF':'#606266'}" @click="clickStatus(2)">已读</el-button>
          <el-select v-model="value" clearable placeholder="通知类型" @change="changeType">
            <el-option
              v-for="item in types"
              :key="item.key"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="right">

            <span @click="readMsg" @mouseover="mouseover('check')" @mouseleave="mouseleave('check')">
              <el-tooltip effect="dark" content="标记已读" placement="top-start" popper-class="tooltip-white">
                <svg-icon :icon-class="checkClass? 'msg-check': 'msg-check-hover'" class="check" />
              </el-tooltip>
            </span>

            <span style="padding-right: 20px; padding-left: 10px" @click="deleteMsg" @mouseover="mouseover('delete')" @mouseleave="mouseleave('delete')"><svg-icon :icon-class="deleteClass? 'msg-delete': 'msg-delete-hover'" class="delete" /></span>
            <span style="border-left: 1px solid #e4e7ed;padding-left: 20px" @click="() => void $emit('close')"><svg-icon icon-class="msg-close" class="close" /></span>
            <!-- <el-button type="text" @click="readMsg">标记已读</el-button>
            <el-button type="text" @click="deleteMsg">删除</el-button>
            <i class="el-icon-close" style="font-size: 16px" @click="() => void $emit('close')" /> -->
          </div>
        </div>
      </div>
      <div class="dialog-content">
        <div class="dialog-content-left">
          <el-table
            ref="multipleTable"
            :data="tableData"
            :show-header="false"
            tooltip-effect="dark"
            :border="false"
            style="width: 100%; border: none"
            :row-class-name="tableRowClass"
            highlight-current-row
            @row-click="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <el-table-column
              type="selection"
              width="29"
            />
            <el-table-column
              prop="subject"
              show-overflow-tooltip
            />
            <el-table-column
              prop="sendTime"
              width="120px"
            >
              <template slot-scope="scope">
                <span style="color: #c0c4cc">{{ scope.row.sendTime }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="isAll" class="select-info">
            <p v-if="!checkedAll">已选中本页{{ selectCount }}条信息，点击<el-button type="text" @click="handleCheckAllChange(true); checkedAll = true">选中全部{{ tableData.length }}条消息 </el-button><span class="el-icon-close" @click="isAll = false" /></p>
            <p v-else>已选中{{ selectCount }}条信息，点击<el-button type="text" @click="handleCheckAllChange(false); checkedAll = false">取消选择 </el-button><span class="el-icon-close" @click="isAll = false" /></p>
          </div>
          <div class="table-footer">
            <el-checkbox v-model="checkedAll" style="line-height: 2" @change="handleCheckAllChange">全选</el-checkbox>
            <el-pagination
              small
              layout="prev, pager, next"
              :page-size="pageSize"
              :current-page.sync="pageNum"
              :total="total"
              @current-change="getData(readStatus)"
            />
          </div>
        </div>
        <announcement-dialog-detail
          :data="detailData"
        />
      </div>
    </el-dialog>
  </div>
</template>
<script type="text/ecmascript-6">
  import {
    getMessageBoxList,
    getRecordDetail,
    postDeleteMessage,
    postReadMessage
  } from '@/api/announce/message-center'
  import { getDateFormat } from '@/utils'
  import announcementDialogDetail from './announcement-dialog-detail'
  export default {
    name: 'AnnouncementDialog',
    components: { announcementDialogDetail },
    props: {
      visible: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        deleteClass: true,
        checkClass: true,
        activeName: 'first',
        value: '',
        checkedAll: false,
        detailData: {},
        pageSize: 10,
        pageNum: 1,
        total: 0,
        readStatus: null,
        tableData: [],
        messageId: [],
        cacheMsgId: [],
        types: [{
          label: '工单',
          value: 'tickets'
        }, {
          label: '系统公告',
          value: 'system'
        }],
        isAll: false,
        selectCount: 0
      }
    },
    watch: {
      visible(status) {
        status && this.$nextTick(() => {
          this.value = ''
          // this.getData()
        })
      }
    },
    methods: {
      mouseover(cls) {
        this[`${cls}Class`] = false
      },
      mouseleave(cls) {
        this[`${cls}Class`] = true
      },
      handleClick(val) {
      },
      tableRowClass({ row, rowIndex }) {
        if (row && row.readStatus === 1) {
          return 'tableRowClass'
        }
        return ''
      },
      changeType() {
        this.pageSize = 10
        this.pageNum = 1
        this.getData()
      },
      getData(readStatus) {
        this.readStatus = readStatus
        this.checkedAll = false
        this.isAll = false
        getMessageBoxList({
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          readStatus,
          namespace: this.value
        }).then(response => {
          this.tableData = []
          this.tableData = response.rows.map(item => {
            return {
              ...item,
              sendTime: getDateFormat('yyyy-MM-dd hh:mm', new Date(item.sendTime)),
              subject: `${item.namespace === 'system' ? '[系统公告]' : item.namespace === 'tickets' ? '[工单]' : '[人工]'}${item.subject}`
            }
          })
          this.pageNum = response.page
          this.total = response.total
          this.detailData = {}
          this.tableData.length && this.handleCurrentChange(this.tableData[0])
        })
      },
      handlePageChange() {

      },
      clickStatus(status) {
        this.pageSize = 10
        this.pageNum = 1
        this.getData(status)
      },
      handleCheckAllChange(val) {
        this.tableData.map(row => {
          this.$refs.multipleTable.toggleRowSelection(row, val)
        })
        this.isAll = val
        if (val) { // 选择全部

        } else { // 取消

        }
      },
      handleSelectionChange(val) {
        this.messageId = val.map(item => item.id)
        this.selectCount = val.length
        this.isAll = !!val.length
        this.checkedAll = this.selectCount === 0 ? false : (this.selectCount === this.tableData.length)
      },
      setCurrent(row) {
        if (!row) return
        this.$refs.multipleTable.setCurrentRow(row)
        this.detailData = {}
        getRecordDetail({
          project_id: row.projectId,
          id: row.id
        }).then(response => {
          this.detailData = response.data
        })
      },
      handleCurrentChange(row) {
        this.setCurrent(row)
        if (row && row.readStatus === 1) {
          this.messageId = [row.id]
          this.readMsg()
        }
      },
      readMsg() {
        if (!this.messageId.length) return
        postReadMessage({
          messageId: this.messageId
        }).then(() => {
          // this.getData()
          // todo 刷新数量
          this.$emit('changeNoticeCount')
        })
      },
      deleteMsg() {
        if (!this.messageId.length) return
        postDeleteMessage({
          messageId: this.messageId
        }).then(() => {
          this.getData()
          // this.$message.success('删除成功')
        })
      },
      submitData() {
        this.$refs.restForm.validate(valid => {
          if (valid) {
            this.$emit('handleRestLog', this.restForm)
          } else {
            return false
          }
        })
      }
    }
  }

</script>
<style lang="scss" scoped>
p {
  line-height: 2;
}
.dialog-header {
  text-align: left;
  .el-button {
    height: 50px;
    padding: 0 10px;
  }
  .el-select {
    margin-left: 10px;
  }
  .borderBottom {
    border-bottom: 2px solid #65a4e4;
    border-radius: 0;
  }
}
.dialog-content {
  display: flex;
  .dialog-content-left {
    flex: 1;
    position: relative;
    .el-table {
      min-height: 300px;
    }
  }
  .dialog-content-right {
    width: 50%;
    border-left: 1px solid #efefef;
    padding: 5px;

  }
  .table-footer {
    border-top: 1px solid #efefef;
    padding: 10px 10px 10px 15px;
    height: 50px;
    display: flex;
    .el-checkbox {
      line-height: 2;
      flex: 1;
    }
  }
}
::v-deep .el-dialog .el-dialog__body {
  margin-top: 0;
  // padding-left: 0;
  // padding-right: 0;
  padding: 0;
}
::v-deep .el-dialog__header{
  padding: 0 20px;
  background: #f5f7fa;
}
::v-deep .el-table td, .el-table th.is-leaf {
  border: none;
}
.right {
  float: right;
  display: inline-flex;
  .svg-icon {
    margin: 0 8px;
    cursor: pointer;
    width: 1.2em;
    height: 1.2em;
  }
  .delete:hover {
    -webkit-filter: drop-shadow(0 0 0 #f00);
  }
}
::v-deep .el-table__body tr.current-row>td {
  background-color: #e5f2ff;
}
::v-deep .tableRowClass {
  font-weight: 600 !important;
  color: #222 !important;
}
.el-icon-close {
  cursor: pointer;
  padding-left: 10px;
}
.select-info {
  position: relative;
  width: 100%;
  left: 0;
  bottom: 0;
  z-index: 999;
  text-align: center;
  background: blanchedalmond;
  p {
    padding: 0;
    margin: 0;
    font-size: 10px;
    position: relative;
    .el-button {
      font-size: 10px;
    }
    .el-icon-close {
      position: absolute;
      right: 10px;
      top: 10px;

    }
  }
}
</style>
