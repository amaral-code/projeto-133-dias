import { useEffect, useMemo, useState } from 'react'
import { PROGRAM, setsForBlock } from '../data/program'
import { blockForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { progressionPlan, lastSessionFor } from '../lib/doubleProgression'
import { sessionVolume, formatKg } from '../lib/metrics'
import { sfx } from '../lib/sound'

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function muscleImg(muscle = '') {
  const m = String(muscle).toLowerCase()
  if (/peito/.test(m)) return '/imagens/peito.jpg'
  if (/dorsal|costas/.test(m)) return '/imagens/costas.jpg'
  if (/quadr[ií]ceps|gl[uú]teo|posterior|panturrilha/.test(m)) return '/imagens/pernas.jpg'
  if (/ombro/.test(m)) return '/imagens/ombros.jpg'
  if (/b[ií]ceps|tr[ií]ceps|braquial|antebra[çc]o|pegada|trap[eé]zio/.test(m)) return '/imagens/bracos.jpg'
  return '/imagens/treino-dia.jpg'
}

function Stepper({ value, onChange, step = 1, ariaLabel = 'Ajustar' }) {
  const num = Number(value) || 0
  const safe = (v) => { const n = Number(v); return Number.isFinite(n) ? Number(n.toFixed(2)) : 0 }
  return (
    <div className="flex h-12 items-center rounded-[10px] bg-secondary">
      <button
        type="button"
        onClick={() => onChange(safe(num - step))}
        aria-label={`Diminuir ${ariaLabel}`}
        className="flex h-full w-11 shrink-0 items-center justify-center text-xl active:scale-95"
      >
        −
      </button>
      <input
        type="number"
        step={step}
        inputMode="decimal"
        value={value ?? ''}
        placeholder="0"
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value === '' ? '' : safe(e.target.value))}
        className="h-full w-full min-w-0 bg-transparent text-center text-[15px] font-semibold tabular-nums outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(safe(num + step))}
        aria-label={`Aumentar ${ariaLabel}`}
        className="flex h-full w-11 shrink-0 items-center justify-center text-xl active:scale-95"
      >
        +
      </button>
    </div>
  )
}

