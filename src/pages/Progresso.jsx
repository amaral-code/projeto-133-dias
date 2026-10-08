import { useEffect, useMemo, useState } from 'react'
import { useProgressTracking, isDayComplete, isWeekendDay } from '../hooks/useProgressTracking'
import { useAppStore } from '../store/useAppStore'
import { MEASURE_FIELDS, normalizeBody } from '../data/body'
import { navyBF, avg1RM, sessionVolume, formatKg } from '../lib/metrics'
import { sfx } from '../lib/sound'
import { Icon } from '../components/ui'
import { SurfaceCard, MotionWrapper, MotionStagger, MotionItem, MetricBadge } from '../components/system'

function DeltaTag({ first, last, invert = false, unit = '' }) {
  if (first == null || last == null) return null
  const d = Number((last - first).toFixed(1))
  const good = d === 0 ? null : invert ? d < 0 : d > 0
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
        good == null
          ? 'border-white/10 text-zinc-500'
          : good
            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
            : 'border-red-400/20 bg-red-400/10 text-red-300'
      }`}
    >
      {d > 0 ? '+' : ''}
      {d}
      {unit}
    </span>
  )
}

/* Gráfico de área SVG limpo, estilo Tremor: grade sutil, eixo mono, sem gradiente colorido */
function AreaChart({ data = [], height = 160, stroke = '#e4e4e7', format }) {
  const W = 560
  const H = height
  const pad = { l: 44, r: 10, t: 10, b: 20 }
  const vals = data.map((d) => d.y)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const px = (i) => (data.length === 1 ? pad.l + iw / 2 : pad.l + (i / (data.length - 1)) * iw)
  const py = (v) => pad.t + ih - ((v - min) / span) * ih
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ')
  const area = `${line} L${px(data.length - 1).toFixed(1)},${(H - pad.b).toFixed(1)} L${px(0).toFixed(1)},${(H - pad.b).toFixed(1)} Z`
  const ticks = [0, 0.5, 1].map((t) => min + span * t)
  const fmt = format ?? ((v) => Number(v).toFixed(1))
  const last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Gráfico de evolução">
      {ticks.map((tk, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={py(tk)} y2={py(tk)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x={pad.l - 6} y={py(tk) + 3.5} textAnchor="end" fontSize="10" fill="#71717a" fontFamily="JetBrains Mono, monospace">
            {fmt(tk)}
          </text>
        </g>
      ))}
      <text x={pad.l} y={H - 5} fontSize="10" fill="#52525b" fontFamily="JetBrains Mono, monospace">D{data[0].x}</text>
      <text x={W - pad.r} y={H - 5} textAnchor="end" fontSize="10" fill="#52525b" fontFamily="JetBrains Mono, monospace">
        D{last.x}
      </text>
      <path d={area} fill="currentColor" opacity="0.07" className="text-zinc-100" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(data.length - 1)} cy={py(last.y)} r="3.5" fill={stroke} stroke="#1C211E" strokeWidth="1.5" />
    </svg>
  )
}

function BarsMini({ data = [], height = 120, bar = 'bg-emerald-400', format }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => (
          <div key={d.x} title={`${d.x}: ${format ? format(d.v) : d.v}`} className="group relative flex-1">
            <div
              className={`w-full rounded-sm ${bar} opacity-80 transition group-hover:opacity-100`}
              style={{ height: `${Math.max(4, (d.v / max) * height)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-zinc-600">
        <span>{data[0]?.x}</span>
        <span>{data[data.length - 1]?.x}</span>
      </div>
    </div>
  )
}

function EvolucaoSkeleton() {
  const b = 'animate-pulse rounded-xl border border-white/[0.08] bg-[#1C211E]/60'
  return (
    <div className="space-y-[18px]" aria-label="Carregando evolução">
      <div className={`${b} h-64`} />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        <div className={`${b} h-48 lg:col-span-2`} />
        <div className={`${b} h-48 lg:col-span-4`} />
        <div className={`${b} h-56 lg:col-span-4`} />
        <div className={`${b} h-56 lg:col-span-2`} />
      </div>
    </div>
  )
}

