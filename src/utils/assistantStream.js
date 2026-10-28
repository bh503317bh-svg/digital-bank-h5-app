// Parse SSE across arbitrary byte, UTF-8 and frame boundaries.
export async function readAssistantStream(reader, { onDelta = () => {}, onActions = () => {} } = {}) {
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false
  function handleFrame(frame) {
    const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
    if (!data) return
    const event = JSON.parse(data)
    if (event.type === 'delta' && typeof event.text === 'string') onDelta(event.text)
    else if (event.type === 'actions') onActions(Array.isArray(event.actions) ? event.actions : [])
    else if (event.type === 'error') throw new Error(event.message || 'The assistant could not complete its response.')
    else if (event.type === 'done') completed = true
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      let separator
      while ((separator = buffer.match(/\r?\n\r?\n/))) {
        handleFrame(buffer.slice(0, separator.index))
        buffer = buffer.slice(separator.index + separator[0].length)
      }
      if (done) break
    }
    if (buffer.trim()) handleFrame(buffer)
    if (!completed) throw new Error('The assistant response was interrupted. Please try again.')
  } catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  } finally {
    reader.releaseLock()
  }
}
