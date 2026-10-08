import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking, isDayComplete, isWeekendDay } from '../hooks/useProgressTracking'
import { PROGRAM, MISSIONS_TEMPLATE, setsForBlock } from '../data/program'
import { blockForWeek, focusForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { calcWaterGoal } from '../lib/tdee'
import { dayTotals, targetsFor } from '../lib/diet'
import { sfx } from '../lib/sound'
import { Card, SectionTitle, Btn, Bar, QuestRow, Icon } from '../components/ui'

const ICONS = { utensils: 'food', droplet: 'drop', dumbbell: 'dumbbell', flame: 'flame', moon: 'moon' }
const AUTO_KEY = () => ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'
const GAUGE_C = 2 * Math.PI * 42

function DayNav({ p }) {
  const setViewDay = useAppStore((s) => s.setViewDay)
  const d = p.displayDay
  return (
    <div className="stagger-1 flex items-center justify-between gap-2 rounded-2xl border bg-white dark:bg-[#1E293B] p-2">
      <button onClick={() => setViewDay(Math.max(1, d - 1))} disabled={d <= 1} aria-label="Dia anterior" className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xl disabled:opacity-30 active:scale-95">‹</button>
      <div className="text-center">
        <p className="text-sm font-black">DIA {d} <span className="font-medium opacity-50">de 133</span></p>
        {p.isViewingPast
          ? <button onClick={() => setViewDay(null)} className="text-[11px] font-bold text-orange-500 underline min-h-[32px]">← voltar p/ hoje (dia {p.currentDay})</button>
          : <p className="text-[11px] opacity-50">{blockForWeek(Math.ceil(d / 7)).name} • semana {Math.ceil(d / 7)}</p>}
      </div>
      <button onClick={() => setViewDay(Math.min(p.currentDay, d + 1))} disabled={d >= p.currentDay} aria-label="Próximo dia" className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xl disabled:opacity-30 active:scale-95">›</button>
    </div>
  )
}

// Chuva de confete CSS (sem dependências) ao completar as 5 missões
function Celebration({ fire }) {
  const pieces = useMemo(() => Array.from({ length: 26 }, (_, k) => ({
    left: (k * 37) % 100,
    delay: ((k * 53) % 400) / 1000,
    color: ['#F97316', '#FBBF24', '#10B981', '#FFFFFF', '#34D399'][k % 5],
  })), [])
  if (!fire) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((pc, k) => (
        <span key={k} className="confetti-piece" style={{ left: `${pc.left}%`, animationDelay: `${pc.delay}s`, background: pc.color }} />
      ))}
    </div>
  )
}