const INVERT = new Set(['weight', 'waist', 'hip'])

export default function Progresso() {
  const p = useProgressTracking()
  const setViewDay = useAppStore((s) => s.setViewDay)
  const setTab = useAppStore((s) => s.setTab)
  const logBody = useAppStore((s) => s.logBody)
  const startDate = useAppStore((s) => s.startDate)
  const user = useAppStore((s) => s.user)
  const day = p.displayDay
  const todayLog = normalizeBody(p.days[day] ?? {})

  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setBooting(false), 450)
    return () => clearTimeout(id)
  }, [])

  const val = (id) => form[id] ?? (todayLog[id] ?? '')

  const save = () => {
    const payload = {}
    for (const f of MEASURE_FIELDS) {
      const raw = String(form[f.id] ?? todayLog[f.id] ?? '').replace(',', '.')
      const n = Number(raw)
      if (n > 0) payload[f.id] = n
    }
    if (!Object.keys(payload).length) return
    logBody(day, payload)
    sfx.success()
    setForm({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const series = useMemo(() => {
    const pts = []
    for (let d = 1; d <= p.currentDay; d++) {
      const log = p.days[d]
      if (!log) continue
      const row = { dia: d }
      let any = false
      for (const f of MEASURE_FIELDS) {
        if (Number(log[f.id]) > 0) {
          row[f.id] = Number(log[f.id])
          any = true
        }
      }
      if (any) pts.push(row)
    }
    return pts
  }, [p])

  const firstLast = useMemo(() => {
    const out = {}
    for (const f of MEASURE_FIELDS) {
      const vals = series.map((r) => r[f.id]).filter((v) => v != null)
      if (vals.length >= 1) out[f.id] = { first: vals[0], last: vals[vals.length - 1], n: vals.length }
    }
    return out
  }, [series])

  const deficitSeries = useMemo(() => {
    const perDay = p.dietHits > 0 ? Math.round(p.weeklyDeficit / p.dietHits) : 410
    const weeks = []
    for (let w = 0; w < Math.ceil(p.currentDay / 7); w++) {
      let hits = 0
      for (let d = w * 7 + 1; d <= Math.min(p.currentDay, w * 7 + 7); d++) {
        if (p.days[d]?.missions?.[1]) hits++
      }
      weeks.push({ x: `S${w + 1}`, v: hits * perDay })
    }
    return weeks.length ? weeks : [{ x: 'S1', v: 0 }]
  }, [p])

  const heat = useMemo(
    () =>
      Array.from({ length: 133 }, (_, i) => {
        const d = i + 1
        if (d > p.currentDay) return { d, cls: 'future' }
        if (isWeekendDay(startDate, d)) return { d, cls: 'rest' }
        return { d, cls: isDayComplete(p.days, d) ? 'done' : d === p.currentDay ? 'today' : 'missed' }
      }),
    [p, startDate]
  )
  const clsMap = {
    done: 'bg-emerald-400 hover:bg-emerald-300',
    missed: 'bg-red-400/60 hover:bg-red-400',
    today: 'bg-primary ring-2 ring-primary/40 hover:bg-primary/90',
    future: 'bg-white/[0.05]',
    rest: 'bg-sky-400/70 hover:bg-sky-400',
  }
  const heatDone = heat.filter((h) => h.cls === 'done').length
  const heatPct = Math.round((heatDone / 133) * 100)

  const volumeSeries = useMemo(() => {
    const pts = []
    for (let d = 1; d <= p.currentDay; d++) {
      const v = sessionVolume(p.days[d]?.sets ?? [])
      if (v > 0) pts.push({ x: `D${d}`, v })
    }
    return pts
  }, [p])

  const weightData = series.filter((r) => r.weight != null).map((r) => ({ x: r.dia, y: r.weight }))
  const waistData = series.filter((r) => r.waist != null).map((r) => ({ x: r.dia, y: r.waist }))
  const hipData = series.filter((r) => r.hip != null).map((r) => ({ x: r.dia, y: r.hip }))
  const armData = series.filter((r) => r.armR != null).map((r) => ({ x: r.dia, y: r.armR }))

  const bfData = useMemo(() => {
    const pts = []
    let waist = null
    let neck = null
    for (let d = 1; d <= p.currentDay; d++) {
      const log = p.days[d]
      if (!log) continue
      if (Number(log.waist) > 0) waist = Number(log.waist)
      if (Number(log.neck) > 0) neck = Number(log.neck)
      const bf = navyBF({
        sex: user.sex,
        waistCm: waist,
        neckCm: neck,
        hipCm: Number(log.hip) || undefined,
        heightCm: user.height,
      })
      if (bf != null && (Number(log.waist) > 0 || Number(log.neck) > 0)) pts.push({ x: d, y: bf })
    }
    return pts
  }, [p, user])

  const rmList = useMemo(() => {
    const best = {}
    for (let d = 1; d <= p.currentDay; d++) {
      for (const s of p.days[d]?.sets ?? []) {
        if (!(s.load > 0 && s.repsDone >= 1 && s.repsDone <= 10)) continue
        const cur = best[s.exercise]
        if (!cur || s.load > cur.load || (s.load === cur.load && s.repsDone > cur.reps)) {
          best[s.exercise] = { load: s.load, reps: s.repsDone }
        }
      }
    }
    return Object.entries(best)
      .map(([ex, b]) => ({ ex, ...b, rm: avg1RM(b.load, b.reps) }))
      .filter((x) => x.rm != null)
      .sort((a, b) => b.rm - a.rm)
  }, [p])

  const history = [...series].reverse().slice(0, showAll ? 20 : 5)
  const heroStats = [
    { label: 'streak', value: `${p.streak}d` },
    { label: 'xp · nível', value: `${p.xp} · Nv ${p.level}` },
    { label: 'dieta', value: `${p.dietRate}%` },
    { label: 'déficit acum.', value: `${(p.weeklyDeficit / 1000).toFixed(1)}k` },
  ]
  const bestVol = volumeSeries.length ? volumeSeries.reduce((a, b) => (b.v > a.v ? b : a)) : null

  if (booting) return <EvolucaoSkeleton />

  return (
    <div className="space-y-[18px]">
      {/* HERO — linha do tempo 133 dias */}
      <MotionWrapper delay={0}>
        <SurfaceCard hoverGlow={false}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label">Evolução · 133 dias</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                Dia <span className="font-mono tabular-nums text-primary">{p.currentDay}</span>
                <span className="text-base font-medium text-zinc-500"> / 133</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MetricBadge tone="green" value={`${heatDone}/133 · ${heatPct}%`} />
              <button
                onClick={() => setTab('treino')}
                className="h-9 rounded-md bg-primary px-3.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
              >
                Treinar hoje
              </button>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(p.currentDay / 133) * 100}%` }} />
          </div>

          <MotionStagger className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4" gap={0.05}>
            {heroStats.map((s) => (
              <MotionItem key={s.label} className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2.5">
                <p className="label">{s.label}</p>
                <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">{s.value}</p>
              </MotionItem>
            ))}
          </MotionStagger>

          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <div className="mb-2 flex flex-wrap gap-3 font-mono text-[10px] tabular-nums text-zinc-500">
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />feito</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400/60" />pendente</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />hoje</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-400/70" />descanso</span>
              <span className="ml-auto hidden sm:inline">toque p/ revisar o dia</span>
            </div>
            <div className="grid grid-cols-[repeat(19,minmax(0,1fr))] gap-1">
              {heat.map((c) => (
                <button
                  key={c.d}
                  title={`Dia ${c.d}`}
                  disabled={c.cls === 'future'}
                  onClick={() => {
                    setViewDay(c.d)
                    setTab('hoje')
                  }}
                  className={`aspect-square min-h-[18px] rounded-[4px] transition active:scale-90 disabled:cursor-default ${clsMap[c.cls]}`}
                />
              ))}
            </div>
          </div>
        </SurfaceCard>
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
        {/* DESTAQUES — 2 cols */}
        <MotionWrapper className="lg:col-span-2" delay={0.04}>
          <SurfaceCard className="h-full">
            <div className="flex items-center gap-2">
              <Icon name="trophy" size={15} className="text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-tight">Destaques</h3>
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-3">
                <p className="label">Maior volume</p>
                <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">
                  {bestVol ? formatKg(bestVol.v) : '—'}
                  {bestVol && <span className="ml-1.5 text-xs text-zinc-500">· {bestVol.x}</span>}
                </p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-3">
                <p className="label">Maior 1RM</p>
                <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">
                  {rmList.length ? `${rmList[0].rm} kg` : '—'}
                </p>
                {rmList.length > 0 && <p className="truncate text-xs text-zinc-500">{rmList[0].ex}</p>}
              </div>
              <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-3">
                <p className="label">Sessões com carga</p>
                <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">{volumeSeries.length}</p>
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* MEDIDAS — 4 cols */}
        <MotionWrapper className="lg:col-span-4" delay={0.06}>
          <SurfaceCard className="h-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="ruler" size={15} className="text-zinc-500" />
                <h3 className="text-sm font-semibold tracking-tight">
                  Medidas do dia <span className="font-mono tabular-nums">{day}</span>
                </h3>
              </div>
              <button
                onClick={() => setTipOpen(!tipOpen)}
                className="min-h-[36px] rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
              >
                como medir?
              </button>
            </div>
            {tipOpen && (
              <div className="mt-2 space-y-1 rounded-md border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-200/90">
                <p><b>Meça 1x/semana</b>, sempre igual: em jejum, após o banheiro, relaxado.</p>
                <p>Cintura no umbigo · Quadril na parte mais larga · Braço contraído no pico.</p>
                <p>Peso todo dia de manhã; demais medidas 1x/semana bastam.</p>
              </div>
            )}
            {saved && <p className="mt-2 text-xs font-medium text-emerald-300">Medidas salvas no dia {day}.</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MEASURE_FIELDS.map((f) => (
                <label key={f.id} className="text-xs font-medium text-zinc-400" title={f.tip}>
                  <span className="font-mono tabular-nums">{f.label} ({f.unit})</span>
                  <input
                    type="number"
                    step={f.step}
                    inputMode="decimal"
                    placeholder={f.placeholder}
                    value={val(f.id)}
                    onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                    className="mt-1 min-h-[48px] w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-center font-mono text-base tabular-nums outline-none transition-colors placeholder:text-zinc-700 hover:border-white/[0.14] focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={save}
              className="mt-3 min-h-[48px] w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              Salvar medidas do dia {day}
            </button>
            <p className="mt-1 text-center text-[11px] text-zinc-600">Pode preencher só o que mediu hoje — o resto fica guardado.</p>
          </SurfaceCard>
        </MotionWrapper>

        {/* PESO — 4 cols */}
        <MotionWrapper className="lg:col-span-4" delay={0.08}>
          <SurfaceCard className="h-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="scale" size={15} className="text-zinc-500" />
                <h3 className="text-sm font-semibold tracking-tight">Peso corporal</h3>
              </div>
              {firstLast.weight && (
                <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-zinc-400">
                  <span>{firstLast.weight.first} → {firstLast.weight.last}kg</span>
                  <DeltaTag first={firstLast.weight.first} last={firstLast.weight.last} invert unit="kg" />
                </div>
              )}
            </div>
            {weightData.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Registre seu peso acima para ver o gráfico.</p>
            ) : (
              <div className="mt-2">
                <AreaChart data={weightData} stroke="#7AC74F" format={(v) => `${Number(v).toFixed(1)}`} />
                <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-600">{weightData.length} pesagens</p>
              </div>
            )}
          </SurfaceCard>
        </MotionWrapper>

        {/* COMPARATIVO — 2 cols */}
        <MotionWrapper className="lg:col-span-2" delay={0.1}>
          <SurfaceCard className="h-full">
            <div className="flex items-center gap-2">
              <Icon name="chart" size={15} className="text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-tight">Início → atual</h3>
            </div>
            {Object.keys(firstLast).length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Sem medidas ainda.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {MEASURE_FIELDS.filter((f) => firstLast[f.id]).slice(0, 7).map((f) => {
                  const e = firstLast[f.id]
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-white/[0.03]">
                      <span className="text-xs text-zinc-400">{f.label}</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-zinc-200">
                        {e.first}→{e.last}
                        <DeltaTag first={e.first} last={e.last} invert={INVERT.has(f.id)} unit={f.unit} />
                      </span>
                    </div>
                  )
                })}
                <p className="pt-1 font-mono text-[10px] tabular-nums text-zinc-600">n = nº de registros por medida</p>
              </div>
            )}
          </SurfaceCard>
        </MotionWrapper>

        {/* CINTURA/QUADRIL — 4 cols */}
        <MotionWrapper className="lg:col-span-4" delay={0.1}>
          <SurfaceCard className="h-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="ruler" size={15} className="text-zinc-500" />
                <h3 className="text-sm font-semibold tracking-tight">Cintura e quadril</h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-zinc-500">
                <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-blue-400" />cintura</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-zinc-500" />quadril</span>
              </div>
            </div>
            {waistData.length === 0 && hipData.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Sem medidas ainda — registre a cintura 1x/semana.</p>
            ) : (
              <div className="mt-2 space-y-[18px]">
                {waistData.length > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="label">Cintura (cm)</p>
                      {firstLast.waist && <DeltaTag first={firstLast.waist.first} last={firstLast.waist.last} invert unit="cm" />}
                    </div>
                    <AreaChart data={waistData} stroke="#60a5fa" format={(v) => `${Number(v).toFixed(0)}`} />
                  </div>
                )}
                {hipData.length > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="label">Quadril (cm)</p>
                      {firstLast.hip && <DeltaTag first={firstLast.hip.first} last={firstLast.hip.last} invert unit="cm" />}
                    </div>
                    <AreaChart data={hipData} height={110} stroke="#a1a1aa" format={(v) => `${Number(v).toFixed(0)}`} />
                  </div>
                )}
              </div>
            )}
          </SurfaceCard>
        </MotionWrapper>

        {/* BF + BRAÇOS — 2 cols */}
        <MotionWrapper className="lg:col-span-2" delay={0.12}>
          <div className="flex h-full flex-col gap-3">
            <SurfaceCard>
              <div className="flex items-center gap-2">
                <Icon name="heart" size={15} className="text-zinc-500" />
                <h3 className="text-sm font-semibold tracking-tight">BF% Navy</h3>
              </div>
              {bfData.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">Cintura + pescoço para o BF% real.</p>
              ) : (
                <div className="mt-2">
                  <AreaChart data={bfData} height={110} stroke="#c084fc" format={(v) => `${Number(v).toFixed(1)}%`} />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono text-xs tabular-nums text-zinc-300">{bfData[bfData.length - 1].y.toFixed(1)}%</span>
                    <DeltaTag first={bfData[0].y} last={bfData[bfData.length - 1].y} invert unit="p.p." />
                  </div>
                </div>
              )}
            </SurfaceCard>
            <SurfaceCard>
              <h3 className="text-sm font-semibold tracking-tight">Braço D (cm)</h3>
              {armData.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">Sem medidas de braço ainda.</p>
              ) : (
                <div className="mt-2">
                  <AreaChart data={armData} height={110} stroke="#34d399" format={(v) => `${Number(v).toFixed(1)}`} />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono text-xs tabular-nums text-zinc-300">{armData[armData.length - 1].y.toFixed(1)}cm</span>
                    {firstLast.armR && <DeltaTag first={firstLast.armR.first} last={firstLast.armR.last} unit="cm" />}
                  </div>
                </div>
              )}
            </SurfaceCard>
          </div>
        </MotionWrapper>

        {/* VOLUME + DÉFICIT — 4 cols split */}
        <MotionWrapper className="lg:col-span-6" delay={0.12}>
          <SurfaceCard hoverGlow={false}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Volume por treino</h3>
                  <span className="font-mono text-[11px] tabular-nums text-zinc-500">{volumeSeries.length} sessões</span>
                </div>
                {volumeSeries.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">Registre séries com carga no Treino.</p>
                ) : (
                  <div className="mt-2">
                    <BarsMini data={volumeSeries} bar="bg-primary" format={(v) => formatKg(v)} />
                  </div>
                )}
              </div>
              <div className="border-t border-white/[0.08] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Déficit semanal est.</h3>
                  <MetricBadge tone="green" value={`${(p.weeklyDeficit / 1000).toFixed(1)}k kcal`} />
                </div>
                <div className="mt-2">
                  <BarsMini data={deficitSeries} bar="bg-emerald-400" format={(v) => `${v} kcal`} />
                </div>
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* FORÇA — 6 cols split */}
        <MotionWrapper className="lg:col-span-6" delay={0.14}>
          <SurfaceCard hoverGlow={false}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="zap" size={15} className="text-zinc-500" />
                  <h3 className="text-sm font-semibold tracking-tight">1RM estimado</h3>
                </div>
                {rmList.length === 0 && <p className="mt-2 text-xs text-zinc-500">Conclua séries com carga no Treino.</p>}
                <div className="mt-1">
                  {rmList.slice(0, 8).map((r) => (
                    <div key={r.ex} className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-2 text-xs transition-colors hover:bg-white/[0.03]">
                      <span className="min-w-0 truncate font-medium text-zinc-300">{r.ex}</span>
                      <span className="shrink-0 font-mono tabular-nums text-zinc-500">
                        {r.load}kg×{r.reps} → <b className="text-primary">{r.rm}kg</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/[0.08] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="flex items-center gap-2">
                  <Icon name="chart" size={15} className="text-zinc-500" />
                  <h3 className="text-sm font-semibold tracking-tight">Evolução de cargas</h3>
                </div>
                {Object.keys(p.loadEvolution).length === 0 && <p className="mt-2 text-xs text-zinc-500">Conclua séries no Treino.</p>}
                <div className="mt-1">
                  {Object.entries(p.loadEvolution).slice(0, 8).map(([ex, e]) => (
                    <div key={ex} className="flex items-center justify-between gap-2 border-b border-white/[0.06] py-2 text-xs transition-colors hover:bg-white/[0.03]">
                      <span className="min-w-0 truncate font-medium text-zinc-300">{ex}</span>
                      <span className="shrink-0 font-mono tabular-nums text-zinc-500">
                        {e.first} → <b className="text-emerald-300">{e.last}kg ({e.delta >= 0 ? '+' : ''}{e.delta})</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SurfaceCard>
        </MotionWrapper>

        {/* HISTÓRICO — 6 cols */}
        {history.length > 0 && (
          <MotionWrapper className="lg:col-span-6" delay={0.14}>
            <SurfaceCard hoverGlow={false}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="calendar" size={15} className="text-zinc-500" />
                  <h3 className="text-sm font-semibold tracking-tight">Histórico</h3>
                </div>
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="min-h-[36px] rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  {showAll ? 'ver menos' : 'ver mais'}
                </button>
              </div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left font-mono tabular-nums text-zinc-600">
                      <th className="py-1 pr-2 font-medium">Dia</th>
                      <th className="pr-2 font-medium">Peso</th>
                      <th className="pr-2 font-medium">Cint.</th>
                      <th className="pr-2 font-medium">Braço D/E</th>
                      <th className="font-medium">Peito</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular-nums">
                    {history.map((r) => (
                      <tr key={r.dia} className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]">
                        <td className="py-2 pr-2 font-semibold text-zinc-200">D{r.dia}</td>
                        <td className="pr-2 text-zinc-400">{r.weight ? `${r.weight}kg` : '—'}</td>
                        <td className="pr-2 text-zinc-400">{r.waist ? `${r.waist}cm` : '—'}</td>
                        <td className="pr-2 text-zinc-400">{r.armR || r.armL ? `${r.armR ?? '—'}/${r.armL ?? '—'}` : '—'}</td>
                        <td className="text-zinc-400">{r.chest ? `${r.chest}cm` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </MotionWrapper>
        )}
      </div>
    </div>
  )
}
