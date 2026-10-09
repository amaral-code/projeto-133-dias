// Design system shadcn-style — neutro, solido, sem gradiente.
// Regra: nada de emoji como icone de interface — use <Icon>.

const PATHS = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-9h6v9" /></>,
  dumbbell: <><path d="m6.5 6.5 11 11" /><path d="m4 9-2 2 11 11 2-2" /><path d="m9 4 2-2 11 11-2 2" /><path d="m3 7 4-4 3 3-4 4Z" /><path d="m14 18 4-4 3 3-4 4Z" /></>,
  food: <><path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18" /><path d="M20 3c-4 0-5 5-5 9h5M20 3v18" /></>,
  chart: <><path d="M3 21V11M8 21v-7M13 21V9M18 21V5" /><path d="m3 8 5-4 5 2 8-5" /></>,
  book: <><path d="M12 5c-3-2-6-2-10-2v16c4 0 7 0 10 2" /><path d="M12 5c3-2 6-2 10-2v16c-4 0-7 0-10 2" /><path d="M12 5v16" /></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
  flame: <path d="M12 2.5c2.2 4.2 6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 3.8-6.8 6-11z" />,
  drop: <path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  check: <polyline points="20 6 9 17 4 12" />,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  chevL: <polyline points="15 18 9 12 15 6" />,
  chevR: <polyline points="9 18 15 12 9 6" />,
  chevD: <polyline points="6 9 12 15 18 9" />,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3" /><line x1="12" y1="13" x2="12" y2="17" /><line x1="8.5" y1="21" x2="15.5" y2="21" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  scale: <><circle cx="12" cy="13" r="7.5" /><polyline points="12 13 15 9.5" /><line x1="12" y1="5.5" x2="12" y2="2.5" /><line x1="9" y1="2.5" x2="15" y2="2.5" /></>,
  ruler: <><path d="M3 17 17 3l4 4L7 21z" /><line x1="8.5" y1="13.5" x2="11" y2="16" /><line x1="11.5" y1="10.5" x2="14" y2="13" /></>,
  video: <><rect x="2.5" y="6" width="13" height="12" rx="2.5" /><polygon points="15.5 10.5 21.5 7.5 21.5 16.5 15.5 13.5" /></>,
  star: <polygon points="12 2.5 15.1 8.8 22 9.8 17 14.7 18.2 21.5 12 18.2 5.8 21.5 7 14.7 2 9.8 8.9 8.8 12 2.5" />,
  info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="8" r="0.6" /></>,
  repeat: <><polyline points="17 2 21 6 17 10" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 22 3 18 7 14" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><line x1="11" y1="18.5" x2="13" y2="18.5" /></>,
  pencil: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
}

export function Icon({ name, size = 18, strokeWidth = 2, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      {PATHS[name] ?? PATHS.info}
    </svg>
  )
}

// Card shadcn: borda 1px, raio 8px, sem sombra colorida.
export function Card({ className = '', children }) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground ${className}`}>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

export function SectionTitle({ icon, children, right }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold leading-none tracking-tight flex items-center gap-2">
        {icon && <span className="text-muted-foreground"><Icon name={icon} size={16} /></span>}
        {children}
      </h3>
      {right}
    </div>
  )
}

// Button shadcn: h-10, rounded-md, text-sm font-medium, sem sombra.
export function Btn({ variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 [&_svg]:size-4 [&_svg]:shrink-0'
  const kinds = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    success: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
    dangerSoft: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  }
  return <button className={`${base} ${kinds[variant] ?? kinds.primary} ${className}`} {...props} />
}

// Progress shadcn: trilha muted, fill solido.
export function Bar({ value = 0, className = '', track = '' }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-secondary ${track} ${className}`}>
      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

// Checkbox row shadcn: borda, hover muted, sem wash colorido.
export function QuestRow({ icon, title, sub, done, onToggle }) {
  return (
    <button onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50 min-h-[60px]">
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${done ? 'border-transparent bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Icon name={icon} size={17} />
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-medium leading-tight ${done ? 'line-through text-muted-foreground' : ''}`}>{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
        </span>
      </span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${done ? 'border-primary bg-primary text-primary-foreground check-pop' : 'bg-background text-transparent'}`}>
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
    </button>
  )
}
