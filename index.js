const os = require('os')
const fs = require('fs/promises')
const net = require('net')
const path = require('path')
const flock = require('fd-lock')

module.exports = { createServer, connect, lockemSockem }

async function createServer (id) {
  const { handle, acquired, sock } = await lockemSockem(id)
  const p = { resolve: null, reject: null }
  const server = new net.Server()
  const onerror = (e) => handle.close().then(p.reject.bind(null, e), p.reject)
  const onlisten = () => {
    server.removeListener('error', onerror)
    p.resolve(server)
  }
  if (!acquired) return null
  if (process.platform !== 'win32') {
    try {
      await fs.unlink(sock)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        await handle.close().catch(noop)
        throw e
      }
    }
  }
  server.once('error', onerror)
  server.once('close', handle.close.bind(handle))
  server.listen({ path: sock }, onlisten)
  return new Promise((resolve, reject) => Object.assign(p, { resolve, reject }))
}

async function connect (id) {
  const { handle, acquired, sock } = await lockemSockem(id)
  if (!acquired) return net.connect({ path: sock })
  await handle.close() // release
  return null
}

async function lockemSockem (id) {
  const socketpath = path.join(os.tmpdir(), id)
  const lock = socketpath + '.lock'
  const sock = (process.platform === 'win32')
    ? '\\\\.\\pipe\\' + id
    : socketpath + '.sock'
  const handle = await fs.open(lock, 'w')
  const { fd } = handle
  const acquired = !!flock(fd)
  if (!acquired) await handle.close()
  return { handle, lock, acquired, sock }
}

function noop () {}
