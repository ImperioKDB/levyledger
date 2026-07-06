'use client'

import { useEffect, useState } from 'react'

const WORDS = ['Faculty dues.', 'Union dues.', 'Departmental dues.', 'Class dues.', 'Association dues.']

// The longest word in the list reserves the horizontal space via an
// invisible sizer element. The visible, rotating word is absolutely
// positioned on top of it -- so cycling through words of different
// lengths never reflows the surrounding headline text.
const LONGEST = WORDS.reduce((a, b) => (b.length > a.length ? b : a), '')

export default function WordRotator() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % WORDS.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="relative inline-block align-top">
      <span aria-hidden="true" className="invisible whitespace-nowrap">
        {LONGEST}
      </span>
      <span
        key={index}
        className="absolute left-0 top-0 inline-block whitespace-nowrap animate-word-fade"
      >
        {WORDS[index]}
      </span>
    </span>
  )
}
