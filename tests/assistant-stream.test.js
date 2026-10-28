import test from 'node:test'
import assert from 'node:assert/strict'
import { readAssistantStream } from '../src/utils/assistantStream.js'

const encode = value => new TextEncoder().encode(value)
test('delivers text incrementally across SSE and UTF-8 byte boundaries', async () => {
  let writer
  const stream = new ReadableStream({ start(controller) { writer = controller } })
  const received = []
  let actions
  const finished = readAssistantStream(stream.getReader(), { onDelta: value => received.push(value), onActions: value => { actions = value } })
  const bytes = encode('data: {"type":"delta","text":"Hello 🌟"}\n\n')
  for (const byte of bytes) writer.enqueue(Uint8Array.of(byte))
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(received, ['Hello 🌟'])
  writer.enqueue(encode('data: {"type":"delta","text":" again"}\r\n\r\ndata: {"type":"actions","actions":[{"path":"/funds"}]}\n\ndata: {"type":"done"}\n\n'))
  writer.close()
  await finished
  assert.deepEqual(received, ['Hello 🌟', ' again'])
  assert.deepEqual(actions, [{ path: '/funds' }])
})

test('reports interrupted streams and explicit provider errors', async () => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(encode('data: {"type":"delta","text":"partial"}\n\n')); controller.close() } })
  await assert.rejects(readAssistantStream(stream.getReader()), /interrupted/)
  const errored = new ReadableStream({ start(controller) { controller.enqueue(encode('data: {"type":"error","message":"Service unavailable"}\n\n')); controller.close() } })
  await assert.rejects(readAssistantStream(errored.getReader()), /Service unavailable/)
})
