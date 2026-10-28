import MarkdownIt from 'markdown-it'

// Model text is untrusted: raw HTML is disabled and markdown-it rejects unsafe URLs.
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: true })
const defaultLink = markdown.renderer.rules.link_open || ((tokens, index, options, env, renderer) => renderer.renderToken(tokens, index, options))
markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return defaultLink(tokens, index, options, env, renderer)
}
const defaultImage = markdown.renderer.rules.image
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  tokens[index].attrSet('loading', 'lazy')
  tokens[index].attrSet('referrerpolicy', 'no-referrer')
  return defaultImage(tokens, index, options, env, renderer)
}

export function renderAssistantMarkdown(text) {
  return markdown.render(String(text ?? ''))
}
