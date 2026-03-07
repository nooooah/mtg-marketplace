'use client'

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C'

export const ALL_MANA_COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C']

const MANA_STYLE: Record<ManaColor, { bg: string; border: string; text: string; label: string }> = {
  W: { bg: '#f9f6e4', border: '#c8b870', text: '#5a3e00', label: 'White' },
  U: { bg: '#0e68ab', border: '#085490', text: '#ffffff', label: 'Blue'  },
  B: { bg: '#1a1008', border: '#6a4030', text: '#d4c4b8', label: 'Black' },
  R: { bg: '#d9202a', border: '#b01020', text: '#ffffff', label: 'Red'   },
  G: { bg: '#007038', border: '#00552a', text: '#ffffff', label: 'Green' },
  C: { bg: '#cdc4c0', border: '#a09090', text: '#5a4840', label: 'Colorless' },
}

export function ManaIcon({ color, size = 18 }: { color: string; size?: number }) {
  const m = MANA_STYLE[color as ManaColor] ?? MANA_STYLE.C
  return (
    <span
      title={m.label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: m.bg, border: `1.5px solid ${m.border}`,
        color: m.text, fontSize: Math.round(size * 0.54), fontWeight: 800,
        lineHeight: 1, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        fontFamily: 'system-ui, sans-serif', userSelect: 'none',
      }}
    >
      {color}
    </span>
  )
}

/** Returns inline style props for a binder tab button based on its custom colours. */
export function binderTabStyle(
  binder: { color1?: string | null; color2?: string | null; text_color?: string | null },
  isActive: boolean,
): React.CSSProperties {
  const hasBg = !!binder.color1
  return {
    background: hasBg
      ? binder.color2
        ? `linear-gradient(135deg, ${binder.color1}, ${binder.color2})`
        : binder.color1!
      : isActive ? 'var(--color-blue-glow)' : 'var(--color-surface)',
    color: binder.text_color ?? (isActive ? 'var(--color-blue)' : 'var(--color-muted)'),
    border: `1px solid ${hasBg ? `${binder.color1}80` : isActive ? 'var(--color-blue)' : 'var(--color-border)'}`,
  }
}
