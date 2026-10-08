import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'
import Consultoria from '../components/Consultoria'
import { SectionTitle } from '../components/ui'
import { calcBMR, calcTDEE, calcTargetCalories, calcIMC, calcMaxHR, calcMacros, calcWaterGoal, imcClass } from '../lib/tdee'
import { clearPersisted, savePersistedDebounced } from '../lib/db'

export default function Guia() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const setTab = useAppStore((s) => s.setTab)
  const days = useAppStore((s) => s.days)
  const p = useProgressTracking()
  const num = (v) => Number(String(v).replace(',', '.')) || 0

  // Fórmulas do cronograma oficial: TMB × 1.65, meta = TDEE − defPct%
  const bmr = calcBMR({ weightKg: user.weight, heightCm: user.height, age: user.age, sex: user.sex })
  const tdee = calcTDEE(bmr)
  const target = calcTargetCalories(tdee, user.defPct ?? 15)
  const macros = calcMacros({ weightKg: user.weight, targetKcal: target })
  const water = calcWaterGoal(user.weight)
  const imc = calcIMC(user.weight, user.height)
  const deficitKcal = tdee - target

  const exportBackup = async () => {
    const st = useAppStore.getState()
    const state = { v: 1, user: st.user, startDate: st.startDate, days: st.days, mealLog: st.mealLog, loads: st.loads, trainKey: st.trainKey, isDark: st.isDark }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `projeto133-miguel-backup.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = (file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const j = JSON.parse(r.result)
        const st = useAppStore.getState()
        if (j.user) st.setUser(j.user)
        useAppStore.setState({
          ...(j.days ? { days: j.days } : {}),
          ...(j.mealLog ? { mealLog: j.mealLog } : {}),
          ...(j.loads ? { loads: j.loads } : {}),
          ...(j.startDate ? { startDate: j.startDate } : {}),
          ...(j.trainKey ? { trainKey: j.trainKey } : {}),
          ...(j.isDark != null ? { isDark: j.isDark } : {}),
        })
        savePersistedDebounced(useAppStore.getState())
        alert('Backup restaurado ✓ — nada foi perdido')
      } catch { alert('Arquivo inválido') }
    }
    r.readAsText(file)
  }

  const resetAll = async () => {
    if (!confirm('Apagar TUDO e recomeçar do zero? Exporte o backup antes se quiser guardar.')) return
    await clearPersisted()
    location.reload()
  }

  return (
    <div className="space-y-4">
      {/* QUANTO COMER — resumo do cronograma */}
      <div className="rounded-lg border bg-emerald-700 text-white p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Quanto comer por dia</p>
        <h3 className="font-black text-3xl mt-1">{target} <span className="text-base font-bold">kcal/dia</span></h3>
        <p className="text-xs opacity-90 mt-1">TDEE {tdee} − {user.defPct ?? 15}% de déficit (−{deficitKcal} kcal)</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[['🥩 Proteína', `${macros.protein}g`], ['🍚 Carbo', `${macros.carbs}g`], ['🥑 Gordura', `${macros.fat}g`]].map(([l, v]) => (
            <div key={l} className="rounded-md bg-white/15 border border-white/15 p-3 text-center">
              <p className="text-[11px] opacity-80 font-bold">{l}</p><p className="font-black text-lg">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-black text-lg">👤 {user.name || 'Miguel'}</h3>
        <p className="text-xs text-slate-300">{user.weight}kg • {user.height}cm • {user.age} anos • {user.sex === 'F' ? 'mulher' : 'homem'} • IMC {imc} ({imcClass(imc)})</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {[['TMB', `${bmr} kcal`], ['TDEE', `${tdee} kcal`], ['Meta/dia', `${target} kcal`],
            ['💧 Água', `${(water / 1000).toFixed(1)}L`], ['❤️ FC Máx', `${calcMaxHR(user.age)} bpm`], ['Déficit', `${user.defPct ?? 15}%`]].map(([l, v]) => (
            <div key={l} className="rounded-md bg-white/10 border border-white/10 p-3 text-center">
              <p className="text-[11px] opacity-70 font-bold">{l}</p><p className="font-black">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="mb-2"><SectionTitle icon="pencil">Editar perfil</SectionTitle></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-bold">Nome
            <input value={user.name} onChange={(e) => setUser({ name: e.target.value, initials: e.target.value.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() })} className="mt-1 w-full min-h-[52px] px-3 rounded-md bg-slate-50 dark:bg-slate-900 border font-bold" />
          </label>
          <label className="text-xs font-bold">Sexo
            <div className="grid grid-cols-2 gap-2 mt-1">
              { [['M', '👨 Homem'], ['F', '👩 Mulher']].map(([v, l]) => (
                <button key={v} onClick={() => setUser({ sex: v })} className={`min-h-[52px] rounded-md border font-black ${user.sex === v ? 'bg-primary text-primary-foreground border-orange-500' : ''}`}>{l}</button>
              ))}
            </div>
          </label>
          {[['Peso (kg) — ex: 70', user.weight, (v) => setUser({ weight: num(v) })], ['Altura (cm) — ex: 167', user.height, (v) => setUser({ height: num(v) })],
            ['Idade', user.age, (v) => setUser({ age: num(v) })], ['Déficit (% do TDEE) — padrão 15', user.defPct ?? 15, (v) => setUser({ defPct: Math.max(0, Math.min(30, num(v))) })]].map(([l, v, fn]) => (
            <label key={l} className="text-xs font-bold">{l}
              <input type="number" inputMode="decimal" value={v} onChange={(e) => fn(e.target.value)} className="mt-1 w-full min-h-[52px] px-3 rounded-md bg-slate-50 dark:bg-slate-900 border font-black text-center text-base" />
            </label>
          ))}
        </div>
        <p className="text-xs opacity-60 mt-2">Cronograma oficial: TDEE = TMB × 1.65 • Meta = TDEE − {user.defPct ?? 15}% • Proteína = 2g/kg • Água = 43ml/kg. Tudo recalcula sozinho nas outras telas.</p>
      </div>

      <Consultoria user={user} days={days} currentDay={p.currentDay} onGoMeasures={() => setTab('progresso')} />

      <div className="rounded-lg border bg-card p-5">
        <div className="mb-2"><SectionTitle icon="phone">Instalar no celular <span className="font-medium opacity-60 text-xs">(funciona offline)</span></SectionTitle></div>
        <p className="text-xs opacity-70"><b>iPhone:</b> Safari → Compartilhar → <b>Adicionar à Tela de Início</b>. <b>Android:</b> Chrome → ⋮ → <b>Instalar app</b>. Depois abre como app, sem barra do navegador, e funciona sem internet na academia.</p>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="mb-2"><SectionTitle icon="save">Backup e dados <span className="text-xs font-medium text-emerald-500">· salvamento automático</span></SectionTitle></div>
        <div className="grid sm:grid-cols-3 gap-2">
          <button onClick={exportBackup} className="min-h-[52px] rounded-md bg-emerald-500 text-white font-black active:scale-95">⬇ Exportar backup</button>
          <label className="min-h-[52px] rounded-md border font-bold flex items-center justify-center cursor-pointer active:scale-95">⬆ Importar
            <input type="file" accept=".json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
          </label>
          <button onClick={resetAll} className="min-h-[52px] rounded-md bg-red-500/10 text-red-500 border border-red-500/30 font-black active:scale-95">🗑 Recomeçar</button>
        </div>
        <p className="text-[11px] opacity-50 mt-2">Progresso salvo no celular a cada toque (espelho imediato + banco offline). Fechar o app não perde nada. Exporte 1x/semana por segurança.</p>
      </div>

      <div className="rounded-lg border bg-card p-5 text-sm space-y-2">
        <div><SectionTitle icon="book">Como usar</SectionTitle></div>
        <p><b>1. Hoje:</b> marque missões + água + peso. <b>2. Treino:</b> musculação do cronograma + cardio do dia, o descanso cronometra sozinho. <b>3. Comida:</b> bata a meta de {target} kcal lançando por gramas. <b>4. Evolução:</b> meça cintura/braços 1x/semana.</p>
        <p className="text-xs opacity-60">Dupla progressão: bateu o teto de reps em todas as séries → o app sugere +carga no próximo treino. Semana 5/10/15/19 = deload (cargas −10%).</p>
      </div>
    </div>
  )
}
