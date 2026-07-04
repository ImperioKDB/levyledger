interface Props {
  verified?: boolean
}

export default function VerificationBadge({ verified = true }: Props) {
  if (!verified) {
    return (
      <span className="font-data text-[10px] text-ghost border border-rule px-1.5 py-0.5 tracking-widest">
        UNVERIFIED
      </span>
    )
  }
  return (
    <span className="font-data text-[10px] text-nigerian border border-nigerian px-1.5 py-0.5 tracking-widest">
      VERIFIED ON-CHAIN
    </span>
  )
}
