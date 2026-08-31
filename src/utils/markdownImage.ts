export interface TextSegment {
  type: 'text'
  value: string
}

export interface ImageSegment {
  type: 'image'
  value: string
  alt: string
}

export type InlineSegment = TextSegment | ImageSegment

const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g

/**
 * Splits option/question text into text and image segments, recognizing only
 * the narrow `![alt](url)` markdown-image syntax (per docs/DATA-MODEL.md —
 * options are plain text except for inline images). Anything else, including
 * malformed image syntax, is left as literal text.
 */
export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(IMAGE_PATTERN)) {
    const [full, alt, url] = match
    const index = match.index

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) })
    }
    segments.push({ type: 'image', value: url, alt })
    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}
