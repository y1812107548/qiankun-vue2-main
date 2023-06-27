<template>
  <el-dialog
    :title="$t('@ACC3F:修改密码')"
    center
    width="400px"
    :visible="true"
    :show-close="false"
  >
    <el-form ref="ruleForm" :model="data" :rules="rules" label-width="80px">
      <el-form-item :label="$t('@ACC3F:旧密码')" prop="oldpwd">
        <el-input
          v-model="data.oldpwd"
          :placeholder="$t('@ACC3F:请输入原密码')"
          :type="passwordType1"
          :class="{ borderColor: isInfo }"
          @change="changeOldpwd"
        >
          <span slot="suffix" @click="showPwd1">
            <svg-icon v-if="eye1" icon-class="eye" />
            <svg-icon v-else icon-class="eye-open" />
          </span>
        </el-input>
        <span v-if="isInfo" class="info">{{ $t('@ACC3F:旧密码输入错误') }}</span>
      </el-form-item>
      <el-form-item :label="$t('@ACC3F:新密码')" prop="newpwd">
        <el-input
          v-model="data.newpwd"
          placeholder="请输入新密码"
          :type="passwordType2"
        >
          <span slot="suffix" @click="showPwd2">
            <svg-icon v-if="eye2" icon-class="eye" />
            <svg-icon v-else icon-class="eye-open" />
          </span>
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('@ACC3F:确认密码')" prop="againNewpwd">
        <el-input
          v-model="data.againNewpwd"
          :placeholder="$t('@ACC3F:请再次确认密码')"
          :type="passwordType3"
        >
          <span slot="suffix" @click="showPwd3">
            <svg-icon v-if="eye3" icon-class="eye" />
            <svg-icon v-else icon-class="eye-open" />
          </span>
        </el-input>
      </el-form-item>
      <el-form-item :label="$t('@ACC3F:验证码')" prop="vierificationCode" required>
        <el-input v-model="data.vierificationCode" maxlength="6" clearable style="width: 50%;" />
        <img
          :alt="$t('@ACC3F:验证码 captcha')"
          :src="captchaSrc + salt"
          style="width: 120px; height: 36px; float: right"
          @click="changeCaptcha"
        >
      </el-form-item>
    </el-form>
    <el-alert title="提示" type="info">
      <p>密码为8至20位，需要包含大写字母、小写字母、数字、特殊符号4种类型，并且不能包含用户名。</p>
      <p>其中特殊符号示例如下：<span>@$!%*?#^()_/~&</span></p>
    </el-alert>
    <div slot="footer">
      <el-button @click="close">{{ $t('@ACC3F:取消') }}</el-button>
      <el-button type="primary" :disabled="isSubmit" @click="onSubmit">{{ $t('@ACC3F:确认修改') }}</el-button>
    </div>
  </el-dialog>
</template>

<script type="text/ecmascript-6">
  import { $t } from '@/lang/static'

  import { MessageBox } from 'element-ui-cs'
  import store from '@/store'
  import { modifyPassword } from '@/micro/esd/api'
  import { RegexUtil } from '@/utils/validate'
  import { mapGetters } from 'vuex'

  export default {
    name: 'ChangePassword',
    data() {
      const checkNewpwd = (rule, value, callback) => {
        if (value) {
          if (!RegexUtil.passwordInput.test(value)) {
            return callback(new Error('新密码不符合密码强度要求'))
          }
          if (value.toLowerCase().includes(this.engineerCode.toLowerCase())) {
            return callback(new Error('密码不能包含账号名'))
          }
          callback()
        }
      }
      const checkNewpwd1 = (rule, value, callback) => {
        if (value === this.data.newpwd) {
          callback()
        } else {
          return callback(new Error($t('@ACC3F:两次密码输入不一致')))
        }
      }
      return {
        data: {
          oldpwd: '',
          newpwd: '',
          againNewpwd: '',
          vierificationCode: ''
        },
        salt: +new Date(),
        captchaSrc: '/authorityapi/Auth/ValidateCode?',

        rules: {
          oldpwd: [
            { required: true, message: $t('@ACC3F:请输入旧密码'), trigger: 'blur' }
          ],
          newpwd: [
            { required: true, message: '请输入新密码', trigger: 'blur' },
            { validator: checkNewpwd, trigger: 'blur' }
          ],
          againNewpwd: [
            { required: true, message: $t('@ACC3F:请再次确认密码'), trigger: 'blur' },
            { validator: checkNewpwd1, trigger: 'blur' }
          ],
          vierificationCode: [{
            required: true,
            message: $t('@ACC3F:请输入验证码')
          }]
        },
        isInfo: false,
        isSubmit: false,
        passwordType1: 'password',
        passwordType2: 'password',
        passwordType3: 'password',
        eye1: true,
        eye2: true,
        eye3: true
      }
    },
    computed: {
      ...mapGetters(['engineerCode'])
    },
    methods: {
      changeCaptcha() {
        this.salt = +new Date()
        this.data.vierificationCode = ''
      },
      close() {
        this.$emit('closeAlert')
      },
      showPwd1() {
        if (this.passwordType1 === 'password') {
          this.eye1 = false
          this.passwordType1 = ''
        } else {
          this.eye1 = true
          this.passwordType1 = 'password'
        }
      },
      showPwd2() {
        if (this.passwordType2 === 'password') {
          this.eye2 = false
          this.passwordType2 = ''
        } else {
          this.eye2 = true
          this.passwordType2 = 'password'
        }
      },
      showPwd3() {
        if (this.passwordType3 === 'password') {
          this.eye3 = false
          this.passwordType3 = ''
        } else {
          this.eye3 = true
          this.passwordType3 = 'password'
        }
      },
      changeOldpwd() {
        if (this.isInfo) {
          this.isInfo = false
        }
      },
      onSubmit() {
        if (this.isInfo) return
        this.data.oldpwd.replace(/\s+/g, '')
        this.data.newpwd.replace(/\s+/g, '')
        this.data.againNewpwd.replace(/\s+/g, '')
        this.$refs.ruleForm.validate((valid) => {
          if (valid) {
            this.isSubmit = true
            const data = {
              password: this.data.oldpwd,
              newPassword: this.data.newpwd,
              confirmNewPassword: this.data.againNewpwd,
              vierificationCode: this.data.vierificationCode
            }

            modifyPassword(data).then(res => {
              if (res.code === 200) {
                this.$emit('closeAlert')
                this.$message.success($t('@ACC3F:密码修改成功'))
                MessageBox.alert($t('@ACC3F:您的密码已修改成功，请重新登录'), $t('@ACC3F:修改成功'), {
                  confirmButtonText: $t('@ACC3F:重新登录'),
                  customClass: 'warning-pwd',
                  type: 'success',
                  center: true,
                  showClose: false,
                  callback: () => {
                    store.dispatch('FedLogOut').then(() => {
                      location.href = '/#/login'
                      location.reload() // 为了重新实例化vue-router对象 避免bug
                    })
                  }
                })
              } else {
                this.$message.warning(res.msg)
              }
            }).catch(res => {
              this.$message.error(res.toString())
            }).finally(() => {
              this.isSubmit = false
              this.changeCaptcha()
            })
          } else {
            return false
          }
        })
      }
    }
  }
</script>
