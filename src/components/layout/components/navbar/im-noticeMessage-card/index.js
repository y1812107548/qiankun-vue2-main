import Vue from 'vue'
import DefaultCard from './default-card.vue'

export function handleNoticeMessage(th, message) {
  defaultCard(th, message)
}

function defaultCard(th, message) {
  try {
    const content = JSON.parse(message.content) || {}
    const DefaultCardConstructor = Vue.extend(DefaultCard)
    const instance = new DefaultCardConstructor({
      data: {
        content,
        notifyObject
      }
    })
    instance.$mount()
    const notifyObject = th.$notify({
      title: '',
      center: true,
      dangerouslyUseHTMLString: true,
      duration: 60000,
      offset: 100,
      message: instance.$el.innerHTML }
    )
  } catch (e) {
    console.error('解析推送消息失败', e)
  }
}
