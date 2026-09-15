interface TextSegment {
  type: 'text'
  value: string
}

interface ImageSegment {
  type: 'image'
  value: string
  alt: string
}

export type InlineSegment = TextSegment | ImageSegment

const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g
const SAFE_IMAGE_URL_PATTERN = /^(https?:|data:image\/)/i
const HAS_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i

function isSafeImageUrl(url: string): boolean {
  return !HAS_SCHEME_PATTERN.test(url) || SAFE_IMAGE_URL_PATTERN.test(url)
}

export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(IMAGE_PATTERN)) {
    const [full, alt, url] = match
    const index = match.index

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) })
    }
    segments.push(isSafeImageUrl(url) ? { type: 'image', value: url, alt } : { type: 'text', value: full })
    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}
