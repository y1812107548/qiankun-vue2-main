import { CUBE } from '@/configuration'

/**
 * 初始化socket
 * @param userSig
 * @return {*}
 */
export function initSocket(userSig) {
  const url = `${window.location.protocol}//${CUBE.api.domain}/chat`
  const socket = io(url, {
    query: {
      token: userSig
    }
  })
  return new Promise(resolve => {
    socket.on('connect', function() {
      resolve(socket)
    })
  })

  // socket.on('message', function(data) {
  // })
  //
  // socket.on('reconnect', function(data) {
  // })
  //
  // socket.on('connect_error', function(data) {
  // })
  //
  // socket.on('error', function(data) {
  // })
  //
  // socket.on('disconnect', function(data) {
  // })
  //
  // socket.on('kickoff', function(data) {
  //   socket.close()
  // })
  //
  // socket.on('entering', function(data) {
  // })
  // return socket
}