function SetRow({ ex, s, prev, day, defaultLoad, timer }) {
  const logSet = useAppStore((st) => st.logSet)
  const removeSet = useAppStore((st) => st.removeSet)
  const setLoad = useAppStore((st) => st.setLoad)
  const showToast = useAppStore((st) => st.showToast)
  const daySets = useAppStore((st) => st.days[day]?.sets ?? [])
  const it = daySets.find((x) => x.exercise === ex.name && x.setNumber === s.setNumber)

  const [reps, setReps] = useState(s.repsTarget[1])
  const load = defaultLoad
  const step = /barra|leg press|hip thrust|agachamento|stiff/i.test(`${ex.name} ${ex.type}`) ? 2.5 : 1

  const complete = () => {
    const repsDone = Math.max(0, Number(reps) || 0)
    logSet(day, { exercise: ex.name, setNumber: s.setNumber, load: Number(load) || 0, repsDone, repsTop: s.repsTarget[1] })
    sfx.success()
    showToast(`Série ${s.setNumber} salva · descanso ${mmss(s.restSeconds ?? 60)}`)
    timer.start(s.restSeconds ?? 60, `Descanso — ${ex.name}`)
  }

  return (
    <div className={`rounded-2xl p-3 ${it ? 'bg-accent' : 'bg-secondary/50'}`}>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-[13px] font-bold tabular-nums">S{s.setNumber}</span>
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Carga (kg)</p>
              <Stepper value={load} onChange={(v) => setLoad(`${ex.name}#${s.setNumber}`, v)} step={step} ariaLabel={`Carga série ${s.setNumber}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Reps</p>
              <Stepper value={reps} onChange={setReps} step={1} ariaLabel={`Reps série ${s.setNumber}`} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
            Meta {s.repsTarget[0]}–{s.repsTarget[1]} · desc. {mmss(s.restSeconds ?? 60)} · antes: {prev}
            {it ? ` · feito ${it.repsDone} @ ${it.load}kg` : ''}
          </p>
        </div>
        {it ? (
          <button
            type="button"
            onClick={() => {
              removeSet(day, ex.name, s.setNumber)
              sfx.uncheck()
            }}
            title="Desmarcar série"
            aria-label={`Desmarcar série ${s.setNumber}`}
            className="h-12 w-12 shrink-0 rounded-[10px] bg-primary text-primary-foreground text-lg font-bold active:scale-95"
          >
            ✓
          </button>
        ) : (
          <button
            type="button"
            onClick={complete}
            title="Concluir série"
            aria-label={`Concluir série ${s.setNumber}`}
            className="h-12 w-12 shrink-0 rounded-[10px] bg-primary text-primary-foreground text-lg font-bold active:scale-95"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  )
}

export default function Treino({ timer }) {
  const fallbackTimer = useWorkoutTimer()
  const t = timer ?? fallbackTimer
  const p = useProgressTracking()
  const day = p.displayDay
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)
  const setWorkoutDone = useAppStore((s) => s.setWorkoutDone)
  const setCardioDone = useAppStore((s) => s.setCardioDone)
  const cardioDone = useAppStore((s) => !!s.days[day]?.cardioDone)
  const setLoad = useAppStore((s) => s.setLoad)
  const loads = useAppStore((s) => s.loads)
  const showToast = useAppStore((s) => s.showToast)
  const dayLog = useAppStore((s) => s.days[day] ?? {})
  const days = useAppStore((s) => s.days)
  const allSets = useMemo(() => Object.values(days ?? {}).flatMap((d) => (Array.isArray(d?.sets) ? d.sets : [])), [days])

  const [openEx, setOpenEx] = useState({})
  const [cardioOpen, setCardioOpen] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(id)
  }, [])

  const storedKey = useAppStore((s) => s.trainKey)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const autoKey = ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'
  const dayKey = PROGRAM[storedKey] ? storedKey : autoKey
  const plan = PROGRAM[dayKey] ?? PROGRAM.SEG
  const done = !!dayLog.workoutDone

  const planSets = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) out[ex.id] = setsForBlock(ex, block.idx)
    return out
  }, [plan, block.idx])

  const doneSets = (dayLog.sets ?? []).filter((s) => plan.exercises.some((e) => e.name === s.exercise))
  const totalSets = Object.values(planSets).reduce((a, arr) => a + arr.length, 0)
  const volume = sessionVolume(dayLog.sets ?? [])
  const cardioInfo = useMemo(() => buildCardio(dayKey, block.idx), [dayKey, block.idx])

  const effectiveLoad = (ex, s) => {
    const perSet = loads[`${ex.name}#${s.setNumber}`]
    if (perSet != null && perSet !== '' && Number.isFinite(Number(perSet))) return perSet
    if (loads[ex.name] != null && loads[ex.name] !== '' && Number.isFinite(Number(loads[ex.name]))) return loads[ex.name]
    const plan = progressionPlan(allSets.filter((x) => x.day !== day), {
      exerciseName: ex.name,
      exerciseType: ex.type,
      baseLoad: 0,
    })
    if (plan.suggested > 0) return plan.suggested
    return ''
  }

  const suggestions = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) {
      out[ex.id] = progressionPlan(allSets.filter((x) => x.day !== day), {
        exerciseName: ex.name,
        exerciseType: ex.type,
        baseLoad: 0,
      })
    }
    return out
  }, [plan, allSets, day])

  const prevMap = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) {
      const last = lastSessionFor(allSets.filter((x) => x.day !== day), ex.name)
      const m = {}
      for (const s of last ?? []) m[s.setNumber] = `${s.load}kg × ${s.repsDone}`
      out[ex.id] = m
    }
    return out
  }, [plan, allSets, day])

  const logged = (exName, n) => (dayLog.sets ?? []).find((x) => x.exercise === exName && x.setNumber === n)

  if (!ready) {
    return (
      <div className="flex flex-col gap-[18px]" aria-label="Carregando treino">
        <div className="animate-pulse rounded-[20px] bg-card h-32" />
        <div className="animate-pulse rounded-[20px] bg-card h-64" />
      </div>
    )
  }

  return (
    <>
      {/* Abas da divisão */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar" aria-label="Divisão de treinos">
        {Object.values(PROGRAM).map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setTrainKey(d.key)}
            className={`flex-1 min-w-[86px] min-h-[44px] px-2 rounded-[10px] text-[11px] font-semibold text-center active:scale-95 ${
              dayKey === d.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            }`}
          >
            {d.key} · {d.label}
          </button>
        ))}
      </div>

      {/* Plano */}
      <article className="rounded-[20px] bg-accent p-[16px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[20px]">{plan.name}</h2>
          <span className="text-primary text-[24px]" aria-hidden="true">⚒</span>
        </div>
        <p className="mt-[2px] text-[12px] text-muted-foreground">{plan.sub}</p>
        <div className="flex gap-[17px] mt-[13px] text-[12px] tabular-nums">
          <span className="text-primary font-semibold">~{Object.values(planSets).reduce((a, b) => a + b.length, 0) * 2 + cardioInfo.total} min</span>
          <span className="text-muted-foreground">{plan.exercises.length} exercícios</span>
          <span className="text-muted-foreground">{block.name}</span>
        </div>
        <div className="h-[5px] mt-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.12)' }}>
          <span className="block h-full bg-primary rounded-full" style={{ width: `${totalSets ? Math.round((doneSets.length / totalSets) * 100) : 0}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
          {doneSets.length}/{totalSets} séries · {formatKg(volume)} · dia {day}
        </p>
      </article>

      {/* Aquecimento */}
      <article className="flex items-center gap-[10px]">
        <span className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-[10px] bg-secondary text-primary" aria-hidden="true">◴</span>
        <div>
          <h3 className="text-[13px] font-semibold">Primeiro, aqueça por 5 minutos</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Mobilidade + caminhada leve</p>
        </div>
        <span className="ml-auto text-muted-foreground" aria-hidden="true">›</span>
      </article>

      {/* Exercícios */}
      <section aria-labelledby="titulo-exercicios">
        <div className="mb-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px]" id="titulo-exercicios">Exercícios de hoje</h2>
            <span className="text-[12px] text-primary tabular-nums">{doneSets.length}/{totalSets}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Toque para abrir as séries. Descanse 60–90 s entre elas.</p>
        </div>

        <div className="grid gap-2">
          {plan.exercises.map((ex, i) => {
            const sets = planSets[ex.id]
            const exDoneCount = sets.filter((s) => logged(ex.name, s.setNumber)).length
            const exDone = exDoneCount === sets.length
            const opened = openEx[ex.id] ?? (!exDone && i === 0)
            const sug = suggestions[ex.id]
            return (
              <article key={ex.id} className={`rounded-2xl bg-card overflow-hidden ${exDone ? 'opacity-90' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOpenEx({ ...openEx, [ex.id]: !opened })}
                  className="w-full flex items-center gap-[10px] min-h-[62px] p-[9px] text-left active:scale-[0.99]"
                  aria-expanded={opened}
                >
                  <span className="relative w-[44px] h-[44px] shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <img src={muscleImg(ex.muscle)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    {exDone && (
                      <span key={`done-${exDoneCount}`} className="check-pop absolute inset-0 grid place-items-center bg-black/55 text-[16px] font-bold text-primary" aria-hidden="true">✓</span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{i + 1}. {ex.name}</span>
                    <span className="block mt-[5px] text-[11px] text-muted-foreground truncate tabular-nums">
                      {ex.muscle} · {exDoneCount}/{sets.length} · {ex.reps.raw}
                    </span>
                  </span>
                  <span className="text-right whitespace-nowrap">
                    <strong className="block text-primary text-[14px] font-normal tabular-nums">{sets.length} × {ex.reps.raw}</strong>
                    <small className="block mt-1 text-muted-foreground text-[9px]">séries × reps</small>
                  </span>
                </button>
                {opened && (
                  <div className="px-[9px] pb-[9px] grid gap-2">
                    <div className="rounded-[10px] bg-accent p-2.5">
                      <p className="text-[12px] font-semibold tabular-nums">
                        {sug.hasHistory ? (
                          <>Última: <b className="text-primary">{sug.lastLoad}kg × {sug.lastRepsLabel}</b> <span className="text-muted-foreground font-normal">(dia {sug.lastDay})</span> → Hoje: <b className="text-primary">{sug.suggested}kg</b></>
                        ) : (
                          <>Primeira vez neste exercício — defina a carga base abaixo.</>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {sug.reason}{' '}
                        {sug.suggested > 0 && <>Se bater o teto hoje, semana que vem: <b className="text-primary tabular-nums">{sug.nextIfTop}kg</b> (+{sug.step}).</>}
                      </p>
                      {sug.suggested > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            for (const s of sets) setLoad(`${ex.name}#${s.setNumber}`, sug.suggested)
                            setLoad(ex.name, sug.suggested)
                            showToast(`Carga ${sug.suggested}kg aplicada em ${ex.name}`)
                          }}
                          className="mt-2 min-h-[44px] w-full rounded-[10px] bg-primary px-3 text-[12px] font-bold text-primary-foreground active:scale-95"
                        >
                          Usar {sug.suggested}kg em todas as séries
                        </button>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground px-1">
                      <span className="font-semibold text-foreground">Atua:</span> {ex.work}
                    </p>
                    <ol className="px-1 list-decimal list-inside space-y-0.5 text-[12px] text-muted-foreground">
                      {ex.steps.map((c, k) => (
                        <li key={`${k}-${c.slice(0, 24)}`}>{c}</li>
                      ))}
                    </ol>
                    {ex.attention && (
                      <p className="rounded-[10px] bg-accent p-2.5 text-[12px] text-primary">{ex.attention}</p>
                    )}
                    {ex.alt && (
                      <p className="rounded-[10px] bg-secondary p-2.5 text-[12px] text-muted-foreground">
                        <b>{ex.alt[0]}:</b> {ex.alt[1]}
                      </p>
                    )}
                    <div className="flex gap-2 px-1">
                      {ex.videoPt && (
                        <a href={ex.videoPt} target="_blank" rel="noreferrer" title={`Ver execução de ${ex.name} em português`} className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-[10px] bg-secondary text-[13px] font-semibold active:scale-95">
                          🎥 Como fazer ▷
                        </a>
                      )}
                      {ex.videoEn && (
                        <a href={ex.videoEn} target="_blank" rel="noreferrer" title={`See ${ex.name} proper form in English`} className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-[10px] bg-secondary text-[13px] font-semibold active:scale-95">
                          Vídeo EN ▷
                        </a>
                      )}
                    </div>
                    {sets.map((s) => (
                      <SetRow
                        key={s.setNumber}
                        ex={ex}
                        s={s}
                        prev={prevMap[ex.id]?.[s.setNumber] ?? '—'}
                        day={day}
                        defaultLoad={effectiveLoad(ex, s)}
                        timer={t}
                      />
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* Cardio */}
      <article className="rounded-2xl bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setCardioOpen(!cardioOpen)}
          className="w-full flex items-center gap-[10px] min-h-[62px] p-[9px] text-left active:scale-[0.99]"
          aria-expanded={cardioOpen}
        >
          <span className="relative w-[44px] h-[44px] shrink-0 overflow-hidden rounded-lg bg-secondary">
            <img src="/imagens/cardio.jpg" alt="" loading="lazy" className="h-full w-full object-cover" />
            {cardioDone && (
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-[16px] font-bold text-primary" aria-hidden="true">✓</span>
            )}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold truncate">Cardio — {cardioInfo.title}</span>
            <span className="block mt-[5px] text-[11px] text-muted-foreground truncate tabular-nums">
              {cardioInfo.total} min · {cardioInfo.summary}
            </span>
          </span>
          <span className="text-primary text-[14px]">{cardioOpen ? '⌄' : '›'}</span>
        </button>
        {cardioOpen && (
          <div className="px-[9px] pb-[9px] grid gap-2">
            <p className="text-[12px] text-muted-foreground px-1">{cardioInfo.goal}</p>
            {cardioInfo.note && <p className="rounded-[10px] bg-accent p-2.5 text-[12px] text-primary">{cardioInfo.note}</p>}
            {cardioInfo.stages.slice(0, 12).map((st, k) => (
              <div key={k} className="flex items-center gap-2 rounded-[10px] bg-secondary/50 p-2.5">
                <span className="w-8 h-8 shrink-0 grid place-items-center rounded-lg bg-secondary text-[12px] font-bold tabular-nums">{k + 1}</span>
                <span className="flex-1 min-w-0 text-[13px] truncate">
                  {st.label} <span className="text-muted-foreground tabular-nums">· {mmss(st.sec)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => t.start(st.sec, `${st.label} — cardio`)}
                  className="min-h-[44px] shrink-0 rounded-[10px] bg-primary px-3 text-[12px] font-bold text-primary-foreground tabular-nums active:scale-95"
                >
                  ▷ {mmss(st.sec)}
                </button>
              </div>
            ))}
            {cardioInfo.stages.length > 12 && (
              <p className="text-[11px] text-muted-foreground px-1">+ {cardioInfo.stages.length - 12} etapas no protocolo completo.</p>
            )}
            <button
              type="button"
              onClick={() => {
                setCardioDone(day, !cardioDone)
                if (!cardioDone) {
                  sfx.success()
                  showToast('Cardio feito · +20 pts')
                }
              }}
              className={`h-[52px] w-full rounded-[10px] text-[14px] font-semibold active:scale-[0.98] ${cardioDone ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
              {cardioDone ? '✓ Cardio feito' : 'Marcar cardio como feito'}
            </button>
          </div>
        )}
      </article>

      {/* CTA */}
      <div className="grid gap-2">
        {t.running || t.remainingMs > 0 ? (
          <p className="rounded-[10px] bg-card p-3 text-[13px] text-center tabular-nums">
            {t.label} · {t.mm}:{String(t.ss).padStart(2, '0')}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setWorkoutDone(day, !done)
            showToast(done ? 'Treino reaberto' : 'Treino concluído · +50 pts')
            if (!done) sfx.success()
          }}
          className={`w-full min-h-[48px] px-[18px] rounded-[10px] text-[14px] font-semibold flex items-center justify-between gap-3 active:scale-[0.99] ${done ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}
        >
          {done ? 'Treino concluído — tocar para reabrir' : `Iniciar treino ${dayKey}`} <span className="text-[21px] leading-none" aria-hidden="true">▷</span>
        </button>
        <p className="text-[11px] text-muted-foreground text-center">Ajuste as cargas com seu profissional de educação física.</p>
      </div>
    </>
  )
}
