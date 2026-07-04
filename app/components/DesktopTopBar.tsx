export default function DesktopTopBar({ universityName }: { universityName: string }) {
  return (
    <header className="border-b border-rule px-8 py-5 flex items-center justify-between">
      <h1 className="font-display text-xl font-bold text-ledger">{universityName}</h1>
      <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">DEVNET</span>
    </header>
  )
}
