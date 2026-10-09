import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking, isDayComplete, isWeekendDay } from '../hooks/useProgressTracking'
import { PROGRAM, MISSIONS_TEMPLATE, setsForBlock } from '../data/program'
import { blockForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { calcWaterGoal } from '../lib/tdee'
import { dayTotals, targetsFor } from '../lib/diet'
import { sfx } from '../lib/sound'

const AUTO_KEY = () => ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'

function goTab(tab) {
  useAppStore.getState().setTab(tab)
}

export default function Hoje() {
  const toggleMission = useAppStore((s) => s.toggleMission)
  const addWater = useAppStore((s) => s.addWater)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const setViewDay = useAppStore((s) => s.setViewDay)
  const user = useAppStore((s) => s.user)
  const days = useAppStore((s) => s.days)
  const mealLog = useAppStore((s) => s.mealLog)
  const p = useProgressTracking()
  const day = p.displayDay
  const mealLogDay = mealLog[day] ?? {}
  const missions = days[day]?.missions ?? {}
  const dayLog = days[day] ?? {}
  const waterMl = dayLog.waterMl ?? 0

  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  const WATER_GOAL = calcWaterGoal(user.weight)
  const done = MISSIONS_TEMPLATE.filter((m) => missions[m.id]).length
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)

  const targets = useMemo(() => targetsFor(user), [user])
  const totals = useMemo(() => dayTotals(mealLogDay), [mealLogDay])
  const eaten = Math.round(totals.k)
  const kcalPct = Math.min(100, Math.round((eaten / targets.kcal) * 100))

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
  const movPct = totalSets ? Math.round((doneSets.length / totalSets) * 100) : 0

  // Faixa de 7 dias do projeto (tocável, com status de cada dia)
  const weekWindow = useMemo(() => Array.from({ length: 7 }, (_, k) => day - 6 + k), [day])

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

  if (!ready) {
    return (
      <div className="flex flex-col gap-[18px]" aria-label="Carregando">
        <div className="animate-pulse rounded-[20px] bg-card h-40" />
        <div className="animate-pulse rounded-[20px] bg-card h-52" />
      </div>
    )
  }

  return (
    <>
      {/* Semana do projeto */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-[7px] px-[2px]">
          <p className="text-[12px] text-muted-foreground">
            Dia <b className="text-foreground tabular-nums">D{day}</b> de 133 · {block.name}
          </p>
          {p.isViewingPast ? (
            <button type="button" onClick={() => setViewDay(null)} className="min-h-[44px] px-2 text-[12px] text-primary font-semibold active:scale-95">
              Voltar p/ hoje
            </button>
          ) : (
            <span className="text-[12px] text-muted-foreground tabular-nums">{p.streak}d seguidos</span>
          )}
        </div>
        <div className="grid grid-cols-7 gap-[7px]" aria-label="Últimos 7 dias do projeto">
          {weekWindow.map((d) => {
            const valid = d >= 1 && d <= p.currentDay
            const wknd = valid && isWeekendDay(p.startDate, d)
            const doneD = valid && !wknd && isDayComplete(days, d)
            const isViewing = d === day
            const isToday = d === p.currentDay
            return (
              <button
                key={d}
                type="button"
                onClick={() => valid && setViewDay(d)}
                disabled={!valid}
                aria-label={`Ver dia ${d}`}
                className={`min-h-[56px] flex flex-col justify-center items-center gap-[5px] rounded-[10px] text-[15px] tabular-nums transition active:scale-95 disabled:opacity-30 ${
                  isViewing ? 'bg-primary text-primary-foreground font-semibold' : 'bg-card'
                } ${isToday && !isViewing ? 'ring-2 ring-primary' : ''}`}
              >
                <span className={`text-[10px] font-semibold ${isViewing ? '' : 'text-muted-foreground'}`}>
                  {d > 0 ? `D${d}` : '·'}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    !valid
                      ? 'bg-secondary'
                      : wknd
                        ? 'bg-sky-400'
                        : doneD
                          ? isViewing ? 'bg-primary-foreground' : 'bg-emerald-500'
                          : isViewing ? 'bg-primary-foreground/70' : 'bg-red-400/70'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Hero */}
      <article className="relative overflow-hidden rounded-[20px] min-h-[244px]">
        <img
          src="/imagens/treino-dia.jpg"
          alt="Atleta levantando barra na academia"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(16,22,17,.95), rgba(16,22,17,.21))' }}
          aria-hidden="true"
        />
        <div className="relative flex min-h-[244px] flex-col items-start p-[18px]">
          <span className="text-[10px] font-bold text-primary">SEU PRÓXIMO PASSO</span>
          <h2 className="my-[10px] text-[27px] leading-[1.15] font-bold">Hoje é dia de<br />ficar mais forte.</h2>
          <p className="text-[12px] tabular-nums" style={{ color: '#E7EBE2' }}>
            Treino {trainKey} · {plan.name} · {estMin} min · dia {day}/133
          </p>
          <button
            type="button"
            onClick={() => {
              setTrainKey(trainKey)
              goTab('treino')
            }}
            className="mt-auto w-full min-h-[48px] px-[18px] py-[14px] flex items-center justify-between gap-3 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold active:scale-[0.99]"
          >
            Começar meu treino <span className="text-[21px] leading-none" aria-hidden="true">▷</span>
          </button>
        </div>
      </article>

      {/* Metas */}
      <section aria-labelledby="titulo-metas">
        <div className="flex items-center justify-between gap-3 mb-[13px]">
          <h2 className="text-[18px]" id="titulo-metas">Um passo de cada vez</h2>
          <button type="button" onClick={() => goTab('progresso')} className="min-h-[44px] px-2 text-[12px] text-primary">Ver metas</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <article className="rounded-[20px] bg-card p-[16px]">
            <p className="text-[12px] text-muted-foreground">Alimentação</p>
            <p className="mt-[9px] mb-[2px] text-[25px] tabular-nums">{eaten.toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">/ {targets.kcal.toLocaleString('pt-BR')} kcal</p>
            <div className="h-[5px] mt-[9px] rounded-full bg-secondary overflow-hidden" aria-label={`${kcalPct}% da meta de alimentação`}>
              <span className="block h-full bg-primary rounded-full" style={{ width: `${kcalPct}%` }} />
            </div>
          </article>
          <article className="rounded-[20px] bg-card p-[16px]">
            <p className="text-[12px] text-muted-foreground">Movimento</p>
            <p className="mt-[9px] mb-[2px] text-[25px] tabular-nums">{doneSets.length}<span className="text-[13px] text-muted-foreground">/{totalSets}</span></p>
            <p className="text-[11px] text-muted-foreground">séries do treino</p>
            <div className="h-[5px] mt-[9px] rounded-full bg-secondary overflow-hidden" aria-label={`${movPct}% do treino`}>
              <span className="block h-full bg-primary rounded-full" style={{ width: `${movPct}%` }} />
            </div>
          </article>
        </div>
      </section>

      {/* Água */}
      <article className="rounded-[20px] bg-card p-[16px] flex items-center gap-3">
        <span className="text-primary text-[24px]" aria-hidden="true">♧</span>
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold">Água também conta</h3>
          <p className="mt-[7px] text-[12px] text-muted-foreground tabular-nums">
            {(waterMl / 1000).toFixed(1)} de {(WATER_GOAL / 1000).toFixed(1)} L · mais um gole?
          </p>
          <div className="h-[5px] mt-2 rounded-full bg-secondary overflow-hidden">
            <span className="block h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.round((waterMl / WATER_GOAL) * 100))}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAddWater(250)}
          aria-label="Adicionar 250ml de água"
          className="w-11 h-11 rounded-full bg-accent text-primary text-[23px] leading-none active:scale-95"
        >
          +
        </button>
      </article>

      {/* Incentivo */}
      <article className="flex items-center gap-3 p-1">
        <span className="text-primary text-[24px]" aria-hidden="true">ϟ</span>
        <div>
          <h3 className="text-[14px] font-semibold tabular-nums">{p.streak} {p.streak === 1 ? 'dia cuidando' : 'dias cuidando'} de você.</h3>
          <p className="mt-[7px] text-[12px] text-muted-foreground">Consistência vale mais que perfeição.</p>
        </div>
      </article>

      {/* Rotina do dia (missões) — mesma linguagem visual */}
      <section aria-labelledby="titulo-rotina">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[18px]" id="titulo-rotina">Rotina de hoje</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">{done}/{MISSIONS_TEMPLATE.length}</span>
        </div>
        <div className="grid gap-2">
          {MISSIONS_TEMPLATE.filter((m) => m.id !== 2).map((m) => {
            const on = !!missions[m.id]
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggleMission(m.id)}
                className="flex items-center gap-[10px] min-h-[62px] p-[9px] rounded-2xl bg-card text-left active:scale-[0.99]"
              >
                <span className={`w-[44px] h-[44px] shrink-0 grid place-items-center rounded-lg font-bold ${on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                  {on ? '✓' : `+${m.xp ?? 10}`}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate">{m.title}</span>
                  <span className="block mt-[5px] text-[11px] text-muted-foreground truncate">{m.desc}</span>
                </span>
                <span className={`text-right whitespace-nowrap text-[14px] ${on ? 'text-primary' : 'text-muted-foreground'}`}>
                  {on ? '✓' : '○'}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
