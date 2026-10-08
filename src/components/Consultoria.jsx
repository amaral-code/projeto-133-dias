import { useMemo } from 'react'
import { lastMeasure } from '../data/body'
import { Icon } from './ui'
import {
  navyBF, bfCategory, ffmi, ffmiClass, whtr, whtrClass,
  hrZones, proteinTargets, cutPace, targetWeightForBF, weeksToGoal,
} from '../lib/metrics'

const TONE = {
  good: 'text-emerald-500', warn: 'text-amber-500', bad: 'text-red-500', mut: 'opacity-60',
}

function Row({ label, value, tone, sub }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b py-2 text-sm last:border-0">
      <span className="opacity-70">{label}</span>
      <span className="text-right">
        <b className={TONE[tone] ?? ''}>{value}</b>
        {sub && <span className="block text-[11px] opacity-50 font-normal">{sub}</span>}
      </span>
    </div>
  )
}

// Consultoria pessoal do Miguel: tudo derivado das medidas salvas no banco (days)
// + perfil. Sem digitar nada duas vezes; sem medidas → mostra o que falta medir.
export default function Consultoria({ user, days, currentDay, onGoMeasures }) {
  const m = useMemo(() => {
    const get = (id, fb) => lastMeasure(days, currentDay, id)?.value ?? fb ?? null
    const weight = get('weight', user.weight)
    const waist = get('waist')
    const neck = get('neck')
    const hip = get('hip')
    const restHr = get('restHr')
    const height = user.height ?? 167
    const sex = user.sex ?? 'M'

    const bf = navyBF({ sex, waistCm: waist, neckCm: neck, hipCm: hip, heightCm: height })
    const f = bf != null ? ffmi({ weightKg: weight, heightCm: height, bfPct: bf }) : null
    const w = whtr(waist, height)
    const zones = hrZones({ age: user.age ?? 19, restHr })
    const prot = proteinTargets(weight)
    const pace = cutPace(weight)
    const goalW = f ? targetWeightForBF(f.leanMass, 12) : null
    const weeks = goalW ? weeksToGoal(weight, goalW) : null

    const missing = []
    if (!waist) missing.push('cintura')
    if (!neck) missing.push('pescoço')
    if (!weight) missing.push('peso')
    return { weight, waist, neck, hip, restHr, height, sex, bf, f, w, zones, prot, pace, goalW, weeks, missing }
  }, [user, days, currentDay])

  const bfCat = bfCategory(m.bf, m.sex)
  const ffmiC = ffmiClass(m.f?.ffmi)
  const wC = whtrClass(m.w)

  return (
    <div className="rounded-lg border bg-card text-white p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-lg flex items-center gap-2"><span className="text-emerald-400"><Icon name="heart" size={20} /></span> Consultoria do {(user.name || 'Miguel').split(' ')[0]}</h3>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10">fórmulas validadas¹</span>
      </div>

      {m.missing.length > 0 && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
          <p className="font-bold">📏 Meça para liberar a consultoria completa — falta: <b>{m.missing.join(', ')}</b> (pescoço só 1x).</p>
          <button onClick={onGoMeasures} className="mt-2 min-h-[48px] w-full rounded-md bg-amber-500 text-slate-900 font-black active:scale-95">Ir para medidas</button>
        </div>
      )}

      {/* COMPOSIÇÃO */}
      <div className="rounded-md bg-white/5 border border-white/10 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-60">Composição (US Navy + Siri)</p>
        {m.bf != null ? (<>
          <p className="font-black text-3xl mt-1">{m.bf}<span className="text-base">% gordura</span> <span className={`text-sm font-bold ${TONE[bfCat.tone]}`}>• {bfCat.label}</span></p>
          <div className="mt-1">
            <Row label="Massa magra" value={`${m.f.leanMass} kg`} sub="músculo + ossos + água" />
            <Row label="Massa gorda" value={`${m.f.fatMass} kg`} />
            <Row label="FFMI normalizado" value={`${m.f.ffmi}`} tone={ffmiC.tone} sub={ffmiC.label} />
          </div>
        </>) : <p className="text-xs opacity-60 mt-1">Registre cintura + pescoço (+ peso) na Evolução.</p>}
      </div>

      {/* CINTURA */}
      <div className="rounded-md bg-white/5 border border-white/10 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-60">Cintura / altura (Ashwell · NICE)</p>
        {m.w != null ? (<>
          <p className="font-black text-2xl mt-1">{m.w} <span className={`text-sm font-bold ${TONE[wC.tone]}`}>• {wC.label}</span></p>
          <p className="text-xs opacity-70">Meta: cintura abaixo de <b>{(m.height / 2).toFixed(0)} cm</b> (metade da sua altura).</p>
        </>) : <p className="text-xs opacity-60 mt-1">Registre a cintura na Evolução.</p>}
      </div>

      {/* CORAÇÃO */}
      <div className="rounded-md bg-white/5 border border-white/10 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-60">Zonas de FC · {m.zones.method}</p>
        <p className="text-xs opacity-70">FC máx estimada {m.zones.max} bpm (Tanaka){m.restHr ? ` • repouso ${m.restHr} bpm` : ''}</p>
        <div className="mt-1">
          {m.zones.zones.map((z) => (
            <Row key={z.name} label={z.name} value={`${z.lo}–${z.hi} bpm`} />
          ))}
        </div>
        {!m.restHr && <p className="text-[11px] opacity-50 mt-1">💡 Registre a FC em repouso (Evolução → medidas) para zonas Karvonen personalizadas.</p>}
      </div>

      {/* PROTEÍNA + CUT */}
      <div className="rounded-md bg-white/5 border border-white/10 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-60">Proteína (ISSN) · {m.weight} kg</p>
        <Row label="Manutenção/ganho" value={`${m.prot.base[0]}–${m.prot.base[1]} g/dia`} sub="1,4–2,0 g/kg" />
        <Row label="Em cutting (você)" value={`${m.prot.cut[0]}–${m.prot.cut[1]} g/dia`} tone="good" sub="2,3–3,1 g/kg p/ reter massa magra" />
        <Row label="Por refeição" value={`${m.prot.perMeal[0]}–${m.prot.perMeal[1]} g`} sub="0,25 g/kg ou 20–40 g" />
      </div>

      {m.goalW != null && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">🎯 Projeção do cut</p>
          <p className="text-sm mt-1">Ritmo saudável: <b>{m.pace.min}–{m.pace.max} kg/sem</b> (0,5–1% do peso).</p>
          <p className="text-sm">Mantendo sua massa magra, <b>{m.goalW} kg ≈ 12% BF</b> em ~<b>{m.weeks} semanas</b>.</p>
        </div>
      )}

      <p className="text-[10px] opacity-40 leading-relaxed">¹ Navy/Hodgdon-Beckett (validado vs DXA) · Siri · FFMI Kouri 1995 · WHtR Ashwell/BMJ Open 2016 (NICE) · Tanaka JACC 2001 · Karvonen 1957 · Epley/Brzycki (NSCA) · ISSN Jäger 2017. Estimativas de academia — não substituem avaliação médica/nutricional.</p>
    </div>
  )
}
