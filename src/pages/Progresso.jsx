import { useEffect, useMemo, useState } from 'react'
import { useProgressTracking, isWeekendDay } from '../hooks/useProgressTracking'
import { useAppStore } from '../store/useAppStore'
import { MEASURE_FIELDS } from '../data/body'
import { PROGRAM } from '../data/program'
import { progressionPlan } from '../lib/doubleProgression'
import { sessionVolume, formatKg } from '../lib/metrics'
import { sfx } from '../lib/sound'

const PERIODOS = [
  { id: 'semana', label: 'Semana', days: 7 },
  { id: 'mes', label: 'Mês', days: 30 },
  { id: 'trimestre', label: '3 meses', days: 133 },
]

function LimaChart({ data = [], unit = '' }) {
  const W = 336
  const H = 165
  if (data.length < 2) {
    return <p className="mt-[18px] text-[12px] text-muted-foreground">Registre mais treinos para ver o gráfico.</p>
  }
  const vals = data.map((d) => d.y)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const L = 44
  const R = 12
  const T = 12
  const B = 30
  const iw = W - L - R
  const ih = H - T - B
  const px = (i) => (data.length === 1 ? L + iw / 2 : L + (i / (data.length - 1)) * iw)
  const py = (v) => T + ih - ((v - min) / span) * ih
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ')
  const area = `${line} L${px(data.length - 1).toFixed(1)},${(H - B).toFixed(1)} L${px(0).toFixed(1)},${(H - B).toFixed(1)} Z`
  const ticks = [max, min + span / 2, min]
  const fmtTick = (v) => `${Number(v.toFixed(v >= 100 ? 0 : 1))}${unit}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mt-[18px]" role="img" aria-label="Gráfico de evolução">
      <defs>
        <linearGradient id="area-progresso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d2f27b" stopOpacity=".18" />
          <stop offset="100%" stopColor="#d2f27b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#323b34" strokeWidth="1">
        {ticks.map((tk, i) => (
          <path key={i} d={`M${L} ${py(tk).toFixed(1)}H${W - R}`} />
        ))}
      </g>
      {ticks.map((tk, i) => (
        <text key={i} x="0" y={(py(tk) + 3.5).toFixed(1)} style={{ fill: '#a0aba2', font: '10px Inter, sans-serif' }}>{fmtTick(tk)}</text>
      ))}
      <path d={area} fill="url(#area-progresso)" />
      <path d={line} fill="none" stroke="#d2f27b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1].y)} r="5" fill="#d2f27b" stroke="#1c211e" strokeWidth="2" />
      <text x={L} y={H - 8} style={{ fill: '#a0aba2', font: '10px Inter, sans-serif' }}>D{data[0].x}</text>
      <text x={W - R} y={H - 8} textAnchor="end" style={{ fill: '#a0aba2', font: '10px Inter, sans-serif' }}>D{data[data.length - 1].x}</text>
    </svg>
  )
}

export default function Progresso() {
  const p = useProgressTracking()
  const setViewDay = useAppStore((s) => s.setViewDay)
  const setTab = useAppStore((s) => s.setTab)
  const logBody = useAppStore((s) => s.logBody)
  const startDate = useAppStore((s) => s.startDate)
  const day = p.displayDay

  const [periodo, setPeriodo] = useState('mes')
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(id)
  }, [])

  const windowDays = PERIODOS.find((x) => x.id === periodo)?.days ?? 30
  const from = Math.max(1, p.currentDay - windowDays + 1)

  const trainedDays = useMemo(() => {
    const out = []
    for (let d = from; d <= p.currentDay; d++) {
      const log = p.days[d]
      if (log?.workoutDone || (log?.sets ?? []).length > 0) out.push(d)
    }
    return out
  }, [p, from])

  const freq = useMemo(() => {
    let uteis = 0
    for (let d = from; d <= p.currentDay; d++) {
      if (!isWeekendDay(startDate, d)) uteis++
    }
    const done = trainedDays.filter((d) => !isWeekendDay(startDate, d)).length
    return uteis ? Math.round((done / uteis) * 100) : 0
  }, [trainedDays, from, p.currentDay, startDate])

  const prevFreq = 0

  // Série de força: exercício com maior evolução de carga na janela
  const strength = useMemo(() => {
    const byEx = {}
    for (let d = from; d <= p.currentDay; d++) {
      for (const s of p.days[d]?.sets ?? []) {
        if (!(s.load > 0)) continue
        if (!byEx[s.exercise]) byEx[s.exercise] = []
        byEx[s.exercise].push({ x: d, y: Number(s.load) })
      }
    }
    let best = null
    for (const [ex, pts] of Object.entries(byEx)) {
      const ys = pts.map((q) => q.y)
      const gain = Math.max(...ys) - Math.min(...ys)
      const last = pts[pts.length - 1].y
      // média por dia para o gráfico
      const perDay = []
      const seen = {}
      for (const q of pts) {
        seen[q.x] = seen[q.x] ? Math.max(seen[q.x], q.y) : q.y
      }
      for (const [x, y] of Object.entries(seen)) perDay.push({ x: Number(x), y })
      perDay.sort((a, b) => a.x - b.x)
      if (perDay.length >= 2 && (!best || gain > best.gain)) best = { ex, gain, last, perDay }
    }
    return best
  }, [p, from])

  const weightSeries = useMemo(() => {
    const pts = []
    for (let d = from; d <= p.currentDay; d++) {
      const w = p.days[d]?.weight
      if (Number(w) > 0) pts.push({ x: d, y: Number(w) })
    }
    return pts
  }, [p, from])

  const chart = strength?.perDay?.length >= 2
    ? { title: strength.ex, sub: 'maior carga do dia', unit: ' kg', data: strength.perDay, gain: `+${Number(strength.gain.toFixed(1))} kg` }
    : { title: 'Peso corporal', sub: 'balança em jejum', unit: ' kg', data: weightSeries, gain: weightSeries.length >= 2 ? `${Number((weightSeries[weightSeries.length - 1].y - weightSeries[0].y).toFixed(1))} kg` : '—' }

  const history = useMemo(() => {
    const out = []
    for (let d = p.currentDay; d >= 1; d--) {
      const sets = p.days[d]?.sets ?? []
      if (!sets.length && !p.days[d]?.workoutDone) continue
      const exs = new Set(sets.map((s) => s.exercise)).size
      out.push({ d, n: Math.max(exs, 1), vol: sessionVolume(sets), done: !!p.days[d]?.workoutDone })
      if (out.length >= (showAll ? 10 : 3)) break
    }
    return out
  }, [p, showAll])

  const maxVol = useMemo(() => {
    let m = 0
    for (let d = 1; d < p.currentDay; d++) m = Math.max(m, sessionVolume(p.days[d]?.sets ?? []))
    return m
  }, [p])

  // Próximas cargas: peso guardado por exercício → quanto pegar semana que vem
  const nextLoads = useMemo(() => {
    const allSets = Object.values(p.days ?? {}).flatMap((d) => (Array.isArray(d?.sets) ? d.sets : []))
    const out = []
    for (const plan of Object.values(PROGRAM)) {
      for (const ex of plan.exercises) {
        const pp = progressionPlan(allSets, { exerciseName: ex.name, exerciseType: ex.type, baseLoad: 0 })
        if (pp.hasHistory) out.push({ name: ex.name, dayKey: plan.key, ...pp })
      }
    }
    out.sort((a, b) => (b.lastDay ?? 0) - (a.lastDay ?? 0))
    return out
  }, [p])

  const weightHistory = useMemo(() => {
    const pts = []
    for (let d = p.currentDay; d >= 1 && pts.length < 5; d--) {
      const w = p.days[d]?.weight
      if (Number(w) > 0) pts.push({ d, w: Number(w) })
    }
    return pts
  }, [p])

  const val = (id) => form[id] ?? (p.days[day]?.[id] ?? '')
  const save = () => {
    const payload = {}
    for (const f of MEASURE_FIELDS) {
      const n = Number(String(form[f.id] ?? p.days[day]?.[f.id] ?? '').replace(',', '.'))
      if (n > 0) payload[f.id] = n
    }
    if (!Object.keys(payload).length) return
    logBody(day, payload)
    sfx.success()
    setForm({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const MesLabel = (d) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - (p.currentDay - d))
    try {
      return dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
    } catch {
      return ''
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-[18px]" aria-label="Carregando evolução">
        <div className="animate-pulse rounded-[20px] bg-card h-40" />
        <div className="animate-pulse rounded-[20px] bg-card h-56" />
      </div>
    )
  }

  return (
    <>
      {/* Período */}
      <div className="flex gap-1 p-1 bg-card rounded-[10px]" aria-label="Período exibido">
        {PERIODOS.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setPeriodo(q.id)}
            className={`flex-1 min-h-[44px] rounded-[10px] text-[11px] font-semibold active:scale-95 ${periodo === q.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-[20px] bg-card p-[16px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[34px] font-bold tabular-nums">{trainedDays.length}</span>
            <span className="text-primary text-[24px]" aria-hidden="true">⚒</span>
          </div>
          <p className="mt-[5px] text-[12px] text-muted-foreground">treinos feitos</p>
          <small className="block mt-[6px] text-[10px] text-primary tabular-nums">
            {trainedDays.length > 0 ? `${trainedDays.length} neste período` : 'Bora fazer o primeiro?'}
          </small>
        </article>
        <article className="rounded-[20px] bg-card p-[16px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[34px] font-bold tabular-nums">{freq}%</span>
            <span className="text-primary text-[24px]" aria-hidden="true">▦</span>
          </div>
          <p className="mt-[5px] text-[12px] text-muted-foreground">de frequência</p>
          <small className="block mt-[6px] text-[10px] text-primary">
            {freq >= prevFreq ? 'Sua rotina está crescendo' : 'Vamos retomar o ritmo'}
          </small>
        </article>
      </div>

      {/* Gráfico */}
      <article className="rounded-[20px] bg-card p-[16px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px]">{strength ? 'Mais força, aos poucos' : 'Evolução do peso'}</h2>
            <p className="mt-[5px] text-[11px] text-muted-foreground truncate">{chart.title} · {chart.sub}</p>
          </div>
          <span className="text-[12px] font-semibold text-primary tabular-nums">{chart.gain}</span>
        </div>
        <LimaChart data={chart.data} unit={chart.unit} />
      </article>

      {/* Próximas cargas — quanto pegar semana que vem */}
      <section aria-labelledby="titulo-cargas">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[18px]" id="titulo-cargas">Quanto pegar semana que vem</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">{nextLoads.length} com histórico</span>
        </div>
        {nextLoads.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Salve as cargas no Treino (kg + reps de cada série) que aqui aparece a meta da próxima semana.</p>
        ) : (
          <div className="grid gap-2">
            {nextLoads.slice(0, showAll ? 20 : 5).map((n) => (
              <article key={`${n.dayKey}-${n.name}`} className="rounded-2xl bg-card p-3">
                <p className="text-[13px] font-semibold truncate">{n.name} <span className="text-muted-foreground font-normal">· {n.dayKey}</span></p>
                <p className="mt-1 text-[12px] tabular-nums">
                  Última: <b>{n.lastLoad}kg × {n.lastRepsLabel}</b> <span className="text-muted-foreground">(D{n.lastDay})</span>
                  {' → '}Agora: <b className="text-primary">{n.suggested}kg</b>
                  {' → '}Se bater o teto: <b className="text-primary">{n.nextIfTop}kg</b>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.progressed ? '✓ Teto batido — já subiu.' : 'Busque o teto de reps em todas as séries antes de subir.'}</p>
              </article>
            ))}
          </div>
        )}
        {weightHistory.length > 0 && (
          <div className="mt-2 rounded-2xl bg-card p-3">
            <p className="text-[13px] font-semibold">Peso guardado ⚖️</p>
            <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
              {weightHistory.map((w) => `D${w.d}: ${w.w}kg`).join(' · ')}
            </p>
          </div>
        )}
      </section>

      {/* Últimos treinos */}
      <section aria-labelledby="titulo-historico">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[18px]" id="titulo-historico">Seus últimos treinos</h2>
          <button type="button" onClick={() => setShowAll(!showAll)} className="min-h-[44px] px-2 text-[12px] text-primary">
            {showAll ? 'Ver menos' : 'Ver todos'}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Nenhum treino registrado ainda. O primeiro conta mais.</p>
        ) : (
          <div className="grid gap-1">
            {history.map((h) => {
              const isRecord = h.vol > 0 && h.vol >= maxVol && maxVol > 0
              return (
                <button
                  key={h.d}
                  type="button"
                  onClick={() => {
                    setViewDay(h.d)
                    setTab('hoje')
                  }}
                  className="flex items-center gap-3 py-[7px] text-left active:scale-[0.99]"
                >
                  <span className="w-10 min-h-[42px] grid place-content-center text-center bg-card rounded-lg">
                    <strong className="text-[17px] font-medium tabular-nums">D{h.d}</strong>
                    <small className="mt-[3px] text-[9px] text-muted-foreground">{MesLabel(h.d)}</small>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate">Treino do dia {h.d} · {h.n} exercícios</span>
                    <span className="block mt-[5px] text-[11px] text-muted-foreground tabular-nums">{formatKg(h.vol)} de volume</span>
                  </span>
                  {isRecord ? (
                    <span className="text-[10px] text-primary font-semibold">Recorde</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{h.done ? 'Concluído' : 'Registrado'}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Conquista */}
      <article className="rounded-[20px] bg-accent p-[13px_16px] flex items-center gap-3">
        <span className="text-primary text-[24px]" aria-hidden="true">♙</span>
        <div>
          <h3 className="text-[14px] font-semibold tabular-nums">
            {p.streak >= 7 ? `${Math.floor(p.streak / 7)} semanas de consistência` : p.streak > 0 ? `${p.streak} dias de consistência` : 'Comece sua sequência hoje'}
          </h3>
          <p className="mt-[7px] text-[12px] text-muted-foreground">Seu maior progresso é continuar.</p>
        </div>
      </article>

      {/* Medidas */}
      <article className="rounded-[20px] bg-card p-[16px]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[18px]">Registrar medidas</h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">dia {day}</span>
        </div>
        {saved && <p className="mt-2 text-[12px] font-semibold text-primary">Medidas salvas no dia {day}.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {MEASURE_FIELDS.map((f) => (
            <label key={f.id} className="text-[12px] text-muted-foreground" title={f.tip}>
              {f.label} ({f.unit})
              <input
                type="number"
                step={f.step}
                inputMode="decimal"
                placeholder={f.placeholder}
                value={val(f.id)}
                onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                className="mt-1 min-h-[48px] w-full rounded-[10px] bg-secondary px-3 text-center text-[15px] font-semibold tabular-nums outline-none placeholder:text-muted-foreground"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          className="mt-3 w-full min-h-[48px] rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold active:scale-[0.99]"
        >
          Salvar medidas do dia {day}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Pode preencher só o que mediu hoje.</p>
      </article>
    </>
  )
}
