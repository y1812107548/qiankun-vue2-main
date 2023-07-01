import { Message } from 'element-ui'

const InterceptMessage = function(options) {
  options = options || {}
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }

  if (!options.hide) {
    return Message(options)
  }
}

'success,warning,info,error'.split(',').forEach(type => {
  InterceptMessage[type] = options => {
    if (options instanceof Error) {
      options = {
        message: options.toString()
      }
    } else if (typeof options === 'object') {
      options = options || {}
    } else {
      options = {
        message: options
      }
    }
    options.type = type
    if (!options.hide) {
      return Message(options)
    }
  }
})

export default InterceptMessage
