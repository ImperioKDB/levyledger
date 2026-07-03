'use client'

interface Member {
  address: string
  title: string
  signed: number
  rejected: number
}

interface Props {
  members: Member[]
  loading: boolean
  treasury: any
}

export default function DesktopMembersList({ members, loading, treasury }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading members...</div>
  }
  if (!treasury) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Treasury Not Found</p>
        <p className="text-body text-sm">This treasury has not been initialized on-chain yet.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Members</h1>
      <p className="text-body text-sm mb-8">
        The 5 registered exec signers for this treasury. {treasury.threshold} of 5 must approve every proposal.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {members.map((m, i) => (
          <div key={i} className="border border-rule bg-paper p-5">
            <p className="font-display font-semibold text-ledger text-base mb-2">{m.title}</p>
            <p className="font-data text-ghost text-xs break-all mb-4">{m.address}</p>
            <div className="flex gap-4 pt-4 border-t border-rule">
              <div>
                <p className="font-data text-nigerian text-lg font-bold">{m.signed}</p>
                <p className="font-data text-ghost text-[10px] tracking-widest uppercase">Signed</p>
              </div>
              <div>
                <p className="font-data text-void text-lg font-bold">{m.rejected}</p>
                <p className="font-data text-ghost text-[10px] tracking-widest uppercase">Rejected</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
