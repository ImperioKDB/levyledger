'use client'

export default function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-lifted" style={{ width: `${60 + (i % 3) * 20}%` }} />
      ))}
    </div>
  )
}
