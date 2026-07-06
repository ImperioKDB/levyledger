interface Props {
  connected: boolean
  isAdmin: boolean
  isExec: boolean
}

// Wallet connection *is* the auth system here (no separate login/signup --
// see the on-chain signer check in the Anchor program for why that's
// enough for the actions that matter). This badge just makes that identity
// visible in the UI so it's never ambiguous who's looking at the screen,
// especially useful when switching wallets live during a demo.
export default function RoleBadge({ connected, isAdmin, isExec }: Props) {
  if (!connected) return null

  const label = isAdmin ? 'ADMIN' : isExec ? 'FACULTY EXEC' : 'STUDENT'
  const colorClass = isAdmin
    ? 'text-void border-void'
    : isExec
      ? 'text-uniben border-uniben'
      : 'text-ghost border-rule'

  return (
    <span className={`font-data text-[10px] tracking-widest px-2 py-1 border shrink-0 ${colorClass}`}>
      {label}
    </span>
  )
}
