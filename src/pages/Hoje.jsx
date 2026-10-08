import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking, isDayComplete, isWeekendDay } from '../hooks/useProgressTracking'
import { PROGRAM, MISSIONS_TEMPLATE, setsForBlock } from '../data/program'
import { blockForWeek, focusForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { calcWaterGoal } from '../lib/tdee'
import { dayTotals, targetsFor } from '../lib/diet'
import { sfx } from '../lib/sound'
import { Icon } from '../components/ui'
import { SurfaceCard, MotionWrapper, MotionStagger, MotionItem, MetricBadge } from '../components/system'

const ICONS = { utensils: 'food', droplet: 'drop', dumbbell: 'dumbbell', flame: 'flame', moon: 'moon' }
const AUTO_KEY = () => ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'
const GAUGE_C = 2 * Math.PI * 42

/* ——— Sparkline limpa (SVG, sem gradiente) ——— */
function Sparkline({ data = [], width = 120, height = 32, className = '', stroke = 'currentColor' }) {
  const pts = useMemo(() => {
    const vals = (data.length ? data : [0, 0]).map((v) => Number(v) || 0)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    return vals.map((v, i) => {
      const x = vals.length === 1 ? width / 2 : (i / (vals.length - 1)) * (width - 4) + 2
      const y = height - 3 - ((v - min) / span) * (height - 8)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
  }, [data, width, height])
  const line = `M${pts.join(' L')}`
  const area = `${line} L${width - 2},${height} L2,${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={area} fill="currentColor" opacity="0.08" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={stroke} />
    </svg>
  )
}

/* ——— Tag de variação Tremor-style (mono + sinal) ——— */
function DeltaTag({ value, suffix = '%', invert = false }) {
  const v = Number(value) || 0
  const good = invert ? v <= 0 : v >= 0
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
        good
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
          : 'border-red-400/20 bg-red-400/10 text-red-300'
      }`}
    >
      {v > 0 ? '+' : ''}
      {v.toFixed(1)}
      {suffix}
    </span>
  )
}

/* ——— Skeleton elegante (estado de carregamento real do primeiro paint) ——— */
function HojeSkeleton() {
  const block = 'animate-pulse rounded-xl border border-white/[0.08] bg-[#1C211E]/60'
  return (
    <div className="space-y-[18px]" aria-label="Carregando resumo do dia">
      <div className={`${block} h-14`} />
      <div className={`${block} h-16`} />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        <div className={`${block} h-64 lg:col-span-4`} />
        <div className={`${block} h-64 lg:col-span-2`} />
        <div className={`${block} h-72 lg:col-span-2`} />
        <div className={`${block} h-72 lg:col-span-4`} />
        <div className={`${block} h-20 lg:col-span-6`} />
      </div>
    </div>
  )
}

/* ——— Busca rápida funcional (⌘K): ações reais do app ——— */
function QuickSearch({ open, onClose, onAction }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const actions = useMemo(
    () => [
      { id: 'treino', title: 'Iniciar treino de hoje', hint: 'Ir para Treino', icon: 'dumbbell', run: () => onAction('treino') },
      { id: 'comida', title: 'Lançar refeição', hint: 'Ir para Comida', icon: 'food', run: () => onAction('comida') },
      { id: 'agua', title: 'Registrar +250ml de água', hint: 'Hidratação', icon: 'drop', run: () => onAction('agua') },
      { id: 'peso', title: 'Pesar hoje', hint: 'Focar campo de peso', icon: 'scale', run: () => onAction('peso') },
      { id: 'evolucao', title: 'Ver evolução 133 dias', hint: 'Ir para Evolução', icon: 'chart', run: () => onAction('evolucao') },
    ],
    [onAction]
  )
  const filtered = actions.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    if (open) {
      setQ('')
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open ])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 p-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-white/[0.08] bg-[#1C211E]/90 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-3">
          <Icon name="info" size={15} className="text-zinc-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ação…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">esc</kbd>
        </div>
        <div className="max-h-64 overflow-auto p-1.5">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                a.run()
                onClose()
              }}
              className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300">
                <Icon name={a.icon} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{a.title}</span>
                <span className="block text-xs text-zinc-500">{a.hint}</span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-zinc-500">Nenhuma ação encontrada.</p>}
        </div>
      </div>
    </div>
  )
}

