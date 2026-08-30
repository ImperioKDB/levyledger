interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'bg-paper animate-pulse'
  const variantClasses = {
    text: 'h-4 rounded-none',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} aria-hidden="true" />
}
