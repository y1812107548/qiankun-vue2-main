<template>
  <el-dialog
    visible
    :title="$t('@69DBA:修改密码')"
    custom-class="el-dialog-aside"
    append-to-body
    :show-close="false"
    :close-on-click-modal="false"
  >
    <el-form ref="ruleForm" :model="data" :rules="rules" label-width="80px">
      <el-form-item :label="$t('@69DBA:旧密码')" prop="oldpwd">
        <el-input
          v-model="data.oldpwd"
          :placeholder="$t('@69DBA:请输入原密码')"
          :type="display.oldpwd ? '' : 'password'"
        >
          <span slot="suffix" @click="display.oldpwd = !display.oldpwd">
            <svg-icon :icon-class="display.oldpwd ? 'eye-open' : 'eye'" />
          </span>
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('@69DBA:新密码')" prop="newpwd">
        <el-input
          v-model="data.newpwd"
          :placeholder="$t('@69DBA:请输入新密码8-20位字母、英文组合')"
          :type="display.newpwd ? '' : 'password'"
        >
          <span slot="suffix" @click="display.newpwd = !display.newpwd">
            <svg-icon :icon-class="display.newpwd ? 'eye-open' : 'eye'" />
          </span>
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('@69DBA:确认密码')" prop="againNewpwd">
        <el-input
          v-model="data.againNewpwd"
          :placeholder="$t('@69DBA:请再次确认密码')"
          :type="display.confirm ? '' : 'password'"
        >
          <span slot="suffix" @click="display.confirm = !display.confirm">
            <svg-icon :icon-class="display.confirm ? 'eye-open' : 'eye'" />
          </span>
        </el-input>
      </el-form-item>
      <ul class="tips">
        <li>
          为保证密码安全性，更改的密码需要符合以下规则：
          <ul>
            <li>至少1个大写英文字母</li>
            <li>至少1个小写英文字母</li>
            <li>至少1位数字</li>
            <li>至少1个特殊字符 <b>@$!%*?#^()_/~&</b></li>
            <li>最少8个长度</li>
            <li>不能包含用户名</li>
          </ul>
        </li>
      </ul>
    </el-form>
    <div slot="footer">
      <el-button @click="close">{{ $t('@69DBA:取消') }}</el-button>
      <el-button type="primary" :disabled="isSubmit" @click="onSubmit">{{ $t('@69DBA:保存') }}</el-button>
    </div>
  </el-dialog>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'

  import { getAccountChangePassword } from '@/api/account-info.js'
  // import store from '@/store'
  import { mapActions, mapGetters } from 'vuex'
  import { RegexUtil } from '@/utils/validate'

  export default {
    name: 'ChangePassword',
    data() {
      return {
        data: {
          oldpwd: '',
          newpwd: '',
          againNewpwd: ''
        },
        rules: {
          oldpwd: [
            { required: true, message: $t('@69DBA:请输入旧密码'), trigger: 'blur' }
          ],
          newpwd: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            { pattern: RegexUtil.passwordInput, message: '新密码需要符合密码强度规则' }
          ],
          againNewpwd: [
            { required: true, message: $t('@69DBA:请再次确认密码'), trigger: 'blur' },
            {
              validator: (rule, value, callback) => {
                if (value !== this.data.newpwd) {
                  return callback(new Error($t('@69DBA:两次密码输入不一致')))
                }
                if (value.toLowerCase().includes(this.engineerCode.toLowerCase())) {
                  return callback(new Error('密码不能包含账号名'))
                }
                callback()
              },
              trigger: 'blur'
            }
          ]
        },
        isSubmit: false,
        display: {
          oldpwd: false,
          newpwd: false,
          confirm: false
        }
      }
    },
    computed: {
      ...mapGetters(['engineerCode'])
    },
    methods: {
      ...mapActions(['LogOut']),
      close() {
        this.$emit('closeAlert')
      },
      onSubmit() {
        this.$refs.ruleForm.validate((valid) => {
          if (!valid) {
            return
          }

          this.isSubmit = true
          getAccountChangePassword({
            password: this.data.oldpwd,
            new_password: this.data.newpwd
          }).then(res => {
            this.close()
            this.$message.success($t('@69DBA:密码修改成功'))
            this.LogOut()

            this.$alert($t('@69DBA:您的密码已修改成功，请重新登录'), $t('@69DBA:修改成功'), {
              confirmButtonText: $t('@69DBA:重新登录'),
              customClass: 'warning-pwd',
              type: 'success',
              center: true,
              showClose: false,
              callback: () => {
                location.reload()
              }
            })
          }).catch(res => {
            this.$message.error(res.toString())
          }).finally(() => {
            this.isSubmit = false
            this.changeCaptcha()
          })
        })
      }
    }
  }
</script>
