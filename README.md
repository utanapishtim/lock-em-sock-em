# lock'em sock'em

atomic, cross-platform tcp domain servers & sockets

## Install

`npm i lock-em-sock-em`

## Usage

```js
const { createServer, connect, lockemSockem } = require('lock-em-sock-em')

const id = 'lock-em-sock-em'

const server = await createServer(id)

server.on('connection', async (socket) => {
  let str = ''
  for await (const buf of socket) str += buf
  console.log(str)
})

const socket = await connect(id)

socket.write(Buffer.from(id))
socket.end()

const { acquired } = await lockemSockem(id)
console.log('acquired file lock?', acquired)
```

## API

#### `const server = await createServer(id)`

`server` is an instance of `net.Server()`

#### `const socket = await connect(id)`

`socket` is an instance of `net.Socket()`

#### `const { handle, lock, acquired, sock } = await lockemSockem(id)`

* `handle` is an instance of `fs.FileHandle`
* `lock` is the `String` path of the file lock
* `acquired` is a `Boolean` indicating whether the file lock was successfully acquired
* `sock` is the `String` path of the domain socket
