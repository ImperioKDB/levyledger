'use client'

interface Props {
  points: number[]
  labels: string[]
}

const WIDTH = 600
const HEIGHT = 160
const PAD = 8

export default function BalanceChart({ points, labels }: Props) {
  if (points.length < 2) return null

  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = max - min || 1

  const step = (WIDTH - PAD * 2) / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = PAD + i * step
    const y = PAD + (1 - (p - min) / range) * (HEIGHT - PAD * 2)
    return [x, y]
  })

  const linePath = coords.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x + ',' + y).join(' ')
  const areaPath =
    linePath +
    ' L' + coords[coords.length - 1][0] + ',' + (HEIGHT - PAD) +
    ' L' + coords[0][0] + ',' + (HEIGHT - PAD) + ' Z'

  return (
    <div>
      <svg viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} className="w-full h-40" preserveAspectRatio="none">
        <path d={areaPath} fill="var(--uniben)" fillOpacity="0.08" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--uniben)" strokeWidth="2" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--ink)" stroke="var(--uniben)" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {labels.map((l, i) => (
          <span key={i} className="font-data text-ghost text-[10px]">{l}</span>
        ))}
      </div>
    </div>
  )
}