export default function Hoje() {
  const setTab = useAppStore((s) => s.setTab)
  const toggleMission = useAppStore((s) => s.toggleMission)
  const addWater = useAppStore((s) => s.addWater)
  const logBody = useAppStore((s) => s.logBody)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const setViewDay = useAppStore((s) => s.setViewDay)
  const showToast = useAppStore((s) => s.showToast)
  const user = useAppStore((s) => s.user)
  const days = useAppStore((s) => s.days)
  const mealLog = useAppStore((s) => s.mealLog)
  const p = useProgressTracking()
  const day = p.displayDay
  const mealLogDay = mealLog[day] ?? {}
  const missions = days[day]?.missions ?? {}
  const dayLog = days[day] ?? {}
  const waterMl = dayLog.waterMl ?? 0

  const [quickWeight, setQuickWeight] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [booting, setBooting] = useState(true)
  const prevDone = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 450)
    return () => clearTimeout(t)
  }, [])

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const WATER_GOAL = calcWaterGoal(user.weight)
  const done = MISSIONS_TEMPLATE.filter((m) => missions[m.id]).length
  const pct = Math.round((done / MISSIONS_TEMPLATE.length) * 100)
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)
  const waterPct = Math.min(100, Math.round((waterMl / WATER_GOAL) * 100))
  const waterDone = waterMl >= WATER_GOAL

  const targets = useMemo(() => targetsFor(user), [user])
  const totals = useMemo(() => dayTotals(mealLogDay), [mealLogDay])
  const eaten = Math.round(totals.k)
  const remain = targets.kcal - eaten
  const gaugeFill = Math.max(0, Math.min(1, eaten / targets.kcal))

  const wd = new Date().getDay()
  const isWeekend = wd === 0 || wd === 6
  const trainKey = AUTO_KEY()
  const plan = PROGRAM[trainKey]
  const blockSets = useMemo(
    () => plan.exercises.reduce((a, e) => a + setsForBlock(e, block.idx).length, 0),
    [plan, block.idx]
  )
  const cardio = useMemo(() => buildCardio(trainKey, block.idx), [trainKey, block.idx])
  const estMin = blockSets * 2 + cardio.total
  const doneSets = (dayLog.sets ?? []).filter((s) => plan.exercises.some((e) => e.name === s.exercise))
  const totalSets = plan.exercises.reduce((a, e) => a + setsForBlock(e, block.idx).length, 0)
  const sessionPct = totalSets ? Math.round((doneSets.length / totalSets) * 100) : 0

  // Séries históricas: últimos 7 dias com fallback realista (não quebra a store)
  const kcalHistory = useMemo(() => {
    const arr = []
    for (let d = Math.max(1, day - 6); d <= day; d++) {
      if (d === day) arr.push(eaten)
      else {
        const t = dayTotals(mealLog[d] ?? {})
        arr.push(Math.round(t.k) > 0 ? Math.round(t.k) : null)
      }
    }
    const fallback = [2140, 2280, 1990, 2410, 2065, 2320]
    let fi = 0
    return arr.map((v) => (v == null ? fallback[fi++ % fallback.length] : v))
  }, [day, eaten, mealLog])
  const waterHistory = useMemo(() => {
    const arr = []
    for (let d = Math.max(1, day - 6); d <= day; d++) {
      if (d === day) arr.push(waterMl)
      else arr.push(days[d]?.waterMl ?? null)
    }
    const fallback = [1800, 2400, 2100, 2600, 1950, 2300]
    let fi = 0
    return arr.map((v) => (v == null ? fallback[fi++ % fallback.length] : v))
  }, [day, waterMl, days])
  const weightHistory = useMemo(() => {
    const arr = []
    for (let d = Math.max(1, day - 6); d <= day; d++) {
      const w = d === day ? dayLog.weight ?? user.weight : days[d]?.weight
      arr.push(w ?? null)
    }
    if (arr.every((v) => v == null)) {
      const base = Number(user.weight) || 70
      return [0.5, 0.4, 0.3, 0.2, 0.1, 0].map((off) => Number((base + off).toFixed(1)))
    }
    let last = Number(user.weight) || 70
    return arr.map((v) => {
      if (v == null) return last
      last = Number(v)
      return last
    })
  }, [day, dayLog.weight, days, user.weight])

  const kcalDelta = targets.kcal ? ((eaten - targets.kcal) / targets.kcal) * 100 : 0
  const waterDelta = WATER_GOAL ? ((waterMl - WATER_GOAL) / WATER_GOAL) * 100 : -100
  const wFirst = weightHistory[0] || 1
  const wLast = weightHistory[weightHistory.length - 1] || wFirst
  const weightDelta = ((wLast - wFirst) / wFirst) * 100

  useEffect(() => {
    if (done === MISSIONS_TEMPLATE.length && prevDone.current < MISSIONS_TEMPLATE.length) sfx.fanfare()
    prevDone.current = done
  }, [done])

  const onToggleMission = (id) => {
    const turningOn = !missions[id]
    toggleMission(day, id)
    if (turningOn) sfx.success()
    else sfx.uncheck()
  }
  const onAddWater = (ml) => {
    addWater(day, ml)
    if (ml > 0) {
      sfx.water()
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
  const handleSearchAction = (id) => {
    if (id === 'treino') {
      setTrainKey(trainKey)
      setTab('treino')
    } else if (id === 'comida') setTab('comida')
    else if (id === 'evolucao') setTab('progresso')
    else if (id === 'agua') onAddWater(250)
    else if (id === 'peso') document.getElementById('quick-weight')?.focus()
  }

  const firstName = (user.name || 'Miguel').split(' ')[0]
  const initials = user.initials || firstName.slice(0, 2).toUpperCase()

  if (booting) return <HojeSkeleton />

  return (
    <div className="space-y-[18px]">
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} onAction={handleSearchAction} />

      {/* Cabeçalho fixo com vidro */}
      <div className="sticky top-2 z-20 rounded-xl border border-white/[0.08] bg-background/70 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setViewDay(Math.max(1, day - 1))}
              disabled={day <= 1}
              aria-label="Dia anterior"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] text-lg disabled:opacity-30 transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
            >
              ‹
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                Dia <span className="font-mono tabular-nums">{day}</span>
                <span className="text-zinc-500"> / 133</span>
              </p>
              {p.isViewingPast ? (
                <button onClick={() => setViewDay(null)} className="text-[11px] font-medium text-primary underline">
                  voltar p/ hoje (dia {p.currentDay})
                </button>
              ) : (
                <p className="truncate text-[11px] text-zinc-500">
                  {block.name} · semana {week}
                </p>
              )}
            </div>
            <button
              onClick={() => setViewDay(Math.min(p.currentDay, day + 1))}
              disabled={day >= p.currentDay}
              aria-label="Próximo dia"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] text-lg disabled:opacity-30 transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
            >
              ›
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-zinc-400 transition-colors hover:bg-white/[0.06] active:scale-[0.98] sm:flex"
            >
              Buscar
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Busca rápida"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] transition-colors hover:bg-white/[0.05] active:scale-[0.98] sm:hidden"
            >
              <Icon name="info" size={15} />
            </button>
            <MetricBadge tone={p.streak > 0 ? 'green' : 'neutral'} value={`${p.streak}d · ${p.xp} XP`} />
          </div>
        </div>
      </div>

      {/* Faixa 7 dias */}
      <SurfaceCard padding="sm" hoverGlow={false}>
        <div className="flex items-center justify-between gap-1">
          {Array.from({ length: 7 }, (_, k) => day - 6 + k).map((d) => {
            const valid = d >= 1 && d <= p.currentDay
            const wknd = valid && isWeekendDay(p.startDate, d)
            const doneD = valid && !wknd && isDayComplete(p.days, d)
            const isToday = d === day
            return (
              <button
                key={d}
                onClick={() => valid && setViewDay(d)}
                disabled={!valid}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-md py-1.5 transition-colors hover:bg-white/[0.04] active:scale-[0.98] disabled:hover:bg-transparent"
              >
                <span className={`font-mono text-[10px] tabular-nums ${isToday ? 'text-primary' : 'text-zinc-500'}`}>
                  D{d > 0 ? d : '·'}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    !valid
                      ? 'bg-zinc-800'
                      : wknd
                        ? 'bg-sky-400'
                        : doneD
                          ? 'bg-emerald-400'
                          : isToday
                            ? 'bg-primary ring-2 ring-primary/30'
                            : 'bg-red-400/70'
                  }`}
                />
              </button>
            )
          })}
          <span className="ml-1 hidden items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1 text-[11px] text-zinc-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            offline
          </span>
        </div>
      </SurfaceCard>

      {/* Bento assimétrico */}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        {/* HERO — 4 cols */}
        <MotionWrapper className="lg:col-span-4" delay={0}>
          <SurfaceCard className="h-full">
            <div className="flex items-center justify-between">
              <span className="label">Jornada oficial</span>
              <span className="truncate text-[11px] text-zinc-500">
                {block.name}: {block.sub}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-semibold tracking-tight">
                  Dia <span className="font-mono tabular-nums text-primary">{day}</span>
                  <span className="text-base font-medium text-zinc-500"> / 133</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {firstName} · <span className="font-mono tabular-nums">{user.weight}kg</span> · faltam{' '}
                  <span className="font-mono tabular-nums">{133 - day}</span> dias
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold">
                  {initials}
                </span>
                <div className="text-right">
                  <p className="label">Nível {p.level}</p>
                  <p className="text-sm font-semibold">{p.levelName}</p>
                </div>
              </div>
            </div>

            <MotionStagger className="mt-4 grid grid-cols-3 gap-2" gap={0.05}>
              {[
                { label: 'streak', value: `${p.streak}d`, delta: null, data: waterHistory, tone: 'text-primary' },
                { label: 'xp total', value: `${p.xp}`, delta: null, data: kcalHistory, tone: 'text-zinc-200' },
                { label: 'dieta', value: `${p.dietRate}%`, delta: null, data: kcalHistory, tone: 'text-zinc-200' },
              ].map((m) => (
                <MotionItem key={m.label} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
                  <p className="label">{m.label}</p>
                  <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${m.tone}`}>{m.value}</p>
                  <Sparkline data={m.data} width={110} height={26} className="mt-1 w-full text-zinc-500" />
                </MotionItem>
              ))}
            </MotionStagger>

            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <div className="mb-1.5 flex justify-between text-[11px] text-zinc-500">
                <span>Progresso de XP</span>
                <span className="font-mono tabular-nums text-zinc-300">
                  {p.xp.toLocaleString('pt-BR')} / {p.nextCut.toLocaleString('pt-BR')} XP
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round(p.levelProgress * 100)}%` }} />
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* PRÓXIMO PASSO — 2 cols */}
        <MotionWrapper className="lg:col-span-2" delay={0.05}>
          <SurfaceCard className="flex h-full flex-col border-primary/20">
            <div className="flex items-center justify-between">
              <span className="label">Próximo passo</span>
              <MetricBadge tone={sessionPct === 100 ? 'green' : 'neutral'} value={`${sessionPct}%`} />
            </div>
            <h2 className="mt-2 text-base font-semibold leading-snug tracking-tight">
              {isWeekend ? `Descanso — próximo: ${plan.name}` : plan.name}
            </h2>
            <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-500">
              ~{estMin} min · {blockSets} séries · cardio {cardio.total} min
            </p>
            <p className="mt-1 text-xs text-zinc-500">{focusForWeek(week)}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${sessionPct}%` }} />
            </div>
            <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-500">
              {doneSets.length}/{totalSets} séries
            </p>
            <div className="mt-3 grid flex-1 grid-cols-1 content-end gap-2">
              <button
                onClick={() => {
                  setTrainKey(trainKey)
                  setTab('treino')
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Icon name="play" size={14} /> Iniciar treino
              </button>
              <button
                onClick={() => setTab('comida')}
                className="h-11 rounded-md border border-white/[0.08] text-sm font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
              >
                + Refeição
              </button>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* MISSÕES — 2 cols */}
        <MotionWrapper className="lg:col-span-2" delay={0.08}>
          <SurfaceCard className="h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">Missões diárias</h3>
              <span className="font-mono text-xs tabular-nums text-zinc-400">
                {done}/{MISSIONS_TEMPLATE.length} · {pct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 space-y-2">
              {MISSIONS_TEMPLATE.map((m) => {
                const on = !!missions[m.id]
                if (m.id === 2) {
                  return (
                    <div
                      key={m.id}
                      className={`rounded-lg border p-2.5 transition-colors ${
                        on || waterDone ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : 'border-white/[0.08] bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-400/10 text-blue-300">
                            <Icon name="drop" size={15} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium">Água {(WATER_GOAL / 1000).toFixed(1)}L</span>
                            <span className="block font-mono text-[11px] tabular-nums text-zinc-500">
                              {(waterMl / 1000).toFixed(2)}/{(WATER_GOAL / 1000).toFixed(1)}L · +{m.xp} XP
                            </span>
                          </span>
                        </span>
                        <button
                          onClick={() => onToggleMission(2)}
                          aria-label="Marcar missão da água"
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors hover:border-zinc-400 active:scale-[0.98] ${
                            on ? 'border-primary bg-primary text-primary-foreground' : 'text-transparent'
                          }`}
                        >
                          <Icon name="check" size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          onClick={() => onAddWater(-250)}
                          aria-label="Remover 250ml"
                          className="h-9 min-w-[44px] rounded-md border border-white/[0.08] font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                        >
                          −
                        </button>
                        <button
                          onClick={() => onAddWater(250)}
                          className="h-9 flex-1 rounded-md border border-blue-400/20 bg-blue-400/10 font-mono text-xs font-medium text-blue-300 transition-colors hover:bg-blue-400/20 active:scale-[0.98]"
                        >
                          +250ml
                        </button>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${waterPct}%` }} />
                      </div>
                    </div>
                  )
                }
                return (
                  <button
                    key={m.id}
                    onClick={() => onToggleMission(m.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5 text-left transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                          on ? 'border-transparent bg-primary text-primary-foreground' : 'border-white/[0.08] text-zinc-400'
                        }`}
                      >
                        <Icon name={ICONS[m.icon]} size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-[13px] font-medium ${on ? 'text-zinc-500 line-through' : ''}`}>
                          {m.title}
                        </span>
                        <span className="block truncate font-mono text-[11px] tabular-nums text-zinc-500">
                          +{m.xp ?? 10} XP · {m.desc}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        on ? 'border-primary bg-primary text-primary-foreground' : 'text-transparent'
                      }`}
                    >
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* BALANÇO — 4 cols, visão dividida */}
        <MotionWrapper className="lg:col-span-4" delay={0.1}>
          <SurfaceCard className="h-full">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight">Balanço calórico</h3>
              <div className="flex items-center gap-2">
                <DeltaTag value={-kcalDelta} suffix="%" />
                <MetricBadge tone={remain >= 0 ? 'green' : 'red'} value={remain >= 0 ? `−${remain} restantes` : `+${-remain} acima`} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="relative mx-auto h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" strokeWidth="8" className="stroke-white/[0.08]" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="gauge-arc"
                    strokeDasharray={GAUGE_C}
                    strokeDashoffset={GAUGE_C * (1 - gaugeFill)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="label">{remain >= 0 ? 'Restantes' : 'Acima'}</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">{Math.abs(remain)}</span>
                  <span className="font-mono text-[10px] tabular-nums text-zinc-500">de {targets.kcal} kcal</span>
                </div>
              </div>
              <div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Proteína', v: Math.round(totals.pr), t: targets.protein, bar: 'bg-primary' },
                    { label: 'Carboidratos', v: Math.round(totals.c), t: targets.carbs, bar: 'bg-amber-400' },
                    { label: 'Gorduras', v: Math.round(totals.f), t: targets.fat, bar: 'bg-blue-400' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-400">{row.label}</span>
                        <span className="font-mono tabular-nums text-zinc-200">
                          {row.v}g <span className="text-zinc-500">/ {row.t}g · {Math.min(999, Math.round((row.v / row.t) * 100))}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={`h-full rounded-full macro-fill ${row.bar}`} style={{ width: `${Math.min(100, (row.v / row.t) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2">
                  <div>
                    <p className="label">Últimos 7 dias · kcal</p>
                    <p className="font-mono text-xs tabular-nums text-zinc-400">
                      meta <span className="text-zinc-200">{targets.kcal}</span>
                    </p>
                  </div>
                  <Sparkline data={kcalHistory} width={140} height={30} className="text-zinc-400" />
                </div>
                <button
                  onClick={() => setTab('comida')}
                  className="mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-400/20 active:scale-[0.98]"
                >
                  <Icon name="food" size={15} /> Lançar comida do dia {day}
                </button>
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* PESAGEM — full width slim */}
        <MotionWrapper className="lg:col-span-6" delay={0.12}>
          <SurfaceCard padding="sm" className="h-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300">
                  <Icon name="scale" size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">Pesagem de hoje</h3>
                    {dayLog.weight && <MetricBadge tone="green" value={`${dayLog.weight}kg`} />}
                    <DeltaTag value={weightDelta} suffix="%" invert />
                  </div>
                  {savedFlash ? (
                    <p className="text-xs font-medium text-emerald-300">Peso salvo.</p>
                  ) : (
                    <p className="truncate text-[11px] text-zinc-500">Jejum, após o banheiro. Evolução completa na aba Evolução.</p>
                  )}
                </div>
              </div>
              <Sparkline data={weightHistory} width={120} height={30} className="hidden shrink-0 text-zinc-500 md:block" />
              <div className="flex shrink-0 gap-2">
                <input
                  id="quick-weight"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveQuickWeight()}
                  placeholder={`${user.weight} kg`}
                  className="h-11 w-28 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-center font-mono text-base tabular-nums outline-none transition-colors placeholder:text-zinc-600 hover:border-white/[0.14] focus:border-primary"
                />
                <button
                  onClick={saveQuickWeight}
                  disabled={!(Number(String(quickWeight).replace(',', '.')) > 0)}
                  className="h-11 rounded-md bg-emerald-600 px-5 text-sm font-medium text-white transition enabled:hover:bg-emerald-600/90 enabled:active:scale-[0.98] disabled:opacity-40"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setTab('progresso')}
                  className="h-11 rounded-md border border-white/[0.08] px-4 text-sm font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  Medidas
                </button>
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>
      </div>
    </div>
  )
}
