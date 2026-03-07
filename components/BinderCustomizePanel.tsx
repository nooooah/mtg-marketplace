'use client'

import { ManaIcon, binderTabStyle, ALL_MANA_COLORS, type ManaColor } from './ManaIcon'
import type { Binder } from '@/types'

interface Props {
  binder: Binder
  onColorChange: (field: 'color1' | 'color2' | 'text_color', value: string) => void
  onColorClear:  (field: 'color1' | 'color2' | 'text_color') => void
  onManaToggle:  (color: ManaColor) => void
  onReset:       () => void
}

export default function BinderCustomizePanel({ binder, onColorChange, onColorClear, onManaToggle, onReset }: Props) {
  const mana = binder.mana_colors ?? []
  const hasCustom = !!(binder.color1 || binder.text_color || mana.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Background gradient */}
      <div>
        <Label>Background gradient</Label>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <ColorSwatch
            label="Color 1"
            value={binder.color1}
            onChange={v => onColorChange('color1', v)}
            onClear={() => onColorClear('color1')}
          />
          <ColorSwatch
            label="Color 2"
            value={binder.color2}
            disabled={!binder.color1}
            onChange={v => onColorChange('color2', v)}
            onClear={() => onColorClear('color2')}
          />
          {binder.color1 && (
            <div style={{
              height: '32px', flex: 1, minWidth: '80px', borderRadius: '8px',
              background: binder.color2
                ? `linear-gradient(90deg, ${binder.color1}, ${binder.color2})`
                : binder.color1,
              border: '1px solid var(--color-border)',
            }} />
          )}
        </div>
      </div>

      {/* Text colour */}
      <div>
        <Label>Text color</Label>
        <ColorSwatch
          label="Text"
          value={binder.text_color}
          onChange={v => onColorChange('text_color', v)}
          onClear={() => onColorClear('text_color')}
        />
      </div>

      {/* Mana pips */}
      <div>
        <Label hint="max 5 · shown in binder tab">Mana colors</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ALL_MANA_COLORS.map(c => {
            const selected = mana.includes(c)
            const atMax = mana.length >= 5 && !selected
            return (
              <button
                key={c}
                onClick={() => onManaToggle(c)}
                disabled={atMax}
                title={atMax ? 'Max 5 mana colors' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${selected ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: selected ? 'var(--color-blue-glow)' : 'transparent',
                  color: selected ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: atMax ? 'not-allowed' : 'pointer',
                  opacity: atMax ? 0.4 : 1, transition: 'all 0.12s ease',
                }}
              >
                <ManaIcon color={c} size={16} />{c}
              </button>
            )
          })}
        </div>
        {mana.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-subtle)' }}>Order:</span>
            {mana.map((c, i) => <ManaIcon key={i} color={c} size={18} />)}
          </div>
        )}
      </div>

      {/* Tab preview */}
      <div>
        <Label>Tab preview</Label>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
          ...binderTabStyle(binder, true),
        }}>
          {binder.name}
          {mana.map((c, i) => <ManaIcon key={i} color={c} size={15} />)}
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
          }}>5</span>
        </div>
      </div>

      {/* Reset */}
      {hasCustom && (
        <button
          onClick={onReset}
          style={{
            alignSelf: 'flex-start', fontSize: '12px', color: 'var(--color-muted)',
            background: 'transparent', border: '1px solid var(--color-border)',
            borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
          }}
        >
          Reset to default
        </button>
      )}
    </div>
  )
}

/* ─── Small helpers ───────────────────────────────────────────────────── */

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
      {children}
      {hint && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>— {hint}</span>}
    </p>
  )
}

function ColorSwatch({ label, value, onChange, onClear, disabled }: {
  label: string
  value: string | null
  onChange: (v: string) => void
  onClear: () => void
  disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', opacity: disabled ? 0.4 : 1 }}>
      <span style={{ fontSize: '11px', color: 'var(--color-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-block' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: value ?? '#e8e8e8',
            border: `2px solid ${value ? value + '90' : 'var(--color-border)'}`,
            boxShadow: value ? `0 0 0 1px ${value}40` : 'none',
          }} />
          {!disabled && (
            <input
              type="color"
              value={value ?? '#ffffff'}
              onChange={e => onChange(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', padding: 0, margin: 0 }}
            />
          )}
        </label>
        {value
          ? <button onClick={onClear} title="Clear" style={{ background: 'transparent', border: 'none', color: 'var(--color-subtle)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          : <span style={{ fontSize: '11px', color: 'var(--color-subtle)', fontStyle: 'italic' }}>none</span>
        }
      </div>
    </div>
  )
}
