'use client'
import { useState, useEffect } from 'react'

const WORDS = ['LEVIES', 'DUES', 'FUNDS', 'TAXES']
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'

export default function TextScrambler() {
  const [index, setIndex] = useState(0)
  const [displayText, setDisplayText] = useState(WORDS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      const nextWord = WORDS[(index + 1) % WORDS.length]
      let iteration = 0
      
      const scrambleInterval = setInterval(() => {
        setDisplayText(prev => 
          nextWord.split('').map((char, idx) => {
            if (idx < iteration) return nextWord[idx]
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }).join('')
        )
        
        if (iteration >= nextWord.length) {
          clearInterval(scrambleInterval)
          setIndex(prev => (prev + 1) % WORDS.length)
        }
        iteration += 1/3
      }, 30)
    }, 4500)

    return () => clearInterval(interval)
  }, [index])

  return (
    <span className="font-data text-uniben inline-block min-w-[130px] transition-colors duration-150">
      {displayText}
    </span>
  )
}
