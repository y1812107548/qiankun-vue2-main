


/**
 * 一个方便的延迟Promise
 * @param delay
 * @return {Promise<any>}
 */
let timer = null
export const sleep=(delay)=> {
  return new Promise((resolve, reject) => {
   timer = setTimeout(() => {
      resolve('timeup')
    }, delay || 1000)
  })
}


/**
 * 参数的空值属性移除
 * 用于多条件查询，一般接口约定不传某属性参数即不根据该字段查询
 * @param paramsData
 * @param strictMode 是否严格进行移除，包括深层的Object 和empty object
 * @param isRoot 内部使用，作为递归标记
 * @return {T}
 */
export const paramsShake = (paramsData, strictMode = false, isRoot = true)=> {
  const chekcTarget = deepClone(paramsData)
  const keys = Object.keys(chekcTarget)
  // 严格模式下，{} 的key value 将被移除
  if (!isRoot && strictMode && !keys.length) {
    return null
  }
  keys.forEach((key) => {
    if (chekcTarget[key] === null || typeof chekcTarget[key] === undefined || (chekcTarget[key] + '').trim() === '') {
      delete chekcTarget[key]
    }
    if (chekcTarget[key] instanceof File) {
      return
    }
    if (strictMode && typeof chekcTarget[key] === 'object') {
      const re = paramsShake(chekcTarget[key], strictMode, false)
      if (re) {
        chekcTarget[key] = re
      } else {
        delete chekcTarget[key]
      }
    }
  })
  return chekcTarget
}

export function formatNumberRgx(num) {
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/**
 * 处理文件下载
 * @param filename
 * @param blob
 */
export const handleDownload = (filename, blob)=> {
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    const evt = document.createEvent('HTMLEvents')
    evt.initEvent('click', false, false)
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  }
}

/**
 * 处理级联选择器多出一个层级的问题
 */
export const handleTreeData=(data, childKey = 'childs')=> {
  for (let i = 0; i < data.length; i++) {
    const n = data[i]
    if (!n[childKey] || n[childKey].length === 0) {
      n[childKey] = undefined
    } else {
      handleTreeData(n[childKey], childKey)
    }
  }
  return data
}

/**
 * 相比lodash get，这个更简单点
 * @param data
 * @param path data.arr.0.foo
 * @return {*}
 */
export const deepGet = (data, path) => {
  return path.split('.').reduce((xs, x) => (xs && xs[x] !== undefined) ? xs[x] : null, data)
}

/**
 * 复制
 * @see https://www.30secondsofcode.org/blog/s/copy-text-to-clipboard-with-javascript
 * @param str
 */
export const copyToClipboard = str => {
  const el = document.createElement('textarea')
  el.value = str
  el.setAttribute('readonly', '')
  el.style.position = 'absolute'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

/**
 * 提供一个简易的Promise retry 能力
 * https://medium.com/@nsonic001/promises-retry-javascript-9440c2039f2f
 * @param fn {Function}
 * @param maxTries {Number}
 * @param [promise]
 * @param [promiseObject]
 * @return {Promise<unknown>}
 */
export const retry = (fn, maxTries, promise, promiseObject)=> {
  maxTries--
  promiseObject = promiseObject || {
    resolve: null,
    reject: null
  }

  promise = promise || new Promise((resolve, reject) => {
    promiseObject.resolve = resolve
    promiseObject.reject = reject
  })

  fn().then(result => {
    promiseObject.resolve(result)
  }).catch(err => {
    if (maxTries > 0) {
      retry(fn, maxTries, promise, promiseObject)
    } else {
      promiseObject.reject(err)
    }
  })

  return promise
}
