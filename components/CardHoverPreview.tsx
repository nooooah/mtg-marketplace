'use client'

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

const PREVIEW_WIDTH = 280

function HoverCard({ imageUrl, x, y }: { imageUrl: string; x: number; y: number }) {
  // Flip to left if too close to right edge
  const left =
    x + 24 + PREVIEW_WIDTH > window.innerWidth ? x - PREVIEW_WIDTH - 16 : x + 24

  // Vertically center around cursor, clamped inside viewport
  const previewHeight = PREVIEW_WIDTH * (4 / 3)
  const rawTop = y - previewHeight / 2
  const top = Math.max(12, Math.min(rawTop, window.innerHeight - previewHeight - 12))

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: `${PREVIEW_WIDTH}px`,
        zIndex: 9999,
        pointerEvents: 'none',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)',
        animation: 'cardPreviewFadeIn 0.12s ease',
      }}
    >
      <img src={imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
    </div>
  )
}

/** Drop-in <img> replacement that shows the large hover preview. */
export function HoverCardImage({
  src,
  alt,
  style,
}: {
  src: string
  alt: string
  style?: React.CSSProperties
}) {
  const { onMouseMove, onMouseLeave, preview } = useCardHover(src)
  return (
    <>
      {preview}
      <img src={src} alt={alt} style={style} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} />
    </>
  )
}

export function useCardHover(imageUrl: string | null, enabled = true) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !imageUrl) return
      setMouse({ x: e.clientX, y: e.clientY })
    },
    [enabled, imageUrl],
  )

  const onMouseLeave = useCallback(() => setMouse(null), [])

  const preview =
    mouse && imageUrl && enabled && typeof document !== 'undefined'
      ? createPortal(<HoverCard imageUrl={imageUrl} x={mouse.x} y={mouse.y} />, document.body)
      : null

  return { onMouseMove, onMouseLeave, preview }
}
