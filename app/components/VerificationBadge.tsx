'use client'

interface Props {
  verified?: boolean
}

export default function VerificationBadge({ verified = true }: Props) {
  if (!verified) return null
  return (
    <div className="inline-flex items-center gap-2 border border-nigerian px-3 py-1.5">
      <span className="w-1.5 h-1.5 bg-nigerian" />
      <span className="font-data text-nigerian text-[10px] tracking-widest uppercase">
        Verified On-chain
      </span>
    </div>
  )
}
