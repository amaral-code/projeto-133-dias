import { useEffect, useMemo, useState } from 'react'
import { PROGRAM, setsForBlock } from '../data/program'
import { blockForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { suggestNextLoad, lastSessionFor } from '../lib/doubleProgression'
import { sessionVolume, formatKg } from '../lib/metrics'
import { sfx } from '../lib/sound'
import { Icon } from '../components/ui'
import { SurfaceCard, MotionWrapper, MotionStagger, MotionItem, MetricBadge } from '../components/system'

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function TreinoSkeleton() {
  const block = 'animate-pulse rounded-xl border border-white/[0.08] bg-[#1C211E]/60'
  return (
    <div className="space-y-[18px]" aria-label="Carregando treino">
      <div className={`${block} h-40`} />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        <div className={`${block} h-96 lg:col-span-4`} />
        <div className={`${block} h-96 lg:col-span-2`} />
      </div>
    </div>
  )
}

function DeltaTag({ value, suffix = '%' }) {
  const v = Number(value) || 0
  const good = v >= 0
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

/* Controle embutido Origin UI: - / valor mono / + */
function Stepper({ value, onChange, step = 1, min = 0, ariaLabel = 'Ajustar valor', format }) {
  const num = Number(value) || 0
  const show = format ? format(value) : String(value ?? '')
  return (
    <div className="flex h-11 items-center rounded-md border border-white/[0.08] bg-white/[0.03] transition-colors focus-within:border-primary hover:border-white/[0.14]">
      <button
        onClick={() => onChange(Number((num - step).toFixed(2)))}
        aria-label={`Diminuir ${ariaLabel}`}
        className="flex h-full w-9 shrink-0 items-center justify-center text-base text-zinc-400 transition-colors hover:text-zinc-100 active:scale-[0.98]"
      >
        −
      </button>
      <input
        type="number"
        step={step}
        inputMode="decimal"
        value={show}
        placeholder="0"
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="h-full w-full min-w-0 bg-transparent text-center font-mono text-sm tabular-nums outline-none placeholder:text-zinc-600"
      />
      <button
        onClick={() => onChange(Number((num + step).toFixed(2)))}
        aria-label={`Aumentar ${ariaLabel}`}
        className="flex h-full w-9 shrink-0 items-center justify-center text-base text-zinc-400 transition-colors hover:text-zinc-100 active:scale-[0.98]"
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
  const [flash, setFlash] = useState(false)
  const load = defaultLoad
  const step = /barra|leg press|hip thrust|agachamento|stiff/i.test(`${ex.name} ${ex.type}`) ? 2.5 : 1
  const unit = s.timed ? 's' : 'reps'

  const complete = () => {
    const repsDone = Math.max(0, Number(reps) || 0)
    logSet(day, { exercise: ex.name, setNumber: s.setNumber, load: Number(load) || 0, repsDone, repsTop: s.repsTarget[1] })
    sfx.success()
    setFlash(true)
    setTimeout(() => setFlash(false), 1200)
    showToast(`Série ${s.setNumber} salva · descanso ${mmss(s.restSeconds ?? 60)}`)
    timer.start(s.restSeconds ?? 60, `Descanso — ${ex.name}`)
  }
  const uncheck = () => {
    removeSet(day, ex.name, s.setNumber)
    sfx.uncheck()
  }

  return (
    <div
      className={`rounded-lg border p-2 transition-colors ${
        it
          ? 'border-emerald-400/20 bg-emerald-400/[0.06]'
          : flash
            ? 'border-emerald-400/30 bg-emerald-400/[0.08]'
            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      <div className="grid grid-cols-12 items-center gap-1.5">
        <span className="col-span-1 pl-1 font-mono text-xs tabular-nums text-zinc-400">#{s.setNumber}</span>
        <span className="col-span-3 truncate text-center font-mono text-[11px] tabular-nums text-zinc-500">{prev}</span>
        <div className="col-span-3">
          <Stepper value={load} onChange={(v) => setLoad(`${ex.name}#${s.setNumber}`, v)} step={step} ariaLabel={`Carga série ${s.setNumber}`} />
        </div>
        <div className="col-span-3">
          <Stepper value={reps} onChange={setReps} step={1} min={0} ariaLabel={`Reps série ${s.setNumber}`} />
        </div>
        <span className="col-span-2 flex justify-end">
          {it ? (
            <button
              onClick={uncheck}
              title="Desmarcar série"
              className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white transition hover:bg-emerald-500/90 active:scale-[0.98]"
            >
              <Icon name="check" size={15} strokeWidth={3} />
            </button>
          ) : (
            <button
              onClick={complete}
              title="Concluir série"
              aria-label={`Concluir série ${s.setNumber}`}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/[0.08] text-zinc-500 transition-colors hover:border-primary hover:text-primary active:scale-[0.98]"
            >
              <span className="h-3 w-3 rounded-full border-2 border-current" />
            </button>
          )}
        </span>
      </div>
      <p className="mt-1 font-mono text-[10px] tabular-nums text-zinc-600">
        Meta {s.repsTarget[0]}–{s.repsTarget[1]} {unit} · desc. {mmss(s.restSeconds ?? 60)}
        {it ? ` · feito ${it.repsDone}${s.timed ? 's' : ''} @ ${it.load}kg` : ''}
      </p>
    </div>
  )
}

function CardioCard({ dayKey, blockIdx, day, timer }) {
  const cardioDone = useAppStore((s) => !!s.days[day]?.cardioDone)
  const setCardioDone = useAppStore((s) => s.setCardioDone)
  const showToast = useAppStore((s) => s.showToast)
  const [openStage, setOpenStage] = useState({})
  const c = useMemo(() => buildCardio(dayKey, blockIdx), [dayKey, blockIdx])
  const kcalEst = Math.round(c.total * (/HIIT/i.test(c.title) ? 10 : /limiar|resist/i.test(c.title) ? 9 : 7))

  return (
    <SurfaceCard>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold tracking-tight">Cardio — {c.title}</h4>
            {cardioDone && <MetricBadge tone="green" value="feito" pulse={false} />}
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {c.summary} · {c.bpm}
            {c.dist ? ` · ${c.dist}` : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setCardioDone(day, !cardioDone)
            if (!cardioDone) {
              sfx.success()
              showToast('Cardio feito · +20 XP')
            }
          }}
          className={`h-10 shrink-0 rounded-md px-3.5 text-xs font-medium transition active:scale-[0.98] ${
            cardioDone
              ? 'bg-emerald-500 text-white hover:bg-emerald-500/90'
              : 'border border-white/[0.08] hover:bg-white/[0.05]'
          }`}
        >
          {cardioDone ? 'Feito' : 'Marcar feito'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'tempo', value: `${c.total} min` },
          { label: 'intensidade', value: c.bpm.split('·')[0].trim() },
          { label: 'kcal est.', value: `~${kcalEst}` },
        ].map((m) => (
          <div key={m.label} className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
            <p className="label">{m.label}</p>
            <p className="mt-0.5 truncate font-mono text-[13px] tabular-nums text-zinc-100">{m.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-zinc-500">{c.goal}</p>
      {c.note && (
        <p className="mt-1.5 rounded-md border border-amber-400/20 bg-amber-400/[0.06] p-2 text-xs text-amber-200/90">{c.note}</p>
      )}
      <div className="mt-2 space-y-1.5">
        {c.stages.map((st, k) => (
          <div
            key={k}
            className={`flex items-center gap-2 rounded-md border p-2 transition-colors hover:bg-white/[0.04] ${
              openStage[k] ? 'border-emerald-400/20 bg-emerald-400/[0.05]' : 'border-white/[0.08]'
            }`}
          >
            <button
              onClick={() => setOpenStage({ ...openStage, [k]: !openStage[k] })}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-xs tabular-nums transition active:scale-[0.98] ${
                openStage[k] ? 'bg-emerald-500 text-white' : 'border border-white/[0.08] text-zinc-400'
              }`}
            >
              {openStage[k] ? <Icon name="check" size={13} strokeWidth={3} /> : k + 1}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {st.label} {st.round && <span className="font-mono text-[11px] tabular-nums text-zinc-500">{st.round}</span>}
              </p>
              <p className="font-mono text-[11px] tabular-nums text-zinc-500">
                {mmss(st.sec)}
                {st.hint ? ` · ${st.hint}` : ''}
              </p>
            </div>
            <button
              onClick={() => timer.start(st.sec, `${st.label} — cardio`)}
              className="flex h-9 shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 font-mono text-[11px] tabular-nums text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Icon name="play" size={11} /> {mmss(st.sec)}
            </button>
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}

const SUBTABS = [
  { id: 'foco', label: 'Exercício' },
  { id: 'ficha', label: 'Ficha do dia' },
  { id: 'registros', label: 'Registros' },
]

export default function Treino({ timer }) {
  const t = timer ?? useWorkoutTimer()
  const p = useProgressTracking()
  const day = p.displayDay
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)
  const logSet = useAppStore((s) => s.logSet)
  void logSet
  const removeSet = useAppStore((s) => s.removeSet)
  const setWorkoutDone = useAppStore((s) => s.setWorkoutDone)
  const setLoad = useAppStore((s) => s.setLoad)
  const loads = useAppStore((s) => s.loads)
  const showToast = useAppStore((s) => s.showToast)
  const dayLog = useAppStore((s) => s.days[day] ?? {})
  const days = useAppStore((s) => s.days)
  const allSets = useMemo(() => Object.values(days).flatMap((d) => d.sets ?? []), [days])

  const [video, setVideo] = useState(null)
  const [openEx, setOpenEx] = useState({})
  const [modo, setModo] = useState('foco')
  const [focus, setFocus] = useState(0)
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setBooting(false), 450)
    return () => clearTimeout(id)
  }, [])

  const storedKey = useAppStore((s) => s.trainKey)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const autoKey = ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'
  const dayKey = storedKey ?? autoKey
  const setDayKey = (k) => {
    setTrainKey(k)
    setFocus(0)
  }
  const plan = PROGRAM[dayKey]
  const done = !!dayLog.workoutDone

  const planSets = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) out[ex.id] = setsForBlock(ex, block.idx)
    return out
  }, [plan, block.idx])

  const doneSets = (dayLog.sets ?? []).filter((s) => plan.exercises.some((e) => e.name === s.exercise))
  const totalSets = Object.values(planSets).reduce((a, arr) => a + arr.length, 0)
  const pctDone = totalSets ? Math.round((doneSets.length / totalSets) * 100) : 0
  const focusIdx = Math.min(focus, plan.exercises.length - 1)
  const focusEx = plan.exercises[focusIdx]

  const volume = sessionVolume(dayLog.sets ?? [])
  const prevVolumes = useMemo(() => {
    const byDay = {}
    for (const [d, log] of Object.entries(days)) {
      if (Number(d) === day) continue
      const v = sessionVolume(log.sets ?? [])
      if (v > 0) byDay[d] = v
    }
    return Object.values(byDay)
  }, [days, day])
  const volumeMeta = prevVolumes.length
    ? Math.round(prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length)
    : totalSets * 320
  const volumeDelta = volumeMeta ? ((volume - volumeMeta) / volumeMeta) * 100 : 0
  const cardio = useMemo(() => buildCardio(dayKey, block.idx), [dayKey, block.idx])

  const effectiveLoad = (ex, s) => {
    const perSet = loads[`${ex.name}#${s.setNumber}`]
    if (perSet != null && perSet !== '') return perSet
    if (loads[ex.name] != null && loads[ex.name] !== '') return loads[ex.name]
    const sug = suggestNextLoad(allSets.filter((x) => x.day !== day), {
      exerciseName: ex.name,
      exerciseType: ex.type,
      baseLoad: 0,
    })
    if (sug.suggested > 0) return sug.suggested
    return ''
  }

  const suggestions = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) {
      out[ex.id] = suggestNextLoad(allSets.filter((x) => x.day !== day), {
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

  const renderSets = (ex, sets) => (
    <div className="mt-3 space-y-1.5">
      <div className="grid grid-cols-12 items-center gap-1.5 px-1">
        <span className="label col-span-1">Série</span>
        <span className="label col-span-3 text-center">Anterior</span>
        <span className="label col-span-3 text-center">Carga kg</span>
        <span className="label col-span-3 text-center">Reps</span>
        <span className="col-span-2" />
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
  )

  const renderExerciseBody = (ex) => {
    const sets = planSets[ex.id]
    const sug = suggestions[ex.id]
    return (
      <>
        {sug.progressed && sug.suggested > 0 && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] p-2.5">
            <span className="text-xs font-medium text-emerald-300">
              {sug.reason} Sugestão: <span className="font-mono tabular-nums">{sug.suggested}kg</span>
            </span>
            <button
              onClick={() => setLoad(ex.name, sug.suggested)}
              className="h-9 shrink-0 rounded-md bg-emerald-500 px-3 text-xs font-medium text-white transition hover:bg-emerald-500/90 active:scale-[0.98]"
            >
              Aplicar
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Atua:</span> {ex.work}
        </p>
        <ol className="mt-1 list-decimal list-inside space-y-0.5 text-xs text-zinc-500">
          {ex.steps.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        {ex.attention && (
          <p className="mt-1.5 rounded-md border border-amber-400/20 bg-amber-400/[0.06] p-2 text-xs text-amber-200/90">{ex.attention}</p>
        )}
        {ex.alt && (
          <p className="mt-1.5 rounded-md border border-blue-400/20 bg-blue-400/[0.06] p-2 text-xs text-blue-200/90">
            <b>{ex.alt[0]}:</b> {ex.alt[1]}
          </p>
        )}
        {renderSets(ex, sets)}
      </>
    )
  }

  const modoIdx = SUBTABS.findIndex((x) => x.id === modo)

  if (booting) return <TreinoSkeleton />

  return (
    <div className="space-y-[18px] pb-24">
      {/* Cabeçalho de sessão ativo */}
      <SurfaceCard hoverGlow={false}>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.values(PROGRAM).map((d) => (
            <button
              key={d.key}
              onClick={() => setDayKey(d.key)}
              className={`min-h-[52px] rounded-md py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                dayKey === d.key ? 'bg-primary text-primary-foreground' : 'text-zinc-400 hover:bg-white/[0.05]'
              }`}
            >
              {d.key}
              <span className="block font-mono text-[10px] font-normal tabular-nums opacity-70">{d.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{plan.name}</h2>
          <MetricBadge tone={pctDone === 100 ? 'green' : 'neutral'} value={`${doneSets.length}/${totalSets} · ${pctDone}%`} />
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{plan.sub}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pctDone}%` }} />
        </div>

        <MotionStagger className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" gap={0.05}>
          {[
            { label: 'volume sessão', value: formatKg(volume), extra: <DeltaTag value={volumeDelta} /> },
            { label: 'séries', value: `${doneSets.length}/${totalSets}`, extra: null },
            { label: 'cardio', value: `${cardio.total} min`, extra: null },
            { label: 'bloco · RIR', value: `${block.name} · ${block.rir}`, extra: null },
          ].map((m) => (
            <MotionItem key={m.label} className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
              <p className="label">{m.label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[13px] tabular-nums text-zinc-100">
                <span className="truncate">{m.value}</span> {m.extra}
              </p>
            </MotionItem>
          ))}
        </MotionStagger>
        <p className="mt-2 font-mono text-[11px] tabular-nums text-zinc-600">
          Dia {day} · meta volume <span className="text-zinc-400">{formatKg(volumeMeta)}</span> (média histórico{prevVolumes.length ? ` · ${prevVolumes.length} sessões` : ' · estimativa'})
        </p>

        <div className="relative mt-3 flex rounded-md border border-white/[0.08] bg-white/[0.02] p-1 text-xs font-medium" style={{ ['--tabs']: SUBTABS.length }}>
          <div className="tab-glider" style={{ transform: `translateX(${modoIdx * 100}%)` }} />
          {SUBTABS.map((st) => (
            <button
              key={st.id}
              onClick={() => setModo(st.id)}
              className={`relative z-10 min-h-[40px] flex-1 rounded text-center transition-colors active:scale-[0.98] ${
                modo === st.id ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        {modo === 'foco' && (
          <>
            <MotionWrapper className="lg:col-span-4" delay={0}>
              <SurfaceCard key={`${dayKey}-${focusIdx}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[11px] tabular-nums text-zinc-300">
                    {focusEx.muscle} · {planSets[focusEx.id].length} séries · {focusEx.reps.raw} · desc. {focusEx.rest}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                    {focusIdx + 1}/{plan.exercises.length}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-semibold leading-snug tracking-tight">
                    <span className="font-mono tabular-nums text-zinc-500">#{focusIdx + 1}</span> {focusEx.name}
                  </h4>
                  <button
                    onClick={() => setVideo(focusEx)}
                    className="flex h-10 shrink-0 items-center gap-1 rounded-md border border-white/[0.08] px-2.5 text-xs font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                  >
                    <Icon name="play" size={11} /> Técnica
                  </button>
                </div>
                <p className="mt-1 w-fit rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-400">RIR {block.rir}</p>
                {renderExerciseBody(focusEx)}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFocus(Math.max(0, focusIdx - 1))}
                    disabled={focusIdx <= 0}
                    className="min-h-[48px] rounded-md border border-white/[0.08] text-sm font-medium transition enabled:hover:bg-white/[0.05] enabled:active:scale-[0.98] disabled:opacity-30"
                  >
                    ‹ Anterior
                  </button>
                  <button
                    onClick={() => {
                      setFocus((focusIdx + 1) % plan.exercises.length)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="min-h-[48px] rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
                  >
                    Próximo ›
                  </button>
                </div>
              </SurfaceCard>
            </MotionWrapper>

            <div className="space-y-[18px] lg:col-span-2">
              <SurfaceCard>
                <h4 className="text-sm font-semibold tracking-tight">Sessão</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Volume</span>
                    <span className="flex items-center gap-1.5 font-mono tabular-nums text-zinc-100">
                      {formatKg(volume)} <DeltaTag value={volumeDelta} />
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (volume / (volumeMeta || 1)) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Séries</span>
                    <span className="font-mono tabular-nums text-zinc-100">
                      {doneSets.length}/{totalSets} · {pctDone}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${pctDone}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Cardio</span>
                    <span className="font-mono tabular-nums text-zinc-100">{cardio.total} min · {cardio.title}</span>
                  </div>
                  {t.running || t.remainingMs > 0 ? (
                    <p className="rounded-md border border-white/[0.08] bg-white/[0.03] p-2 font-mono text-xs tabular-nums text-zinc-200">
                      {t.label} · {t.mm}:{String(t.ss).padStart(2, '0')}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-600">Cronômetro livre — inicie pelo descanso de uma série ou etapa do cardio.</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setWorkoutDone(day, !done)
                    showToast(done ? 'Treino reaberto' : 'Treino concluído · +50 XP')
                  }}
                  className={`mt-3 min-h-[48px] w-full rounded-md text-sm font-medium transition active:scale-[0.98] ${
                    done ? 'bg-emerald-500 text-white hover:bg-emerald-500/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {done ? 'Concluído — tocar p/ reabrir' : 'Concluir treino (+50 XP)'}
                </button>
              </SurfaceCard>
              <CardioCard dayKey={dayKey} blockIdx={block.idx} day={day} timer={t} />
            </div>
          </>
        )}

        {modo === 'ficha' && (
          <>
            <div className="space-y-2.5 lg:col-span-4">
              <MotionStagger className="space-y-2.5" gap={0.04}>
                {plan.exercises.map((ex, i) => {
                  const sets = planSets[ex.id]
                  const exDone = sets.every((s) => logged(ex.name, s.setNumber))
                  const collapsed = openEx[ex.id] ?? exDone
                  const exDoneCount = sets.filter((s) => logged(ex.name, s.setNumber)).length
                  return (
                    <MotionItem key={ex.id}>
                      <SurfaceCard padding="sm" hoverGlow={false} className={exDone ? 'border-emerald-400/20' : ''}>
                        <button
                          onClick={() => setOpenEx({ ...openEx, [ex.id]: !collapsed })}
                          className="flex min-h-[48px] w-full items-start justify-between gap-2 rounded-md p-1 text-left transition-colors hover:bg-white/[0.03] active:scale-[0.99]"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold tracking-tight">
                              <span className="font-mono tabular-nums text-zinc-500">#{i + 1}</span> {ex.name}{' '}
                              {exDone && <span className="text-emerald-400">✓</span>}
                            </h4>
                            <p className="mt-0.5 font-mono text-[11px] tabular-nums text-zinc-500">
                              {exDoneCount}/{sets.length} séries · {ex.reps.raw} · desc. {ex.rest}
                            </p>
                          </div>
                          <span className="flex shrink-0 items-center gap-2">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                setVideo(ex)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setVideo(ex)
                              }}
                              className="flex min-h-[40px] items-center gap-1 rounded-md border border-white/[0.08] px-2.5 text-xs font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                            >
                              <Icon name="video" size={13} /> Vídeo
                            </span>
                            <span className="text-lg text-zinc-500">{collapsed ? '›' : '⌄'}</span>
                          </span>
                        </button>
                        {!collapsed && (
                          <>
                            <button
                              onClick={() => {
                                setFocus(i)
                                setModo('foco')
                                window.scrollTo({ top: 0 })
                              }}
                              className="mt-1 px-1 text-xs font-medium text-primary transition hover:underline active:scale-[0.98]"
                            >
                              Focar neste ›
                            </button>
                            {renderExerciseBody(ex)}
                          </>
                        )}
                      </SurfaceCard>
                    </MotionItem>
                  )
                })}
              </MotionStagger>
            </div>
            <div className="space-y-[18px] lg:col-span-2">
              <SurfaceCard>
                <h4 className="text-sm font-semibold tracking-tight">Sessão</h4>
                <p className="mt-1 font-mono text-xs tabular-nums text-zinc-400">
                  {doneSets.length}/{totalSets} séries · {formatKg(volume)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pctDone}%` }} />
                </div>
                <button
                  onClick={() => {
                    setWorkoutDone(day, !done)
                    showToast(done ? 'Treino reaberto' : 'Treino concluído · +50 XP')
                  }}
                  className={`mt-3 min-h-[48px] w-full rounded-md text-sm font-medium transition active:scale-[0.98] ${
                    done ? 'bg-emerald-500 text-white hover:bg-emerald-500/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {done ? 'Concluído — tocar p/ reabrir' : 'Concluir treino (+50 XP)'}
                </button>
              </SurfaceCard>
              <CardioCard dayKey={dayKey} blockIdx={block.idx} day={day} timer={t} />
            </div>
          </>
        )}

        {modo === 'registros' && (
          <MotionWrapper className="lg:col-span-6" delay={0}>
            <SurfaceCard>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-tight">Séries de hoje</h4>
                <MetricBadge tone={doneSets.length ? 'green' : 'neutral'} value={`${doneSets.length} · ${formatKg(volume)}`} />
              </div>
              {(dayLog.sets ?? []).length === 0 && (
                <p className="mt-1 text-xs text-zinc-500">Nenhuma série concluída ainda hoje.</p>
              )}
              <div className="mt-2 max-h-96 space-y-1.5 overflow-auto">
                {[...(dayLog.sets ?? [])].reverse().map((s, k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] p-2.5 text-xs transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 font-mono text-[10px] text-emerald-300">
                        ✓
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium">{s.exercise}</p>
                        <span className="font-mono tabular-nums text-zinc-500">
                          S{s.setNumber} · {s.load}kg × {s.repsDone}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        removeSet(day, s.exercise, s.setNumber)
                        sfx.uncheck()
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-red-300 active:scale-[0.98]"
                      title="Desfazer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </MotionWrapper>
        )}
      </div>

      {modo === 'ficha' && (
        <div className="lg:hidden">
          <CardioCard dayKey={dayKey} blockIdx={block.idx} day={day} timer={t} />
        </div>
      )}
      {modo === 'registros' && <CardioCard dayKey={dayKey} blockIdx={block.idx} day={day} timer={t} />}

      {modo === 'foco' && (
        <button
          onClick={() => {
            setFocus((focusIdx + 1) % plan.exercises.length)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`fixed right-3 z-30 flex items-center gap-2 rounded-full bg-primary py-3.5 pl-5 pr-4 font-mono text-xs tabular-nums text-primary-foreground transition active:scale-[0.98] lg:bottom-8 ${
            t.running || t.remainingMs > 0 ? 'bottom-[180px]' : 'bottom-[92px]'
          }`}
        >
          Próximo <span className="rounded-full bg-black/20 px-2 py-0.5">{focusIdx + 1}/{plan.exercises.length}</span> ›
        </button>
      )}

      {video && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setVideo(null)}>
          <div
            className="max-h-[90dvh] w-full overflow-auto rounded-t-xl border border-white/[0.08] bg-[#1C211E]/95 p-5 backdrop-blur-md sm:max-w-md sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold tracking-tight">{video.name}</h3>
            <p className="font-mono text-[11px] tabular-nums text-zinc-500">
              {video.muscle} · {video.reps.raw} · desc. {video.rest}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Atua:</span> {video.work}
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 text-sm text-zinc-300">
              {video.steps.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
            {video.attention && (
              <p className="mt-2 rounded-md border border-amber-400/20 bg-amber-400/[0.06] p-2 text-xs text-amber-200/90">{video.attention}</p>
            )}
            {video.alt && (
              <p className="mt-2 rounded-md border border-blue-400/20 bg-blue-400/[0.06] p-2 text-xs text-blue-200/90">
                <b>{video.alt[0]}:</b> {video.alt[1]}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={video.videoPt}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-red-600 text-sm font-medium text-white transition hover:bg-red-600/90 active:scale-[0.98]"
              >
                <Icon name="play" size={14} /> Vídeo PT
              </a>
              <a
                href={video.videoEn}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-white/[0.08] text-sm font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
              >
                <Icon name="play" size={14} /> Vídeo EN
              </a>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-600">Assista com Wi-Fi antes de descer p/ academia (modo offline).</p>
            <button
              onClick={() => setVideo(null)}
              className="mt-2 min-h-[48px] w-full rounded-md border border-white/[0.08] text-sm font-medium transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
