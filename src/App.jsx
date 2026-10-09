import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from './store/useAppStore'
import { Icon } from './components/ui'
import { useWorkoutTimer } from './hooks/useWorkoutTimer'
import Hoje from './pages/Hoje'
import Treino from './pages/Treino'
import Comida from './pages/Comida'
import Guia from './pages/Guia'
// Recharts (~400KB) só carrega ao abrir Evolução — app abre rápido no 4G da academia
const Progresso = lazy(() => import('./pages/Progresso'))

const TABS = [
  { id: 'hoje', label: 'Início', icon: 'home' },
  { id: 'treino', label: 'Treino', icon: 'dumbbell' },
  { id: 'comida', label: 'Alimentação', icon: 'food' },
  { id: 'progresso', label: 'Evolução', icon: 'chart' },
  { id: 'guia', label: 'Guia', icon: 'book' },
]

const HEADERS = {
  hoje: null, // dinâmico: PULSO / DIA DA SEMANA + saudação
  treino: { contexto: 'PULSO / MOVIMENTO', titulo: 'Seu treino, seu ritmo' },
  comida: { contexto: 'PULSO / ALIMENTAÇÃO', titulo: 'Nutrir é cuidar' },
  progresso: { contexto: 'PULSO / SUA JORNADA', titulo: 'Seu esforço aparece' },
  guia: { contexto: 'PULSO / SEU GUIA', titulo: 'Aprenda e evolua' },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function contextoHoje() {
  try {
    const s = new Date()
      .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
      .replace('-feira', '')
      .replaceAll('.', '')
    return `PULSO / ${s.toUpperCase()}`
  } catch {
    return 'PULSO / HOJE'
  }
}

function TimerBar({ timer }) {
  if (!timer.running && timer.remainingMs <= 0) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-md rounded-[20px] bg-card border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-4"
      style={{ bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex justify-between items-center">
        <div><p className="text-[11px] font-semibold text-muted-foreground">{timer.label}</p>
        <p className="tabular text-xl font-bold">{timer.mm}:{String(timer.ss).padStart(2, '0')}</p></div>
        <div className="flex gap-2">
          {timer.running
            ? <button onClick={timer.pause} className="h-12 px-4 rounded-[10px] bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95">Pausar</button>
            : <button onClick={timer.resume} className="h-12 px-4 rounded-[10px] bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95">Seguir</button>}
          <button onClick={timer.add15s} className="h-12 px-4 rounded-[10px] bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95">+15s</button>
          <button onClick={timer.cancel} className="h-12 px-4 rounded-[10px] bg-primary text-primary-foreground text-sm font-semibold active:scale-95">Pular</button>
        </div>
      </div>
      <div className="mt-2 h-[5px] rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.round(timer.progress * 100)}%` }} />
      </div>
    </div>
  )
}

function Toast() {
  const toast = useAppStore((s) => s.toast)
  if (!toast) return null
  return (
    <div key={toast.key} className="fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
      <div className="toast-in flex items-center gap-2 rounded-[10px] bg-primary text-primary-foreground px-4 py-2.5 text-[13px] font-semibold max-w-[92vw]">
        <Icon name="bell" size={15} /><span className="truncate">{toast.text}</span>
      </div>
    </div>
  )
}

export default function App() {
  const tab = useAppStore((s) => s.activeTab)
  const setTab = useAppStore((s) => s.setTab)
  const hydrate = useAppStore((s) => s.hydrate)
  const hydrated = useAppStore((s) => s.hydrated)
  const user = useAppStore((s) => s.user)
  const timer = useWorkoutTimer()

  useEffect(() => { hydrate() }, [hydrate])

  if (!hydrated) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>

  const firstName = (user.name || 'Miguel').split(' ')[0]
  const initials = user.initials || firstName.slice(0, 2).toUpperCase()
  const head = HEADERS[tab] ?? HEADERS.hoje
  const contexto = tab === 'hoje' ? contextoHoje() : head.contexto
  const titulo = tab === 'hoje' ? `${greeting()}, ${firstName}` : head.titulo

  return (
    <div className="app-shell flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 w-full max-w-[412px] lg:max-w-3xl mx-auto bottom-nav-pad">
        {/* Cabeçalho do mock: contexto lima + título 29px + avatar */}
        <header className="flex items-center justify-between gap-3 px-[22px] pt-4 pb-2 min-h-[88px]">
          <div className="min-w-0">
            <p className="contexto mb-[7px]">{contexto}</p>
            <h1 className="text-[29px] leading-[1.2] font-bold">{titulo}</h1>
          </div>
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold" style={{ color: '#E9D8BD' }}>
            {initials}
          </span>
        </header>

        <div className="px-[22px] pt-2 flex flex-col gap-[18px]">
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

      {/* Menu inferior flutuante: pill arredondada com vidro + pill ativa com brilho */}
      <nav aria-label="Navegação principal"
        className="fixed left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-24px)] max-w-[400px] grid grid-cols-5 gap-[2px] rounded-[28px] border border-white/10 bg-[#1C211E]/85 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        style={{ boxSizing: 'border-box', bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', padding: '10px 10px 12px' }}>
        {TABS.map((t) => {
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-[5px] rounded-2xl py-1 text-[10px] leading-[12px] whitespace-nowrap transition-all duration-300 active:scale-90 ${isActive ? 'font-semibold text-[#D2F27B]' : 'text-[#A0ABA2]'}`}>
              <span className={`grid h-[30px] w-12 place-items-center rounded-full transition-all duration-300 ${isActive ? '-translate-y-[1px] scale-105 bg-[#2D3821] shadow-[0_0_18px_rgba(210,242,123,0.28)]' : 'scale-100'}`}>
                <Icon name={t.icon} size={20} strokeWidth={1.8} />
              </span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
