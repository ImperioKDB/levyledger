import RoleBadge from './RoleBadge'
import ConnectWallet from './ConnectWallet'

interface Props {
  universityName: string
  connected?: boolean
  isAdmin?: boolean
  isExec?: boolean
}

export default function DesktopTopBar({ universityName, connected = false, isAdmin = false, isExec = false }: Props) {
  return (
    <header className="border-b border-rule px-8 py-5 flex items-center justify-between">
      <h1 className="font-display text-xl font-bold text-ledger">{universityName}</h1>
      <div className="flex items-center gap-2">
        <RoleBadge connected={connected} isAdmin={isAdmin} isExec={isExec} />
        <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">DEVNET</span>
        <ConnectWallet />
      </div>
    </header>
  )
}
