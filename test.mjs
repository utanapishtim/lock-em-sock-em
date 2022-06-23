import path from 'path'
import url from 'url'
import fs from 'fs'
import test from 'brittle'
import { lockemSockem, createServer, connect } from './index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))

await test('lockSockem(id) can acquire file lock if unacquired', async (t) => {
  const { acquired, handle } = await lockemSockem(pkg.name)
  t.teardown(handle.close)
  t.ok(acquired)
})

await test('lockemSockem(id) cannot acquire file lock if acquired', async (t) => {
  const fst = await lockemSockem(pkg.name)
  t.teardown(fst.handle.close)
  const snd = await lockemSockem(pkg.name)
  t.teardown(snd.handle.close)
  t.ok(fst.acquired)
  t.ok(!snd.acquired)
})

await test('createServer(id) returns server if file lock unacquired, connect(id) returns socket if file lock acquired', async (t) => {
  t.plan(1)
  const server = await createServer(pkg.name)
  t.teardown(server.close.bind(server))
  server.on('connection', async (socket) => {
    let str = ''
    for await (const buf of socket) str += buf
    t.is(str, pkg.name)
  })
  const socket = await connect(pkg.name)
  socket.write(Buffer.from(pkg.name))
  socket.end()
})

await test('createServer(id) returns null if file lock acquired', async (t) => {
  t.plan(1)
  const { handle } = await lockemSockem(pkg.name)
  t.teardown(handle.close)
  const server = await createServer(pkg.name)
  t.is(server, null)
})

await test('connect(id) returns null if file lock unacquired', async (t) => {
  t.plan(1)
  const socket = await connect(pkg.name)
  t.is(socket, null)
})
