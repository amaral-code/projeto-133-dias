import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useProgressTracking, isDayComplete, isWeekendDay } from '../hooks/useProgressTracking'
import { useAppStore } from '../store/useAppStore'
import { MEASURE_FIELDS, normalizeBody } from '../data/body'
import { navyBF, avg1RM, sessionVolume } from '../lib/metrics'

function delta(first, last, invert = false, unit = '') {
  if (first == null || last == null) return null
  const d = Number((last - first).toFixed(1))
  const good = invert ? d < 0 : d > 0
  const neutral = d === 0
  return { d, txt: `${d > 0 ? '+' : ''}${d}${unit}`, cls: neutral ? 'opacity-50' : good ? 'text-emerald-500' : 'text-red-400' }
}

export default function Progresso() {
  const p = useProgressTracking()
  const setViewDay = useAppStore((s) => s.setViewDay)
  const setTab = useAppStore((s) => s.setTab)
  const logBody = useAppStore((s) => s.logBody)
  const day = p.displayDay
  const todayLog = normalizeBody(p.days[day] ?? {})

  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

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
        if (Number(log[f.id]) > 0) { row[f.id] = Number(log[f.id]); any = true }
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
      for (let d = w * 7 + 1; d <= Math.min(p.currentDay, w * 7 + 7); d++) if (p.days[d]?.missions?.[1]) hits++
      weeks.push({ semana: `S${w + 1}`, deficit: hits * perDay })
    }
    return weeks.length ? weeks : [{ semana: 'S1', deficit: 0 }]
  }, [p])

  const startDate = useAppStore((s) => s.startDate)
  const heat = useMemo(() => Array.from({ length: 133 }, (_, i) => {
    const d = i + 1
    if (d > p.currentDay) return { d, cls: 'future' }
    if (isWeekendDay(startDate, d)) return { d, cls: 'rest' }
    return { d, cls: isDayComplete(p.days, d) ? 'done' : (d === p.currentDay ? 'today' : 'missed') }
  }), [p, startDate])

  const clsMap = {
    done: 'bg-emerald-500', missed: 'bg-red-400/70', today: 'bg-orange-500 ring-2 ring-orange-300', future: 'bg-slate-200 dark:bg-slate-800', rest: 'bg-sky-300 dark:bg-sky-900'
  }

  // Volume (kg) por dia de treino
  const volumeSeries = useMemo(() => {
    const pts = []
    for (let d = 1; d <= p.currentDay; d++) {
      const v = sessionVolume(p.days[d]?.sets ?? [])
      if (v > 0) pts.push({ dia: d, volume: v })
    }
    return pts
  }, [p])

  const weightChart = series.filter((r) => r.weight != null).map((r) => ({ dia: r.dia, peso: r.weight }))
  const waistChart = series.filter((r) => r.waist != null).map((r) => ({ dia: r.dia, cintura: r.waist, quadril: r.hip ?? null }))
  const armChart = series.filter((r) => r.armR != null || r.armL != null).map((r) => ({ dia: r.dia, bracoD: r.armR ?? null, bracoE: r.armL ?? null }))

  // % gordura (Navy) por dia medido — usa a última cintura/pescoço registrados
  const user = useAppStore((s) => s.user)
  const bfChart = useMemo(() => {
    const pts = []
    let waist = null, neck = null
    for (let d = 1; d <= p.currentDay; d++) {
      const log = p.days[d]
      if (!log) continue
      if (Number(log.waist) > 0) waist = Number(log.waist)
      if (Number(log.neck) > 0) neck = Number(log.neck)
      const bf = navyBF({ sex: user.sex, waistCm: waist, neckCm: neck, hipCm: Number(log.hip) || undefined, heightCm: user.height })
      if (bf != null && (Number(log.waist) > 0 || Number(log.neck) > 0)) pts.push({ dia: d, bf })
    }
    return pts
  }, [p, user])

  // 1RM estimado (média Epley+Brzycki) a partir do melhor set de cada exercício
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['🔥 Streak', `${p.streak}d`], ['⚡ XP / Nível', `${p.xp} • Nv ${p.level}`], ['🎯 Dieta', `${p.dietRate}%`], ['📉 Déficit acum.', `${(p.weeklyDeficit / 1000).toFixed(1)}k kcal`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-white dark:bg-[#1E293B] p-4"><p className="text-xs opacity-60 font-bold">{l}</p><p className="text-2xl font-black">{v}</p></div>
        ))}
      </div>

      {(volumeSeries.length > 0 || rmList.length > 0) && (
        <div className="rounded-2xl border bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 p-5">
          <h3 className="font-extrabold">🏆 Destaques</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-sm">
            {volumeSeries.length > 0 && (() => {
              const best = volumeSeries.reduce((a, b) => (b.volume > a.volume ? b : a))
              return <div className="rounded-xl bg-white/60 dark:bg-slate-900/50 border p-3"><p className="text-[11px] font-bold opacity-60">MAIOR VOLUME</p><p className="font-black">{best.volume.toLocaleString('pt-BR')} kg <span className="font-medium opacity-60 text-xs">• dia {best.dia}</span></p></div>
            })()}
            {rmList.length > 0 && (
              <div className="rounded-xl bg-white/60 dark:bg-slate-900/50 border p-3"><p className="text-[11px] font-bold opacity-60">MAIOR 1RM</p><p className="font-black">{rmList[0].rm} kg <span className="font-medium opacity-60 text-xs">• {rmList[0].ex.split(' ').slice(0, 3).join(' ')}</span></p></div>
            )}
            <div className="rounded-xl bg-white/60 dark:bg-slate-900/50 border p-3"><p className="text-[11px] font-bold opacity-60">TREINOS REGISTRADOS</p><p className="font-black">{volumeSeries.length} <span className="font-medium opacity-60 text-xs">sessões com carga</span></p></div>
          </div>
        </div>
      )}

      {/* REGISTRAR MEDIDAS */}
      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-extrabold">📏 Medidas do dia {day}</h3>
          <button onClick={() => setTipOpen(!tipOpen)} className="text-xs font-bold text-orange-500 min-h-[36px] px-2">como medir?</button>
        </div>
        {tipOpen && (
          <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-1">
            <p>🎯 <b>Meça 1x/semana</b>, sempre igual: em jejum, após o banheiro, relaxado.</p>
            <p>📏 Cintura no umbigo • Quadril na parte mais larga • Braço contraído no pico.</p>
            <p>⚖️ Peso todo dia de manhã; demais medidas 1x/semana bastam.</p>
          </div>
        )}
        {saved && <p className="text-xs font-bold text-emerald-500 mt-1">✓ Medidas salvas no dia {day}!</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {MEASURE_FIELDS.map((f) => (
            <label key={f.id} className="text-xs font-bold" title={f.tip}>
              <span>{f.icon} {f.label} ({f.unit})</span>
              <input type="number" step={f.step} inputMode="decimal" placeholder={f.placeholder}
                value={val(f.id)} onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                className="mt-1 w-full min-h-[52px] px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border font-black text-center text-base" />
            </label>
          ))}
        </div>
        <button onClick={save} className="mt-3 w-full min-h-[52px] rounded-xl bg-orange-500 text-white font-black active:scale-95">✓ Salvar medidas do dia {day}</button>
        <p className="text-[11px] opacity-50 mt-1 text-center">Pode preencher só o que mediu hoje — o resto fica guardado.</p>
      </div>

      {/* RESUMO COMPARATIVO */}
      {Object.keys(firstLast).length > 0 && (
        <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
          <h3 className="font-extrabold">🔄 Evolução (primeira → última)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {MEASURE_FIELDS.filter((f) => firstLast[f.id]).map((f) => {
              const e = firstLast[f.id]
              const inv = ['weight', 'waist', 'hip'].includes(f.id)
              const dl = delta(e.first, e.last, inv, f.unit)
              return (
                <div key={f.id} className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border p-3 text-center">
                  <p className="text-[11px] font-bold opacity-60">{f.icon} {f.label}</p>
                  <p className="font-black">{e.first} → {e.last}{f.unit}</p>
                  <p className={`text-xs font-black ${dl.cls}`}>{dl.txt} • {e.n}x</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">Mapa dos 133 dias <span className="text-xs font-medium opacity-50">(toque p/ revisar o dia)</span></h3>
        <div className="flex gap-3 text-[11px] opacity-60 mt-1 mb-2">
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />feito</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-red-400/70 inline-block" />pendente</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />hoje</span>
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-sky-300 inline-block" />descanso (sáb/dom)</span>
        </div>
        <div className="grid grid-cols-[repeat(19,minmax(0,1fr))] gap-1">
          {heat.map((c) => (
            <button key={c.d} title={`Dia ${c.d}`} disabled={c.cls === 'future'}
              onClick={() => { setViewDay(c.d); setTab('hoje') }}
              className={`aspect-square min-h-[20px] rounded-[4px] ${clsMap[c.cls]} disabled:cursor-default active:scale-90`} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">⚖️ Peso corporal</h3>
        {weightChart.length === 0
          ? <p className="text-xs opacity-60 mt-1">Registre seu peso acima para ver o gráfico. Ex: hoje {day}.</p>
          : <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={3} dot connectNulls name="Peso (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>}
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">📏 Cintura & Quadril (cm)</h3>
        {waistChart.length === 0
          ? <p className="text-xs opacity-60 mt-1">Sem medidas ainda — registre cintura 1x/semana.</p>
          : <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waistChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="cintura" stroke="#3B82F6" strokeWidth={3} dot connectNulls name="Cintura" />
                <Line type="monotone" dataKey="quadril" stroke="#A855F7" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls name="Quadril" />
              </LineChart>
            </ResponsiveContainer>
          </div>}
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">💪 Braços D/E (cm)</h3>
        {armChart.length === 0
          ? <p className="text-xs opacity-60 mt-1">Sem medidas de braço ainda.</p>
          : <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={armChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="bracoD" stroke="#16A34A" strokeWidth={3} dot connectNulls name="Braço D" />
                <Line type="monotone" dataKey="bracoE" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls name="Braço E" />
              </LineChart>
            </ResponsiveContainer>
          </div>}
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">🔥 % Gordura (US Navy)</h3>
        {bfChart.length === 0
          ? <p className="text-xs opacity-60 mt-1">Registre cintura + pescoço para ver seu BF% real (só fita métrica).</p>
          : <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bfChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="bf" stroke="#A855F7" strokeWidth={3} dot connectNulls name="BF %" />
              </LineChart>
            </ResponsiveContainer>
          </div>}
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold">🗂️ Histórico</h3>
            <button onClick={() => setShowAll(!showAll)} className="text-xs font-bold text-orange-500 min-h-[36px]">{showAll ? 'ver menos' : 'ver mais'}</button>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs">
              <thead><tr className="opacity-60 text-left">
                <th className="py-1 pr-2">Dia</th><th className="pr-2">Peso</th><th className="pr-2">Cint.</th><th className="pr-2">Braço D/E</th><th>Peito</th>
              </tr></thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.dia} className="border-t">
                    <td className="py-2 font-black">D{r.dia}</td>
                    <td>{r.weight ? `${r.weight}kg` : '—'}</td>
                    <td>{r.waist ? `${r.waist}cm` : '—'}</td>
                    <td>{r.armR || r.armL ? `${r.armR ?? '—'}/${r.armL ?? '—'}` : '—'}</td>
                    <td>{r.chest ? `${r.chest}cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">Déficit calórico semanal (estimado)</h3>
        <div className="h-48 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deficitSeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="semana" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="deficit" fill="#16A34A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold">🏋️ Volume por treino (kg totais)</h3>
        {volumeSeries.length === 0
          ? <p className="text-xs opacity-60 mt-1">Registre séries com carga no Treino para ver o volume.</p>
          : <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="volume" fill="#F97316" radius={[8, 8, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>}
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold mb-2">🏋️ Força máxima estimada (1RM · Epley+Brzycki)</h3>
        {rmList.length === 0 && <p className="text-xs opacity-60">Conclua séries com carga no Treino para ver seu 1RM estimado por exercício.</p>}
        {rmList.map((r) => (
          <div key={r.ex} className="text-xs flex justify-between border-b py-2">
            <span className="font-bold">{r.ex}</span>
            <span>melhor {r.load}kg×{r.reps} → <b className="text-orange-500">1RM {r.rm}kg</b></span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white dark:bg-[#1E293B] p-5">
        <h3 className="font-extrabold mb-2">Evolução de cargas (dupla progressão)</h3>
        {Object.keys(p.loadEvolution).length === 0 && <p className="text-xs opacity-60">Conclua séries no Treino para ver Δ de carga por exercício.</p>}
        {Object.entries(p.loadEvolution).map(([ex, e]) => (
          <div key={ex} className="text-xs flex justify-between border-b py-2"><span className="font-bold">{ex}</span><span>{e.first}kg → <b className="text-emerald-500">{e.last}kg ({e.delta >= 0 ? '+' : ''}{e.delta})</b> • {e.sessions} séries</span></div>
        ))}
      </div>
    </div>
  )
}