export default function Hoje() {
  const setTab = useAppStore((s) => s.setTab)
  const toggleMission = useAppStore((s) => s.toggleMission)
  const addWater = useAppStore((s) => s.addWater)
  const logBody = useAppStore((s) => s.logBody)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const user = useAppStore((s) => s.user)
  const p = useProgressTracking()
  const day = p.displayDay
  const mealLogDay = useAppStore((s) => s.mealLog[day] ?? {})
  const missions = useAppStore((s) => s.days[day]?.missions ?? {})
  const dayLog = useAppStore((s) => s.days[day] ?? {})
  const waterMl = dayLog.waterMl ?? 0
  const [quickWeight, setQuickWeight] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const prevDone = useRef(0)

  const WATER_GOAL = calcWaterGoal(user.weight)
  const done = MISSIONS_TEMPLATE.filter((m) => missions[m.id]).length
  const pct = Math.round((done / MISSIONS_TEMPLATE.length) * 100)
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)
  const waterPct = Math.min(100, Math.round((waterMl / WATER_GOAL) * 100))
  const waterDone = waterMl >= WATER_GOAL

  // Dieta real do dia (mesma conta da tela Comida)
  const targets = useMemo(() => targetsFor(user), [user])
  const totals = useMemo(() => dayTotals(mealLogDay), [mealLogDay])
  const eaten = Math.round(totals.k)
  const remain = targets.kcal - eaten
  const gaugeFill = Math.max(0, Math.min(1, eaten / targets.kcal))

  // Treino do dia (mesmo plano da aba Treino, com séries do bloco atual)
  const wd = new Date().getDay()
  const isWeekend = wd === 0 || wd === 6
  const trainKey = AUTO_KEY()
  const plan = PROGRAM[trainKey]
  const blockSets = useMemo(() => plan.exercises.reduce((a, e) => a + setsForBlock(e, block.idx).length, 0), [plan, block.idx])
  const cardioTotal = useMemo(() => buildCardio(trainKey, block.idx).total, [trainKey, block.idx])
  const estMin = blockSets * 2 + cardioTotal

  // Fanfarra ao completar as 5 missões
  useEffect(() => {
    if (done === MISSIONS_TEMPLATE.length && prevDone.current < MISSIONS_TEMPLATE.length) {
      sfx.fanfare()
      setCelebrate(true)
      const id = setTimeout(() => setCelebrate(false), 2600)
      return () => clearTimeout(id)
    }
    prevDone.current = done
  }, [done])

  const onToggleMission = (id) => {
    const turningOn = !missions[id]
    toggleMission(day, id)
    if (turningOn) sfx.success(); else sfx.uncheck()
  }

  const onAddWater = (ml) => {
    addWater(day, ml)
    if (ml > 0) {
      sfx.water()
      // Bateu a meta → marca a missão da água sozinha
      if (!missions[2] && waterMl + ml >= WATER_GOAL) toggleMission(day, 2)
    }
  }

  const saveQuickWeight = () => {
    const v = Number(String(quickWeight).replace(',', '.'))
    if (!(v > 20 && v < 300)) return
    logBody(day, { weight: v })
    sfx.success()
    setQuickWeight('')
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const firstName = (user.name || 'Miguel').split(' ')[0]
  const initials = user.initials || firstName.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-4">
      <Celebration fire={celebrate} />
      <DayNav p={p} />

      {/* ÚLTIMOS 7 DIAS */}
      <div className="stagger-1 rounded-2xl border bg-white dark:bg-[#1E293B] px-4 py-3">
        <div className="flex justify-between items-center">
          {Array.from({ length: 7 }, (_, k) => p.displayDay - 6 + k).map((d) => {
            const valid = d >= 1 && d <= p.currentDay
            const wknd = valid && isWeekendDay(p.startDate, d)
            const doneD = valid && !wknd && isDayComplete(p.days, d)
            const isToday = d === p.displayDay
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-bold ${isToday ? 'text-orange-500' : 'opacity-50'}`}>{d > 0 ? `D${d}` : '·'}</span>
                <span className={`w-3.5 h-3.5 rounded-full ${!valid ? 'bg-slate-200 dark:bg-slate-800' : wknd ? 'bg-sky-300 dark:bg-sky-900' : doneD ? 'bg-emerald-500' : isToday ? 'bg-orange-500 animate-pulse' : 'bg-red-400/70'} ${isToday ? 'ring-2 ring-orange-300' : ''}`} />
              </div>
            )
          })}
        </div>
      </div>

      {/* STATUS + STREAK */}
      <div className="stagger-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />PWA offline ✓
        </span>
        <span className="flex items-center gap-2">
          <span className="flame-badge flex items-center gap-1 rounded-xl border border-orange-500/50 bg-gradient-to-r from-orange-950/90 to-amber-950/90 px-2.5 py-1 text-xs font-black text-orange-200"><Icon name="flame" size={14} /> {p.streak}d</span>
          <span className="w-8 h-8 rounded-full bg-slate-800 border-2 border-orange-500/80 flex items-center justify-center font-bold text-[11px] text-white">{initials}</span>
        </span>
      </div>

      {/* BANNER DO DIA */}
      <section className="stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#131D2E] border border-slate-800 p-4 shadow-xl">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase rounded-md tracking-wider">● Jornada oficial</span>
          <span className="text-[11px] text-slate-400 font-medium">{block.name}: {block.sub}</span>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-white">DIA <span className="text-4xl font-black text-orange-500">{day}</span> <span className="text-sm font-medium text-slate-400">/ 133</span></p>
            <p className="text-xs text-slate-400 mt-0.5">{firstName} • {user.weight}kg • faltam {133 - day} dias</p>
          </div>
          <div className="text-right rounded-xl bg-orange-500/10 border border-orange-500/25 p-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Nível {p.level}</p>
            <p className="text-xs font-black text-white leading-tight">{p.levelName}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[['flame', `${p.streak}d`, 'streak'], ['zap', `${p.xp} XP`, 'xp total'], ['target', `${p.dietRate}%`, 'dieta']].map(([i, v, l]) => (
            <div key={l} className="rounded-2xl bg-slate-800/70 border border-slate-700/60 p-2.5 text-center">
              <div className="flex justify-center text-orange-400"><Icon name={i} size={19} /></div>
              <div className="font-black text-sm mt-0.5">{v}</div>
              <div className="text-[10px] text-slate-400 uppercase">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
            <span>Progresso de XP</span>
            <span className="text-orange-400 font-semibold">{p.xp.toLocaleString('pt-BR')} / {p.nextCut.toLocaleString('pt-BR')} XP</span>
          </div>
          <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
            <div className="h-full xp-shimmer rounded-full" style={{ width: `${Math.round(p.levelProgress * 100)}%` }} />
          </div>
        </div>
      </section>

      {/* PRÓXIMO PASSO */}
      <section className="stagger-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-xl shadow-orange-600/30 active:scale-[0.99]">
        <div className="card-shine" />
        <span className="text-[11px] font-extrabold uppercase bg-black/25 w-fit px-2.5 py-0.5 rounded-full">Próximo passo • {pct}% do dia</span>
        <h2 className="text-lg font-black leading-tight mt-1.5">{isWeekend ? `Descanso — próximo: ${plan.name} (SEG)` : `Treino de hoje: ${plan.name}`}</h2>
        <p className="text-xs text-orange-100/90 mt-1 font-medium">~{estMin} min • {blockSets} séries + cardio {cardioTotal} min • {focusForWeek(week)}</p>
        <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
          <button onClick={() => { setTrainKey(trainKey); setTab('treino') }} className="min-h-[52px] rounded-xl bg-white text-orange-600 font-black text-sm active:scale-95 flex items-center justify-center gap-1.5"><Icon name="play" size={14} /> Iniciar treino</button>
          <button onClick={() => setTab('comida')} className="min-h-[52px] rounded-xl bg-black/20 border border-white/20 font-bold text-sm active:scale-95">+ Refeição</button>
        </div>
      </section>

      {/* MISSÕES DIÁRIAS */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle icon="check">Missões diárias</SectionTitle>
          <div className="text-right">
            <span className="text-xs font-black text-emerald-500">{done}/{MISSIONS_TEMPLATE.length}</span>
            <span className="text-[10px] text-slate-400 block font-medium">{pct}% concluído</span>
          </div>
        </div>
        <Bar value={pct} className="mb-3 text-emerald-500" />
        <div className="space-y-2.5">
          {MISSIONS_TEMPLATE.map((m) => {
            const on = !!missions[m.id]
            // Missão da água vira o rastreador de água (igual ao modelo)
            if (m.id === 2) {
              return (
                <div key={m.id} className={`relative p-3 rounded-xl border overflow-hidden ${on || waterDone ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300' : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0"><Icon name="drop" size={18} /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">Beber {(WATER_GOAL / 1000).toFixed(1)}L de água</span>
                        <span className="block text-xs opacity-70 font-medium">{(waterMl / 1000).toFixed(2)}L de {(WATER_GOAL / 1000).toFixed(1)}L • +{m.xp} XP</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => onAddWater(-250)} aria-label="Remover 250ml" className="min-w-[44px] min-h-[44px] rounded-lg border font-black opacity-60 active:scale-95">−</button>
                      <button onClick={() => onAddWater(250)} className="min-h-[44px] px-3 rounded-lg bg-blue-500/20 text-blue-500 border border-blue-500/40 text-xs font-black active:scale-95">+250ml</button>
                      <button onClick={() => onToggleMission(2)} aria-label="Marcar missão da água" className={`w-8 h-8 rounded-lg flex items-center justify-center border font-black active:scale-95 ${on ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-800'}`}>{on ? '✓' : ''}</button>
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800">
                    <div className="h-full bg-blue-400 transition-all" style={{ width: `${waterPct}%` }} />
                  </div>
                </div>
              )
            }
            return (
              <QuestRow key={m.id} icon={ICONS[m.icon]} title={m.title}
                sub={`+${m.xp ?? 10} XP • ${m.desc}`} done={on}
                onToggle={() => onToggleMission(m.id)} />
            )
          })}
        </div>
      </Card>

      {/* BALANÇO CALÓRICO */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle icon="chart">Balanço calórico</SectionTitle>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${remain >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
            {remain >= 0 ? `Em déficit (−${remain})` : `Acima (+${-remain})`}
          </span>
        </div>
        <div className="flex items-center justify-center my-1">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="transparent" strokeWidth="8.5" className="stroke-slate-200 dark:stroke-slate-800" />
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="url(#calGrad)" strokeWidth="8.5" strokeLinecap="round"
                className="gauge-arc" strokeDasharray={GAUGE_C} strokeDashoffset={GAUGE_C * (1 - gaugeFill)} />
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" /><stop offset="50%" stopColor="#F97316" /><stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{remain >= 0 ? 'Restantes' : 'Acima'}</span>
              <span className="text-3xl font-black leading-none">{Math.abs(remain)}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1">de {targets.kcal} kcal</span>
            </div>
          </div>
        </div>
        <div className="space-y-2.5 mt-1 pt-2 border-t border-slate-200 dark:border-slate-800">
          {[
            ['Proteína', Math.round(totals.pr), targets.protein, 'bg-orange-500', 'text-orange-500'],
            ['Carboidratos', Math.round(totals.c), targets.carbs, 'bg-amber-500', 'text-amber-500'],
            ['Gorduras', Math.round(totals.f), targets.fat, 'bg-blue-500', 'text-blue-500'],
          ].map(([label, v, t, bar, tx]) => (
            <div key={label}>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>{label}</span>
                <span className={`font-bold ${tx}`}>{v}g <span className="text-slate-500 font-medium">/ {t}g ({Math.min(999, Math.round((v / t) * 100))}%)</span></span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full macro-fill ${bar}`} style={{ width: `${Math.min(100, (v / t) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setTab('comida')} className="mt-3 w-full min-h-[48px] rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-sm active:scale-95 flex items-center justify-center gap-2"><Icon name="food" size={16} /> Lançar comida do dia {day}</button>
      </Card>

      {/* PESAGEM RÁPIDA */}
      <Card>
        <div className="flex justify-between items-center">
          <SectionTitle icon="scale">Pesagem de hoje</SectionTitle>
          {dayLog.weight && <span className="text-xs font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">{dayLog.weight}kg ✓</span>}
        </div>
        {savedFlash && <p className="text-xs font-bold text-emerald-500 mt-1">Peso salvo!</p>}
        <div className="flex gap-2 mt-2">
          <input type="number" step="0.1" inputMode="decimal" value={quickWeight} onChange={(e) => setQuickWeight(e.target.value)} placeholder={`${user.weight} kg`}
            className="flex-1 min-h-[52px] px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border font-black text-lg text-center" />
          <Btn variant="success" onClick={saveQuickWeight} disabled={!(Number(String(quickWeight).replace(',', '.')) > 0)} className="px-5">Salvar</Btn>
          <Btn variant="ghost" onClick={() => setTab('progresso')} className="px-4">Medidas</Btn>
        </div>
        <p className="text-[11px] opacity-50 mt-1">Pese-se em jejum, após o banheiro. Medidas completas na aba Evolução.</p>
      </Card>
    </div>
  )
}
