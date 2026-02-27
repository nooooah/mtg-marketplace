'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

export default function SearchBar({ defaultValue = '', placeholder = 'Search cards, sets, or sellers…', onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(value)
    } else {
      router.push(`/buy?q=${encodeURIComponent(value)}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
        width: '100%',
      }}
      onFocus={() => {
        const el = document.querySelector('form[data-searchbar]') as HTMLElement
        if (el) el.style.borderColor = 'var(--color-blue)'
      }}
      data-searchbar
    >
      {/* Search icon */}
      <div
        style={{
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-subtle)',
          flexShrink: 0,
        }}
      >
        <SearchIcon />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: '14px 0',
          fontSize: '15px',
          color: 'var(--color-text)',
          outline: 'none',
          width: '100%',
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('')
            inputRef.current?.focus()
          }}
          style={{
            padding: '0 10px',
            background: 'transparent',
            color: 'var(--color-subtle)',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <XIcon />
        </button>
      )}

      {/* Submit */}
      <button
        type="submit"
        style={{
          padding: '10px 20px',
          background: 'var(--color-blue)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          flexShrink: 0,
          transition: 'background 0.15s ease',
          margin: '5px',
          borderRadius: '8px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-blue-dim)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-blue)')}
      >
        Search
      </button>
    </form>
  )
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
