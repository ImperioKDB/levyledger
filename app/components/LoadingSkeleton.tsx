interface Props {
  lines?: number
}

export default function LoadingSkeleton({ lines = 4 }: Props) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-paper animate-pulse"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}
