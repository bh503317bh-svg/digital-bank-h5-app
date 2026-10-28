import test from 'node:test'
import assert from 'node:assert/strict'
import { renderAssistantMarkdown } from '../src/utils/assistantMessage.js'

test('renders common markdown elements including nested lists, links and tables', () => {
  const input = '# Products\n\n**QQQ** and *SPY*\n\n- Index funds\n  - [Fund details](https://example.com)\n\n> Investment risk\n\n| Fund | Type |\n| --- | --- |\n| QQQ | ETF |\n\n```js\nconst x = 1\n```'
  const html = renderAssistantMarkdown(input)
  for (const tag of ['<h1>', '<strong>', '<em>', '<ul>', '<a ', '<blockquote>', '<table>', '<pre><code']) assert.ok(html.includes(tag), `missing ${tag}`)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
})

test('escapes HTML, prevents unsafe links and applies image privacy attributes', () => {
  const html = renderAssistantMarkdown('<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n![chart](https://example.com/chart.png)')
  assert.ok(html.includes('&lt;img'))
  assert.doesNotMatch(html, /href="javascript:/i)
  assert.match(html, /loading="lazy"/)
  assert.match(html, /referrerpolicy="no-referrer"/)
})
