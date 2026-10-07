import { useMemo, useState } from 'react'
import { PROGRAM, setsForBlock } from '../data/program'
import { blockForWeek, focusForWeek } from '../data/blocks'
import { buildCardio } from '../data/cardio'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { suggestNextLoad } from '../lib/doubleProgression'

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function CardioCard({ dayKey, blockIdx, day, timer }) {
  const cardioDone = useAppStore((s) => !!s.days[day]?.cardioDone)
  const setCardioDone = useAppStore((s) => s.setCardioDone)
  const [openStage, setOpenStage] = useState({})
  const c = useMemo(() => buildCardio(dayKey, blockIdx), [dayKey, blockIdx])

  return (
    <div className={`rounded-2xl border p-4 ${cardioDone ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300' : 'bg-white dark:bg-[#1E293B]'}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h4 className="font-extrabold">🏃 Cardio — {c.title} {cardioDone && <span className="text-emerald-500">✓</span>}</h4>
          <p className="text-xs opacity-60">{c.summary} • {c.bpm}{c.dist ? ` • ${c.dist}` : ''}</p>
        </div>
        <button onClick={() => setCardioDone(day, !cardioDone)}
          className={`min-h-[48px] px-4 rounded-xl font-black text-sm shrink-0 active:scale-95 ${cardioDone ? 'bg-emerald-500 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
          {cardioDone ? '✓ Feito' : 'Marcar feito'}
        </button>
      </div>
      <p className="text-xs opacity-70 mt-1">{c.goal}</p>
      {c.note && <p className="text-xs mt-1 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2">💡 {c.note}</p>}
      <div className="mt-2 space-y-1.5">
        {c.stages.map((s, k) => (
          <div key={k} className={`flex items-center gap-2 rounded-xl border p-2.5 ${openStage[k] ? 'bg-emerald-500/10 border-emerald-500/40' : ''}`}>
            <button onClick={() => setOpenStage({ ...openStage, [k]: !openStage[k] })}
              className={`min-w-[44px] min-h-[44px] rounded-lg font-black ${openStage[k] ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {openStage[k] ? '✓' : k + 1}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{s.label} {s.round && <span className="opacity-50 text-xs">{s.round}</span>}</p>
              <p className="text-xs opacity-60">{mmss(s.sec)}{s.hint ? ` • ${s.hint}` : ''}</p>
            </div>
            <button onClick={() => timer.start(s.sec, `${s.label} — cardio`)}
              className="min-h-[44px] px-3 rounded-lg bg-orange-500 text-white text-xs font-black shrink-0 active:scale-95">▶ {mmss(s.sec)}</button>
          </div>
        ))}
      </div>
      <p className="text-[11px] opacity-50 mt-2">Total ≈ {c.total} min • toque em ▶ para cronometrar cada etapa • marque as etapas e depois “Marcar feito” (+20 XP na missão).</p>
    </div>
  )
}

export default function Treino({ timer }) {
  const t = timer ?? useWorkoutTimer()
  const p = useProgressTracking()
  const day = p.displayDay
  const week = Math.ceil(day / 7)
  const block = blockForWeek(week)
  const logSet = useAppStore((s) => s.logSet)
  const removeSet = useAppStore((s) => s.removeSet)
  const setWorkoutDone = useAppStore((s) => s.setWorkoutDone)
  const setLoad = useAppStore((s) => s.setLoad)
  const loads = useAppStore((s) => s.loads)
  const dayLog = useAppStore((s) => s.days[day] ?? {})
  const days = useAppStore((s) => s.days)
  const allSets = useMemo(() => Object.values(days).flatMap((d) => d.sets ?? []), [days])

  const [video, setVideo] = useState(null)
  const [openEx, setOpenEx] = useState({})
  // Dia selecionado compartilhado com a tela Hoje ("Iniciar treino" abre o treino certo)
  const storedKey = useAppStore((s) => s.trainKey)
  const setTrainKey = useAppStore((s) => s.setTrainKey)
  const autoKey = ['SEG', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SEG'][new Date().getDay()] ?? 'SEG'
  const dayKey = storedKey ?? autoKey
  const setDayKey = setTrainKey
  const plan = PROGRAM[dayKey]
  const done = !!dayLog.workoutDone

  // Séries do bloco atual (nº de séries muda por bloco no cronograma)
  const planSets = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) out[ex.id] = setsForBlock(ex, block.idx)
    return out
  }, [plan, block.idx])

  const doneSets = (dayLog.sets ?? []).filter((s) => plan.exercises.some((e) => e.name === s.exercise))
  const totalSets = Object.values(planSets).reduce((a, arr) => a + arr.length, 0)
  const pctDone = totalSets ? Math.round((doneSets.length / totalSets) * 100) : 0

  const effectiveLoad = (ex, s) => {
    const perSet = loads[`${ex.name}#${s.setNumber}`]
    if (perSet != null) return perSet
    if (loads[ex.name] != null) return loads[ex.name]
    const sug = suggestNextLoad(allSets.filter((x) => x.day !== day), { exerciseName: ex.name, exerciseType: ex.type, baseLoad: 0 })
    if (sug.suggested > 0) return sug.suggested
    return ''
  }

  const suggestions = useMemo(() => {
    const out = {}
    for (const ex of plan.exercises) {
      out[ex.id] = suggestNextLoad(allSets.filter((x) => x.day !== day), { exerciseName: ex.name, exerciseType: ex.type, baseLoad: 0 })
    }
    return out
  }, [plan, allSets, day])

  const logged = (exName, n) => (dayLog.sets ?? []).find((x) => x.exercise === exName && x.setNumber === n)

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-20 bg-white dark:bg-[#1E293B] rounded-2xl border p-4 shadow-lg">
        <div className="grid grid-cols-5 gap-2">
          {Object.values(PROGRAM).map((d) => (
            <button key={d.key} onClick={() => setDayKey(d.key)}
              className={`py-2 rounded-xl font-extrabold text-xs min-h-[52px] active:scale-95 ${dayKey === d.key ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {d.key}<span className="block text-[10px] font-normal">{d.label}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-baseline mt-3 gap-2">
          <h2 className="text-xl font-black">{plan.name}</h2>
          <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ${pctDone === 100 ? 'bg-emerald-500 text-white' : 'bg-orange-500/10 text-orange-500'}`}>{doneSets.length}/{totalSets} • {pctDone}%</span>
        </div>
        <p className="text-xs opacity-60 mt-0.5">{plan.sub}</p>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all" style={{ width: `${pctDone}%` }} />
        </div>
        <p className="text-xs opacity-60 mt-1">Dia {day} • {block.name}: {block.sub} • RIR {block.rir} • {focusForWeek(week)}</p>
      </div>

      {plan.exercises.map((ex, i) => {
        const sug = suggestions[ex.id]
        const sets = planSets[ex.id]
        const exDone = sets.every((s) => logged(ex.name, s.setNumber))
        const collapsed = openEx[ex.id] ?? exDone
        return (
          <div key={ex.id} className={`bg-white dark:bg-[#1E293B] rounded-2xl border p-4 ${exDone ? 'border-emerald-500/50' : ''}`}>
            <button onClick={() => setOpenEx({ ...openEx, [ex.id]: !collapsed })} className="w-full flex justify-between items-start gap-2 text-left min-h-[48px]">
              <div>
                <h4 className="font-extrabold">#{i + 1} {ex.name} {exDone && <span className="text-emerald-500">✓</span>}</h4>
                <p className="text-xs opacity-60">{ex.muscle} • {sets.filter((s) => logged(ex.name, s.setNumber)).length}/{sets.length} séries • {ex.reps.raw} • desc. {ex.rest}{collapsed ? ' • toque p/ abrir' : ''}</p>
              </div>
              <span className="flex gap-2 shrink-0">
                <span onClick={(e) => { e.stopPropagation(); setVideo(ex) }} className="min-h-[44px] px-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/30 text-xs font-bold flex items-center">🎬 Vídeo</span>
                <span className="text-xl opacity-50">{collapsed ? '›' : '⌄'}</span>
              </span>
            </button>

            {!collapsed && (<>
            {sug.progressed && sug.suggested > 0 && (
              <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs flex justify-between items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">🔼 {sug.reason} Sugestão: {sug.suggested}kg</span>
                <button onClick={() => setLoad(ex.name, sug.suggested)} className="px-3 py-2 rounded-lg bg-emerald-500 text-white font-bold min-h-[40px] shrink-0">Aplicar</button>
              </div>
            )}

            <p className="mt-2 text-xs opacity-70"><b>Atua:</b> {ex.work}</p>
            <ol className="mt-1 text-xs opacity-70 list-decimal list-inside space-y-0.5">
              {ex.steps.map((c) => <li key={c}>{c}</li>)}
            </ol>
            {ex.attention && <p className="mt-1 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 p-2">⚠️ {ex.attention}</p>}
            {ex.alt && <p className="mt-1 text-xs rounded-lg bg-blue-500/10 border border-blue-500/30 p-2">🔄 <b>{ex.alt[0]}:</b> {ex.alt[1]}</p>}

            <div className="space-y-2 mt-3">
              {sets.map((s) => {
                const it = logged(ex.name, s.setNumber)
                const load = effectiveLoad(ex, s)
                const unit = s.timed ? 's' : 'reps'
                return (
                  <div key={s.setNumber} className={`rounded-xl border p-2 ${it ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300' : ''}`}>
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                      <span className="text-xs font-black w-8">S{s.setNumber}</span>
                      <label className="text-[11px] font-bold flex items-center gap-1">🏋️
                        <input type="number" step="0.5" inputMode="decimal" placeholder="kg" value={load} onChange={(e) => setLoad(`${ex.name}#${s.setNumber}`, Number(e.target.value))}
                          className="w-full min-h-[48px] text-center font-bold rounded-lg bg-slate-100 dark:bg-slate-900 border text-sm" />
                        <span className="opacity-50">kg</span>
                      </label>
                      <label className="text-[11px] font-bold flex items-center gap-1">🔁
                        <input type="number" inputMode="numeric" defaultValue={s.repsTarget[1]} id={`reps-${ex.id}-${s.setNumber}`}
                          className="w-full min-h-[48px] text-center font-bold rounded-lg bg-slate-100 dark:bg-slate-900 border text-sm" />
                        <span className="opacity-50">/{s.repsTarget[1]}{s.timed ? 's' : ''}</span>
                      </label>
                      {it ? (
                        <button onClick={() => removeSet(day, ex.name, s.setNumber)} title="Desmarcar"
                          className="min-w-[48px] min-h-[48px] rounded-lg bg-emerald-500 text-white font-black">✓</button>
                      ) : (
                        <button
                          onClick={() => {
                            const el = document.getElementById(`reps-${ex.id}-${s.setNumber}`)
                            const repsDone = Math.max(0, Number(el?.value ?? s.repsTarget[1]))
                            logSet(day, { exercise: ex.name, setNumber: s.setNumber, load: Number(load) || 0, repsDone, repsTop: s.repsTarget[1] })
                            t.start(s.restSeconds ?? 60, `Descanso — ${ex.name}`)
                          }}
                          className="min-w-[48px] min-h-[48px] rounded-lg bg-slate-200 dark:bg-slate-700 font-black active:scale-95">○</button>
                      )}
                    </div>
                    <p className="text-[10px] opacity-50 mt-1">Meta {s.repsTarget[0]}–{s.repsTarget[1]} {unit} • descanso {mmss(s.restSeconds ?? 60)}{it ? ` • feito: ${it.repsDone}${s.timed ? 's' : ' reps'} @ ${it.load}kg` : ''}</p>
                  </div>
                )
              })}
            </div>
            </>)}
          </div>
        )
      })}

      <CardioCard dayKey={dayKey} blockIdx={block.idx} day={day} timer={t} />

      <button onClick={() => setWorkoutDone(day, !done)}
        className={`w-full min-h-[52px] rounded-2xl font-black active:scale-95 ${done ? 'bg-emerald-600 text-white' : 'bg-orange-500 text-white'}`}>
        {done ? 'Treino concluído ✓ — toque para reabrir' : 'Concluir treino (+50 XP na missão)'}
      </button>

      {video && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setVideo(null)}>
          <div className="w-full sm:max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90dvh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black">{video.name}</h3>
            <p className="text-xs opacity-60">{video.muscle} • {video.reps.raw} • desc. {video.rest}</p>
            <p className="text-xs mt-2"><b>Atua:</b> {video.work}</p>
            <ol className="mt-2 text-sm space-y-1.5 list-decimal list-inside">
              {video.steps.map((c) => <li key={c}>{c}</li>)}
            </ol>
            {video.attention && <p className="mt-2 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 p-2">⚠️ {video.attention}</p>}
            {video.alt && <p className="mt-2 text-xs rounded-lg bg-blue-500/10 border border-blue-500/30 p-2">🔄 <b>{video.alt[0]}:</b> {video.alt[1]}</p>}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <a href={video.videoPt} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-red-600 text-white font-black text-sm">
                ▶ Vídeo PT
              </a>
              <a href={video.videoEn} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-slate-900 text-white font-black text-sm border border-white/20">
                ▶ Vídeo EN
              </a>
            </div>
            <p className="text-[11px] opacity-50 mt-2 text-center">Dica: assista com Wi-Fi antes de descer p/ academia (modo offline).</p>
            <button onClick={() => setVideo(null)} className="mt-2 w-full min-h-[48px] rounded-xl border font-bold">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
