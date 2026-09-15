import { describe, expect, it } from 'vitest'
import { parseInlineSegments } from './markdownImage'

describe('parseInlineSegments', () => {
  it('splits text around an image and keeps its alt text', () => {
    const segments = parseInlineSegments('before ![diagram](https://example.com/a.png) after')

    expect(segments).toEqual([
      { type: 'text', value: 'before ' },
      { type: 'image', value: 'https://example.com/a.png', alt: 'diagram' },
      { type: 'text', value: ' after' },
    ])
  })

  it('returns a single text segment when there is no image', () => {
    expect(parseInlineSegments('just text')).toEqual([{ type: 'text', value: 'just text' }])
  })

  it.each([
    ['a relative path', 'images/a.png'],
    ['an https URL', 'https://example.com/a.png'],
    ['an http URL', 'http://example.com/a.png'],
    ['a data:image URL', 'data:image/png;base64,AAAA'],
  ])('renders %s as an image segment', (_label, url) => {
    expect(parseInlineSegments(`![alt](${url})`)).toEqual([{ type: 'image', value: url, alt: 'alt' }])
  })

  it.each([
    ['javascript:', 'javascript:alert%28document.cookie%29'],
    ['data:text/html', 'data:text/html,<script>evil</script>'],
    ['vbscript:', 'vbscript:msgbox'],
  ])('falls back to the raw markdown text instead of an image segment for a %s URL', (_label, url) => {
    const markdown = `![alt](${url})`

    expect(parseInlineSegments(markdown)).toEqual([{ type: 'text', value: markdown }])
  })
})
