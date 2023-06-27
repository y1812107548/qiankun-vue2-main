<template>
  <div class="my-dialog">
    <!-- Form -->
    <el-dialog
      ref="my-dialog"
      custom-class="el-dialog-body-center"
      width="440px"
      :visible.sync="visible"
      :before-close="() => void $emit('close')"
      :close-on-click-modal="false"
    >
      <div slot="title" class="bold dialog-footer el-dialog-body-center">
        {{ $t('@72652:小休记录') }}
      </div>
      <el-form ref="restForm" :model="restForm" :rules="rules" label-position="right" label-width="80px" size="medium">
        <el-form-item :label="$t('@72652:理由')" prop="reason">
          <el-select v-model="restForm.reason">
            <el-option
              v-for="item in reasonOptions"
              :key="item.value"
              :placeholder="$t('@72652:请选择')"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('@72652:说明')" prop="explain">
          <el-input
            v-model.trim="restForm.explain"
            auto-complete="off"
            maxlength="200"
            type="textarea"
            show-word-limit
            :placeholder="$t('@72652:请输入更多说明')"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="$emit('close')">{{ $t('@72652:取消') }}</el-button>
        <el-button type="primary" @click="submitData">{{ $t('@72652:提交') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'
  export default {
    name: 'ResetDialog',
    props: {
      visible: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        restForm: {
          reason: '',
          explain: ''
        },
        reasonOptions: [{
          value: `${$t('@72652:用餐')}`,
          label: `${$t('@72652:用餐')}`
        }, {
          value: `${$t('@72652:补休')}`,
          label: `${$t('@72652:补休')}`
        }, {
          value: `${$t('@72652:其他')}`,
          label: `${$t('@72652:其他')}`
        }],
        rules: {
          reason: [
            { required: true, message: `${$t('@72652:请选择小休理由')}`, trigger: ['blur', 'change'] }
          ]
        }
      }
    },
    watch: {
      visible(status) {
        !status && this.$nextTick(() => {
          this.$refs['restForm'].resetFields()
        })
      }
    },
    methods: {
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
