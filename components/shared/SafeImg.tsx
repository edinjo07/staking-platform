import React from 'react'

interface SafeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined
  alt: string
  /** Set to true only for server-generated data: URIs (e.g. QR codes) */
  allowDataImage?: boolean
}

/**
 * SafeImg only renders an <img> when src is a valid http/https URL.
 * The URL constructor parses and reconstructs the href, breaking any
 * taint chain from user-controlled input (prevents javascript:/data: injection).
 */
export function SafeImg({ src, alt, allowDataImage, ...props }: SafeImgProps) {
  if (!src) return null

  const trimmed = src.trim()

  // Allow server-generated data:image/ URIs (e.g. QR codes, base64 thumbnails)
  if (allowDataImage && /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(trimmed)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={trimmed} alt={alt} {...props} />
  }

  let safeSrc: string
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    // parsed.href is a freshly constructed string from URL — not the original input
    safeSrc = parsed.href
  } catch {
    // Allow relative paths (e.g. /images/logo.png)
    if (!trimmed.startsWith('/')) return null
    safeSrc = encodeURI(trimmed)
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={safeSrc} alt={alt} {...props} />
}


/**
 * SafeImg only renders an <img> when src is a valid http/https URL.
 * The URL constructor parses and reconstructs the href, breaking any
 * taint chain from user-controlled input (prevents javascript:/data: injection).
 */
export function SafeImg({ src, alt, ...props }: SafeImgProps) {
  if (!src) return null

  let safeSrc: string
  try {
    const parsed = new URL(src.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    // parsed.href is a freshly constructed string from URL — not the original input
    safeSrc = parsed.href
  } catch {
    // Allow relative paths (e.g. /images/logo.png)
    const trimmed = src.trim()
    if (!trimmed.startsWith('/')) return null
    safeSrc = encodeURI(trimmed)
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={safeSrc} alt={alt} {...props} />
}
