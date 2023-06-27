import axios from 'axios'
import cubeResponseCheck from '@/utils/axios-interceptor/cube-response-check'
import loadingVuex from '@/utils/axios-interceptor/loading-vuex'
import get from 'lodash.get'
import requestCloud from '@/utils/request-cloud'
/**
 * webchat 多数请求需要携带token，作为用户身份的加密标识
 * config 参数为：
 * - noToken 不携带token
 * @param service
 */
function autoToken(service) {
  service.interceptors.request.use(config => {
    if (!config.params) {
      config.params = {}
    }
    if (!config.noToken) {
      config.params.token = autoToken.token
    }
    return config
  })
  return service
}

const service = axios.create({
  timeout: 20 * 1000,
  headers: {
    'Content-Type': 'application/json',
    'charset': 'utf-8'
  }
})

// 这里的interceptors 是有顺序的
const interceptors = [autoToken, cubeResponseCheck, loadingVuex]
interceptors.forEach(interceptor => {
  interceptor(service)
})

// 最后一个interceptors 方便接口响应使用数据
// 针对未验证通过的reject Promise，抽取message.info 信息返回
service.interceptors.response.use(response => {
  return response.data
}, errorResponse => {
  // if (errorResponse.response.status === 401 && errorResponse.response.data.location) {
  //   window.location.href = errorResponse.response.data.location
  // }
  const errorMessage = get(errorResponse, 'data.message.info', errorResponse.data)
  return Promise.reject(errorMessage)
})

export function getChatToken() {
  return autoToken.token
}

// 用户登录 换取token
export function robotLogin(phone = '', project_id = '') {
  return service({
    url: `/api/csc/login/robot`,
    // url: `/api/csc/login`,
    method: 'post',
    noToken: true,
    params: {
      phone, project_id
    }
  }).then(res => {
    autoToken.token = res.data.token
    return res
  })
}

// 获取签名
export function getSign() {
  return service({
    url: `/api/csc/ucenter/userSig`
  })
}
// 发送消息
export function sendMessageToEngineer(data) {
  return service({
    url: `/api/csc/core/webchat/main`,
    method: 'post',
    data: data
  })
}
// 获取用户信息
export function getUserInfo(params) {
  return service({
    url: `/api/csc/ucenter/info`,
    params
  })
}
// 获取用户session列表
export function getHistoryList() {
  return service({
    url: `/api/csc/session/c/sessionList`
  })
}
// 获取聊天记录
export function getHistoryMsg(sessionId) {
  return service({
    url: `/api/csc/session/c/messages/${sessionId}`
  })
}
// 获取用户当前会话状态
export function getCurrentStatus(params) {
  return service({
    url: `/api/csc/ucenter/currentStatus`,
    params,
    doNotCheck: true
  })
}
// 关闭机器人
export function closeRobot(channel = 'webchat') {
  return service({
    url: `/api/csc/robot/close`,
    params: { channel }
  })
}
// 为用户存储附加信息
export function setUserOptions(option = {}) {
  return service({
    url: '/api/csc/webchat/addoptions',
    method: 'post',
    data: {
      option
    }
  })
}

/**
 * 获取机器人企业id --- 此参数在词典里配置
 * @returns {AxiosPromise}
 */
export function getRobotUserId() {
  return requestCloud({
    url: '/orgauthorityapi/paramValue/getParamValueChildrenTreeList?paraCodes=robot_userIdentity',
    method: 'get'
    // headers:{
    //   AuthAPIToken:getToken()
    // },
    // doNotCheck: true,

  })
}
