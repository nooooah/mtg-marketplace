'use client'

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C'

export const ALL_MANA_COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C']

/** Display name for each mana color code */
export const MANA_LABEL: Record<ManaColor, string> = {
  W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless',
}

/** Filename in /public/mana/ for WUBRG (no SVG for C) */
const MANA_FILE: Partial<Record<ManaColor, string>> = {
  W: 'plains',
  U: 'island',
  B: 'swamp',
  R: 'mountain',
  G: 'forest',
}

export function ManaIcon({ color, size = 18 }: { color: string; size?: number }) {
  const key = color as ManaColor
  const label = MANA_LABEL[key] ?? color
  const file = MANA_FILE[key]

  if (file) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/mana/${file}.svg`}
        alt={label}
        title={label}
        width={size}
        height={size}
        style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      />
    )
  }

  // Fallback for C (Colorless) — no SVG available
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: '#cdc4c0', border: '1.5px solid #a09090',
        color: '#5a4840', fontSize: Math.round(size * 0.54), fontWeight: 800,
        lineHeight: 1, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        fontFamily: 'system-ui, sans-serif', userSelect: 'none',
      }}
    >
      C
    </span>
  )
}

/** Returns inline style props for a binder tab button based on its custom colours. */
export function binderTabStyle(
  binder: { color1?: string | null; color2?: string | null; text_color?: string | null; font_family?: string | null; border_color?: string | null },
  isActive: boolean,
): React.CSSProperties {
  const hasBg = !!binder.color1
  const borderCol = binder.border_color ?? (hasBg ? `${binder.color1}80` : isActive ? 'var(--color-blue)' : 'var(--color-border)')
  const borderWidth = binder.border_color ? '10px' : '1px'
  return {
    background: hasBg
      ? binder.color2
        ? `linear-gradient(135deg, ${binder.color1}, ${binder.color2})`
        : binder.color1!
      : isActive ? 'var(--color-blue-glow)' : 'var(--color-surface)',
    color: binder.text_color ?? (isActive ? 'var(--color-blue)' : 'var(--color-muted)'),
    border: `${borderWidth} solid ${borderCol}`,
    fontFamily: binder.font_family ? `'${binder.font_family}', serif` : undefined,
  }
}
