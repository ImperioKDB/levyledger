'use client'

import { useState } from 'react'

// Copies a value to the clipboard and confirms with a brief COPIED state.
// Falls back to the legacy execCommand path when the async clipboard
// API is unavailable.
export default function CopyButton({ value, label = 'COPY' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      // Both paths failed. Leave the button idle rather than fake success.
    }
  }

  return (
    <button
      onClick={copy}
      className={`font-data text-[10px] tracking-widest px-3 py-2.5 border transition-colors active:scale-[0.98] ${
        copied
          ? 'border-nigerian text-nigerian'
          : 'border-rule text-ghost hover:border-ghost hover:text-ledger'
      }`}
    >
      {copied ? 'COPIED' : label}
    </button>
  )
}
