import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from './store/useAppStore'
import { useWorkoutTimer } from './hooks/useWorkoutTimer'
import { useProgressTracking } from './hooks/useProgressTracking'
import Hoje from './pages/Hoje'
import Treino from './pages/Treino'
import Comida from './pages/Comida'
import Guia from './pages/Guia'
// Recharts (~400KB) só carrega ao abrir Evolução — app abre rápido no 4G da academia
const Progresso = lazy(() => import('./pages/Progresso'))

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: '▦' }, { id: 'treino', label: 'Treino', icon: '🏋️' },
  { id: 'comida', label: 'Comida', icon: '🍽️' }, { id: 'progresso', label: 'Evolução', icon: '📈' },
  { id: 'guia', label: 'Guia', icon: '⚙️' }
]

function TimerBar({ timer }) {
  if (!timer.running && timer.remainingMs <= 0) return null
  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-slate-900 text-white p-3.5 rounded-2xl border border-orange-500/40 flex justify-between items-center shadow-2xl">
      <div><p className="text-[11px] font-bold text-orange-400 uppercase">{timer.label}</p>
      <p className="font-mono text-xl font-black">{timer.mm}:{String(timer.ss).padStart(2, '0')}</p></div>
      <div className="flex gap-2">
        {timer.running
          ? <button onClick={timer.pause} className="px-3 py-2 rounded-xl bg-slate-700 text-xs font-bold min-h-[44px]">⏸ Pausar</button>
          : <button onClick={timer.resume} className="px-3 py-2 rounded-xl bg-slate-700 text-xs font-bold min-h-[44px]">▶ Seguir</button>}
        <button onClick={timer.add15s} className="px-3 py-2 rounded-xl bg-slate-700 text-xs font-bold min-h-[44px]">+15s</button>
        <button onClick={timer.cancel} className="px-3 py-2 rounded-xl bg-orange-500 text-xs font-bold min-h-[44px]">Pular</button>
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

  if (!hydrated) return <div className="p-8 text-center text-sm opacity-60">Carregando banco offline…</div>

  return (
    <div className="app-shell flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100">
      <aside className="hidden lg:flex flex-col w-72 border-r p-6 sticky top-0 h-screen bg-white dark:bg-[#1E293B]">
        <h1 className="font-black text-lg">🔥 PROJETO 133 DIAS</h1>
        <p className="text-xs opacity-60">Dia {p.currentDay} • {p.streak}d streak • Nv {p.level}</p>
        <nav className="mt-6 space-y-1.5 flex-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold min-h-[52px] ${tab === t.id ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setDark(!isDark)} className="px-4 py-3 rounded-2xl border font-bold text-sm min-h-[48px]">{isDark ? '☀️ Modo claro' : '🌙 Modo escuro'}</button>
        <p className="text-[11px] opacity-50 mt-3">{user.name} • PWA offline ✓</p>
      </aside>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-4 bottom-nav-pad">
        <div className="lg:hidden flex justify-between items-center pb-3 mb-2 border-b">
          <b>🔥 PROJETO 133 <span className="text-xs font-semibold opacity-60">DIA {p.currentDay}</span></b>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-orange-500">🔥{p.streak}d ⚡{p.xp}</span>
            <button onClick={() => setDark(!isDark)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 min-w-[44px] min-h-[44px]">{isDark ? '☀️' : '🌙'}</button>
          </div>
        </div>
        {tab === 'hoje' && <Hoje />}
        {tab === 'treino' && <Treino timer={timer} />}
        {tab === 'comida' && <Comida />}
        {tab === 'progresso' && (
          <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Carregando gráficos…</div>}>
            <Progresso />
          </Suspense>
        )}
        {tab === 'guia' && <Guia />}
      </main>

      <TimerBar timer={timer} />

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur border-t flex justify-around px-2 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl min-w-[60px] min-h-[56px] ${tab === t.id ? 'text-orange-500 font-bold' : 'opacity-60'}`}>
            <span className="text-xl">{t.icon}</span><span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
