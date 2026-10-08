import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from './store/useAppStore'
import { Icon } from './components/ui'
import { useWorkoutTimer } from './hooks/useWorkoutTimer'
import { useProgressTracking } from './hooks/useProgressTracking'
import Hoje from './pages/Hoje'
import Treino from './pages/Treino'
import Comida from './pages/Comida'
import Guia from './pages/Guia'
// Recharts (~400KB) só carrega ao abrir Evolução — app abre rápido no 4G da academia
const Progresso = lazy(() => import('./pages/Progresso'))

const TABS = [
  { id: 'hoje', label: 'Início', icon: 'home', kicker: null },
  { id: 'treino', label: 'Treino', icon: 'dumbbell', kicker: 'MOVIMENTO' },
  { id: 'comida', label: 'Alimentação', icon: 'food', kicker: 'ALIMENTAÇÃO' },
  { id: 'progresso', label: 'Evolução', icon: 'chart', kicker: 'SUA JORNADA' },
  { id: 'guia', label: 'Guia', icon: 'sliders', kicker: 'SEU GUIA' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function todayKicker() {
  try {
    return new Date()
      .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
      .toUpperCase()
      .replace('-FEIRA', '')
      .replaceAll('.', '')
      .replace(' DE ', ' ')
  } catch {
    return ''
  }
}

function TimerBar({ timer }) {
  if (!timer.running && timer.remainingMs <= 0) return null
  return (
    <div className="fixed bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md rounded-lg border bg-card p-3">
      <div className="flex justify-between items-center">
        <div><p className="label">{timer.label}</p>
        <p className="font-mono tabular text-xl font-semibold">{timer.mm}:{String(timer.ss).padStart(2, '0')}</p></div>
        <div className="flex gap-2">
          {timer.running
            ? <button onClick={timer.pause} className="h-10 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium transition active:scale-[0.98]">Pausar</button>
            : <button onClick={timer.resume} className="h-10 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium transition active:scale-[0.98]">Seguir</button>}
          <button onClick={timer.add15s} className="h-10 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium transition active:scale-[0.98]">+15s</button>
          <button onClick={timer.cancel} className="h-10 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium transition active:scale-[0.98]">Pular</button>
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.round(timer.progress * 100)}%` }} />
      </div>
    </div>
  )
}

function Toast() {
  const toast = useAppStore((s) => s.toast)
  if (!toast) return null
  return (
    <div key={toast.key} className="toast-in fixed top-3 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
      <div className="flex items-center gap-2 rounded-md border bg-foreground text-background px-3 py-2 text-xs font-medium max-w-[92vw]">
        <Icon name="bell" size={14} /><span className="truncate">{toast.text}</span>
      </div>
    </div>
  )
}

export default function App() {
  const tab = useAppStore((s) => s.activeTab)
  const setTab = useAppStore((s) => s.setTab)
  const isDark = useAppStore((s) => s.isDark)
  const setDark = useAppStore((s) => s.setDark)
  const hydrate = useAppStore((s) => s.hydrate)
  const hydrated = useAppStore((s) => s.hydrated)
  const user = useAppStore((s) => s.user)
  const timer = useWorkoutTimer()
  const p = useProgressTracking()

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark) }, [isDark])

  if (!hydrated) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando banco offline…</div>

  const firstName = (user.name || 'Miguel').split(' ')[0]
  const initials = user.initials || firstName.slice(0, 2).toUpperCase()
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]
  const kicker = active.kicker ?? todayKicker()

  return (
    <div className="app-shell flex flex-col lg:flex-row min-h-screen bg-background text-foreground">
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card sticky top-0 h-screen">
        <div className="p-6 pb-4">
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">PULSO</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">{greeting()}, {firstName}</h1>
          <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">Dia {p.currentDay}/133 · {p.streak}d seguidos</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors h-10 active:scale-[0.98] ${tab === t.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon name={t.icon} size={17} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={() => setDark(!isDark)} className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent transition active:scale-[0.98]">
            <Icon name={isDark ? 'sun' : 'moon'} size={16} /> {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">{user.name} · offline</p>
        </div>
      </aside>

      {/* Coluna 412px do Figma: conteúdo px 22, seções com gap 18 */}
      <main className="flex-1 w-full max-w-[412px] lg:max-w-3xl mx-auto px-[22px] pt-2 bottom-nav-pad">
        <div className="flex h-[88px] items-center gap-3 border-b border-border">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[10px] tracking-[0.14em] text-muted-foreground">PULSO / {kicker}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight">{greeting()}, {firstName}</h1>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1.5 font-mono text-[11px] tabular-nums">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />{p.streak}d
          </span>
          <button onClick={() => setDark(!isDark)} aria-label="Alternar tema" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border transition hover:bg-accent active:scale-[0.98]">
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
          </button>
        </div>

        <div className="pt-2">
          {tab === 'hoje' && <Hoje />}
          {tab === 'treino' && <Treino timer={timer} />}
          {tab === 'comida' && <Comida />}
          {tab === 'progresso' && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando gráficos…</div>}>
              <Progresso />
            </Suspense>
          )}
          {tab === 'guia' && <Guia />}
        </div>
      </main>

      <TimerBar timer={timer} />
      <Toast />

      {/* Navegação PULSO: 96px, fundo #1C211E, borda #323B34 */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#1C211E] border-t border-[#323B34]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
        <div className="mx-auto flex h-[96px] max-w-[412px] justify-around px-3 pt-[10px]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex min-h-[64px] min-w-[56px] flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition active:scale-[0.98] ${tab === t.id ? 'text-foreground' : 'text-muted-foreground'}`}>
            <Icon name={t.icon} size={22} />
            <span className="leading-tight">{t.label}</span>
            <span className={`h-1 w-1 rounded-full ${tab === t.id ? 'bg-primary' : 'bg-transparent'}`} />
          </button>
        ))}
        </div>
      </nav>
    </div>
  )
}
