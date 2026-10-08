// Design system — componentes visuais únicos do app.
// Ícones SVG próprios (stroke), cards, botões e barras consistentes.
// Regra: nada de emoji como ícone de interface — use <Icon>.

const PATHS = {
  home: <><path d="M3 9.5 12 2.5l9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  dumbbell: <><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /></>,
  food: <><path d="M4 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2" /><line x1="7" y1="2" x2="7" y2="22" /><path d="M19 2v20" /><path d="M19 6h3a2 2 0 0 1 2 2v3a3 3 0 0 1-3 3h-2" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
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
  save: <><path d="M12 3v12" /><polyline points="7 10 12 15 17 10" /><path d="M4 21h16" /></>,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><line x1="11" y1="18.5" x2="13" y2="18.5" /></>,
  pencil: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
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

// Cartão padrão — uma borda, um raio, um padding. Use em todas as telas.
export function Card({ className = '', children, tint = false, edge = null }) {
  return (
    <div className={`rounded-2xl border bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm ${tint ? 'bg-slate-50 dark:bg-slate-900/40' : ''} ${edge ? `border-l-4 ${edge}` : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ icon, children, right }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <h3 className="font-extrabold text-[15px] flex items-center gap-2">
        {icon && <span className="text-orange-500"><Icon name={icon} size={17} /></span>}
        {children}
      </h3>
      {right}
    </div>
  )
}

// Botão primário/fantasma/perigo — altura e peso únicos (48–52px).
export function Btn({ variant = 'primary', className = '', ...props }) {
  const base = 'min-h-[50px] rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 px-4 active:scale-[0.98] transition disabled:opacity-40'
  const kinds = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25',
    dark: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
    ghost: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    dangerSoft: 'bg-red-500/10 text-red-500 border border-red-500/30',
  }
  return <button className={`${base} ${kinds[variant] ?? kinds.primary} ${className}`} {...props} />
}

// Barra de progresso fina e consistente.
export function Bar({ value = 0, className = '', track = 'bg-slate-100 dark:bg-slate-800' }) {
  return (
    <div className={`h-2 rounded-full overflow-hidden ${track} ${className}`}>
      <div className="h-full rounded-full bg-current transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

// Missão/quest com ícone SVG e checkbox animado.
export function QuestRow({ icon, title, sub, done, onToggle, accent = 'emerald' }) {
  const ring = accent === 'blue'
    ? (done ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40')
    : (done ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40')
  return (
    <button onClick={onToggle}
      className={`w-full min-h-[60px] flex items-center justify-between p-3 rounded-xl border text-left active:scale-[0.99] transition ${ring}`}>
      <span className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300'}`}>
          <Icon name={icon} size={18} />
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-bold leading-tight ${done ? 'line-through opacity-60' : ''}`}>{title}</span>
          <span className="block text-xs opacity-60 mt-0.5">{sub}</span>
        </span>
      </span>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 font-black ${done ? 'bg-emerald-500 text-white border-emerald-500 check-pop' : 'bg-white dark:bg-slate-800 text-transparent'}`}>
        <Icon name="check" size={15} strokeWidth={3} />
      </span>
    </button>
  )
}
