import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-ink flex flex-col">
      <header className="border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs hover:text-uniben transition-colors">
          ← LEVYLEDGER
        </Link>
      </header>
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
          Error 404
        </p>
        <h1 className="font-display text-3xl font-bold text-ledger tracking-tight mb-3">
          Not on the record
        </h1>
        <p className="text-body text-sm leading-relaxed mb-8">
          This page does not exist. If you followed a link here, it may have
          moved. The ledger itself is intact.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="font-data text-xs tracking-widest py-3 px-5 bg-uniben text-ink hover:opacity-90 active:scale-[0.98] transition-all"
          >
            GO HOME
          </Link>
          <Link
            href="/universities"
            className="font-data text-xs tracking-widest py-3 px-5 border border-rule text-ghost hover:border-ledger hover:text-ledger transition-colors"
          >
            FACULTIES
          </Link>
        </div>
      </div>
    </main>
  )
}
