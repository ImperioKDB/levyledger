// One-line plain-language note. Used wherever the ledger vocabulary
// (USDC, vault, reserved, on-chain) meets a student audience.
export default function TermHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-body text-xs leading-relaxed border-l-2 border-rule pl-3">
      {children}
    </p>
  )
}
