export default function DemoBanner() {
  return (
    <div className="border border-pending bg-paper px-4 py-2.5 flex items-center gap-2.5">
      <span className="w-1.5 h-1.5 bg-pending pulse-dot shrink-0" />
      <p className="font-data text-pending text-[10px] tracking-wide leading-relaxed">
        DEMO NETWORK · TEST USDC ONLY · NO REAL FUNDS
      </p>
    </div>
  )
}
