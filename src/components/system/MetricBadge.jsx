// MetricBadge — tag compacta mono + ponto pulsante (verde/âmbar/vermelho).
// Uso: números, métricas, IDs, status. Fonte JetBrains Mono, tabular-nums.

const TONES = {
  green: {
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    ping: 'bg-emerald-400',
  },
  amber: {
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    ping: 'bg-amber-400',
  },
  red: {
    text: 'text-red-300',
    dot: 'bg-red-400',
    ping: 'bg-red-400',
  },
  neutral: {
    text: 'text-zinc-300',
    dot: 'bg-zinc-400',
    ping: 'bg-zinc-400',
  },
}

export default function MetricBadge({
  tone = 'neutral',
  value,
  label,
  id,
  pulse = true,
  className = '',
  ...rest
}) {
  const t = TONES[tone] ?? TONES.neutral
  return (
    <span
      {...rest}
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1',
        'border-zinc-200 bg-zinc-50 font-mono text-[11px] font-medium tabular-nums',
        'dark:border-white/[0.08] dark:bg-[#1C211E]/60 dark:backdrop-blur-md',
        t.text,
        className,
      ].join(' ')}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span
            aria-hidden
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${t.ping}`}
          />
        )}
        <span aria-hidden className={`relative inline-flex h-1.5 w-1.5 rounded-full ${t.dot}`} />
      </span>
      {label && <span className="truncate text-zinc-500 dark:text-zinc-500">{label}</span>}
      <span className="truncate" data-numeric={id ?? value}>
        {value}
      </span>
    </span>
  )
}
