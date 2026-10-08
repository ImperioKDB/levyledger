import Link from 'next/link'

interface Props {
  university: string
}

// The three questions every student actually asks, mapped to the pages
// that answer them with evidence.
const ITEMS = [
  {
    question: 'Where does the money sit?',
    answer: 'The vault account, and the rules that control it.',
    href: (u: string) => `/${u}/wallets`,
  },
  {
    question: 'What has been spent?',
    answer: 'Every executed payment, with its amount and recipient.',
    href: (u: string) => `/${u}/proposals?filter=executed`,
  },
  {
    question: 'What is waiting on signatures?',
    answer: 'Proposals that execs have not fully approved yet.',
    href: (u: string) => `/${u}/signatures`,
  },
]

export default function AuditJourney({ university }: Props) {
  return (
    <div className="border border-rule bg-paper">
      <p className="font-data text-ghost text-[10px] tracking-widest uppercase px-4 pt-3 pb-1">
        Ask the ledger
      </p>
      {ITEMS.map((item, i) => (
        <Link
          key={i}
          href={item.href(university)}
          className={`flex items-center justify-between gap-4 px-4 py-4 hover:bg-lifted active:bg-lifted transition-colors ${
            i > 0 ? 'border-t border-rule' : ''
          }`}
        >
          <div className="min-w-0">
            <p className="font-display font-semibold text-ledger text-sm">{item.question}</p>
            <p className="text-body text-xs mt-0.5">{item.answer}</p>
          </div>
          <span className="font-data text-uniben text-xs shrink-0">→</span>
        </Link>
      ))}
    </div>
  )
}
