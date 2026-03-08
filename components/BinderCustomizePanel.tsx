'use client'

import { ManaIcon, binderTabStyle, ALL_MANA_COLORS, MANA_LABEL, type ManaColor } from './ManaIcon'
import type { Binder } from '@/types'

/* ─── Preset palettes ─────────────────────────────────────────────────── */

const BG_PRESETS: { label: string; hex: string | null }[] = [
  { label: 'Default',   hex: null },
  { label: 'White',     hex: '#FFFFFF' },
  { label: 'MTG White', hex: '#F8F6D8' },
  { label: 'Blue',      hex: '#C1D7E9' },
  { label: 'Black',     hex: '#000000' },
  { label: 'MTG Black', hex: '#BAB1AB' },
  { label: 'Red',       hex: '#E49977' },
  { label: 'Green',     hex: '#A3C095' },
  { label: 'Colorless', hex: '#C9C4BE' },
  { label: 'Gold',      hex: '#DFC98A' },
  { label: 'Brown',     hex: '#D6CAC2' },
]

const TEXT_COLORS = [
  { label: 'Black', hex: '#000000' },
  { label: 'White', hex: '#FFFFFF' },
] as const

const BORDER_COLORS = [
  { label: 'None',  hex: null },
  { label: 'Black', hex: '#000000' },
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Gold',  hex: '#DFC98A' },
] as const

const FONTS = [
  { label: 'Default',      value: null },
  { label: 'Beleren',      value: 'Beleren2016' },
  { label: 'Receipt',      value: 'FakeReceipt' },
  { label: 'Sage Sans',    value: 'SageSans' },
] as const

interface Props {
  binder: Binder
  onUpdate: (patch: Partial<Binder>) => void
  onManaToggle:  (color: ManaColor) => void
  onReset:       () => void
}

export default function BinderCustomizePanel({ binder, onUpdate, onManaToggle, onReset }: Props) {
  const mana = binder.mana_colors ?? []
  const hasCustom = !!(binder.color1 || binder.text_color || binder.font_family || binder.border_color || mana.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Background color */}
      <div>
        <Label>Background color</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BG_PRESETS.map(preset => {
            const isSelected = (binder.color1 ?? null) === preset.hex
            const isDefault = preset.hex === null
            return (
              <button
                key={preset.label}
                onClick={() => onUpdate({ color1: preset.hex, color2: null })}
                title={preset.label}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: isDefault ? 'var(--color-surface-2)' : preset.hex!,
                  border: isSelected ? '3px solid var(--color-blue)' : '2px solid var(--color-border)',
                  boxShadow: isSelected ? '0 0 0 2px var(--color-blue-glow)' : 'none',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s ease',
                  outline: 'none', position: 'relative', overflow: 'hidden',
                }}
              >
                {isDefault && (
                  /* diagonal slash to indicate "none" */
                  <svg viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    <line x1="4" y1="4" x2="28" y2="28" stroke="var(--color-subtle)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
        {binder.color1 && (
          <p style={{ fontSize: '11px', color: 'var(--color-subtle)', margin: '6px 0 0', fontStyle: 'italic' }}>
            {BG_PRESETS.find(p => p.hex === binder.color1)?.label ?? binder.color1}
          </p>
        )}
      </div>

      {/* Text color */}
      <div>
        <Label>Text color</Label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TEXT_COLORS.map(tc => {
            const isSelected = binder.text_color === tc.hex
            return (
              <button
                key={tc.hex}
                onClick={() => onUpdate({ text_color: isSelected ? null : tc.hex })}
                title={tc.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-blue-glow)' : 'transparent',
                  color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}
              >
                <span style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: tc.hex,
                  border: tc.hex === '#FFFFFF' ? '1.5px solid var(--color-border)' : 'none',
                  flexShrink: 0,
                }} />
                {tc.label}
              </button>
            )
          })}
          {binder.text_color && (
            <button
              onClick={() => onUpdate({ text_color: null })}
              style={{
                padding: '5px 10px', borderRadius: '8px', fontSize: '11px',
                border: '1px solid var(--color-border)', background: 'transparent',
                color: 'var(--color-subtle)', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Font */}
      <div>
        <Label>Font</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FONTS.map(font => {
            const isSelected = (binder.font_family ?? null) === font.value
            return (
              <button
                key={font.label}
                onClick={() => onUpdate({ font_family: font.value })}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                  fontFamily: font.value ? `'${font.value}', serif` : 'inherit',
                  border: `1px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-blue-glow)' : 'transparent',
                  color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {font.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Border color */}
      <div>
        <Label hint="10px thick border">Border</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BORDER_COLORS.map(bc => {
            const isSelected = (binder.border_color ?? null) === bc.hex
            return (
              <button
                key={bc.label}
                onClick={() => onUpdate({ border_color: bc.hex })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-blue-glow)' : 'transparent',
                  color: isSelected ? 'var(--color-blue)' : 'var(--color-muted)',
                  cursor: 'pointer', transition: 'all 0.12s ease',
                }}
              >
                {bc.hex ? (
                  <span style={{
                    width: '14px', height: '14px', borderRadius: '3px',
                    background: bc.hex,
                    border: bc.hex === '#FFFFFF' ? '1.5px solid var(--color-border)' : 'none',
                    flexShrink: 0,
                  }} />
                ) : (
                  <span style={{
                    width: '14px', height: '14px', borderRadius: '3px',
                    border: '1.5px dashed var(--color-border)', flexShrink: 0,
                  }} />
                )}
                {bc.label}
              </button>
            )
          })}
        </div>
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
                <ManaIcon color={c} size={16} />{MANA_LABEL[c]}
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
