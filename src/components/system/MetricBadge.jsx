// Pill de status estilo app: sem ping, sem mono exagerado.
const TONES = {
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-600 dark:text-red-300',
  neutral: 'bg-secondary text-muted-foreground',
}

export default function MetricBadge({
  tone = 'neutral',
  value,
  label,
  className = '',
  ...rest
}) {
  void rest.pulse
  void rest.id
  const { pulse, id, ...spanProps } = rest
  return (
    <span
      {...spanProps}
      className={[
        'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1',
        'text-xs font-semibold tabular-nums',
        TONES[tone] ?? TONES.neutral,
        className,
      ].join(' ')}
    >
      {label && <span className="truncate opacity-70">{label}</span>}
      <span className="truncate">{value}</span>
    </span>
  )
}
