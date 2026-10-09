import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'
import Consultoria from '../components/Consultoria'
import { Icon } from '../components/ui'
import { calcBMR, calcTDEE, calcTargetCalories, calcIMC, calcMaxHR, calcMacros, calcWaterGoal, imcClass } from '../lib/tdee'
import { clearPersisted, savePersistedDebounced } from '../lib/db'

const ARTIGOS = [
  { id: 'tecnica', cat: 'Treino', tempo: '4 min', titulo: 'Técnica antes de carga', texto: 'Faça movimentos controlados e peça ajuda para ajustar a execução.', dica: 'Grave uma série de lado 1x/semana e compare com o passo a passo da tela Treino.' },
  { id: 'prato', cat: 'Alimentação', tempo: '5 min', titulo: 'Equilíbrio no seu prato', texto: 'Varie legumes, inclua proteínas e prefira alimentos in natura.', dica: 'Metade do prato em legumes, 1/4 de proteína, 1/4 de carboidrato — e água junto.' },
  { id: 'descanso', cat: 'Hábitos', tempo: '3 min', titulo: 'Descanso também é treino', texto: 'Respeite as pausas e cuide do sono. Seu corpo precisa se recuperar.', dica: 'Mire 7–9h de sono. Semana 5/10/15/19 o app já reduz a carga (deload).' },
  { id: 'progressao', cat: 'Treino', tempo: '4 min', titulo: 'Progressão sem pressa', texto: 'Bateu o teto de reps em todas as séries? O app sugere mais carga.', dica: 'Aumentos pequenos e constantes valem mais que um salto grande um dia só.' },
  { id: 'proteina', cat: 'Alimentação', tempo: '3 min', titulo: 'Proteína em todas as refeições', texto: 'Distribuir a proteína ao longo do dia ajuda na saciedade e no músculo.', dica: `Meta atual: veja sua meta em gramas no cartão abaixo e divida por 4 refeições.` },
  { id: 'agua', cat: 'Hábitos', tempo: '2 min', titulo: 'Água ao longo do dia', texto: 'Goles frequentes funcionam melhor que 1L de uma vez.', dica: 'Deixe a garrafa à vista e some +250ml na tela Início a cada vez.' },
]

const CATS = ['Tudo', 'Treino', 'Alimentação', 'Hábitos']
const CAT_ICON = { Treino: 'dumbbell', Alimentação: 'food', Hábitos: 'moon' }

export default function Guia() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const setTab = useAppStore((s) => s.setTab)
  const showToast = useAppStore((s) => s.showToast)
  const days = useAppStore((s) => s.days)
  const p = useProgressTracking()
  const num = (v) => Number(String(v).replace(',', '.')) || 0

  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('Tudo')
  const [aberto, setAberto] = useState(null)

  const artigos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return ARTIGOS.filter((a) => {
      if (cat !== 'Tudo' && a.cat !== cat) return false
      if (!q) return true
      return `${a.titulo} ${a.texto} ${a.cat}`.toLowerCase().includes(q)
    })
  }, [busca, cat])

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
        showToast('Backup restaurado — nada foi perdido')
      } catch { showToast('Arquivo inválido') }
    }
    r.readAsText(file)
  }

  const resetAll = async () => {
    if (!confirm('Apagar TUDO e recomeçar do zero? Exporte o backup antes se quiser guardar.')) return
    await clearPersisted()
    location.reload()
  }

  return (
    <>
      {/* Busca */}
      <label className="flex items-center gap-[10px] min-h-[42px] px-[14px] bg-card rounded-[10px] text-muted-foreground">
        <Icon name="search" size={16} aria-hidden />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="O que você quer aprender?"
          aria-label="Buscar no guia"
          className="w-full py-3 bg-transparent outline-0 text-[12px] text-foreground placeholder:text-muted-foreground"
        />
      </label>

      {/* Categorias */}
      <div className="flex gap-2" aria-label="Categorias do guia">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`flex-1 min-h-[44px] rounded-full text-[11px] active:scale-95 ${cat === c ? 'bg-primary text-primary-foreground font-semibold' : 'bg-card text-muted-foreground'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hero */}
      <article className="relative overflow-hidden rounded-[20px] min-h-[188px]">
        <img
          src="/imagens/guia.jpg"
          alt="Treino com halteres"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(16,22,17,.96), rgba(16,22,17,.08))' }}
          aria-hidden="true"
        />
        <div className="relative flex min-h-[188px] flex-col items-start p-[18px]">
          <span className="text-[10px] font-bold text-primary">PARA COMEÇAR BEM</span>
          <h2 className="mt-[10px] text-[25px] leading-[1.15] font-bold">O básico que<br />faz a diferença.</h2>
          <p className="mt-2 text-[12px] max-w-[215px]" style={{ color: '#E7EBE2' }}>Aqueça, cuide da técnica e avance no seu próprio ritmo.</p>
          <button type="button" onClick={() => setTab('treino')} className="mt-[14px] text-[12px] font-semibold text-primary">
            Explorar guia · 6 min ↗
          </button>
        </div>
      </article>

      {/* Artigos */}
      <section aria-labelledby="titulo-artigos">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[18px]" id="titulo-artigos">Para levar à sua rotina</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">{artigos.length}</span>
        </div>
        {artigos.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Nada por aqui com esse filtro. Tente outra palavra.</p>
        ) : (
          <div className="grid gap-2">
            {artigos.map((a) => (
              <article key={a.id} className="rounded-[20px] bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAberto(aberto === a.id ? null : a.id)}
                  className="w-full flex items-center gap-3 p-[14px] text-left active:scale-[0.99]"
                  aria-expanded={aberto === a.id}
                >
                  <span className="w-10 h-10 shrink-0 grid place-items-center rounded-[10px] bg-accent text-primary">
                    <Icon name={CAT_ICON[a.cat] ?? 'book'} size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[9px] font-bold text-primary">{a.cat.toUpperCase()} · {a.tempo.toUpperCase()}</span>
                    <span className="block mt-[5px] text-[15px] font-semibold">{a.titulo}</span>
                    <span className="block mt-[5px] text-[11px] text-muted-foreground">{a.texto}</span>
                  </span>
                  <span className="text-muted-foreground text-[21px]" aria-hidden="true">›</span>
                </button>
                {aberto === a.id && (
                  <p className="mx-[14px] mb-[14px] rounded-[10px] bg-accent p-3 text-[12px] text-primary">{a.dica}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground text-center">
        Conteúdo educativo, não uma prescrição. Para orientações individuais, conte com profissionais de educação física e nutrição.
      </p>

      {/* Seus números */}
      <article className="rounded-[20px] bg-accent p-[16px]">
        <p className="text-[11px] font-semibold text-primary">QUANTO COMER POR DIA</p>
        <h3 className="mt-1 text-[30px] font-bold tabular-nums">{target.toLocaleString('pt-BR')} <span className="text-[14px] font-semibold">kcal/dia</span></h3>
        <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">TDEE {tdee.toLocaleString('pt-BR')} − {user.defPct ?? 15}% (−{deficitKcal.toLocaleString('pt-BR')} kcal)</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[['Proteína', `${macros.protein}g`], ['Carbo', `${macros.carbs}g`], ['Gordura', `${macros.fat}g`]].map(([l, v]) => (
            <div key={l} className="rounded-[10px] bg-card p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-semibold">{l}</p>
              <p className="font-bold text-[18px] tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[20px] bg-card p-[16px]">
        <h3 className="font-bold text-[18px]">{user.name || 'Miguel'}</h3>
        <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
          {user.weight}kg · {user.height}cm · {user.age} anos · {user.sex === 'F' ? 'mulher' : 'homem'} · IMC {imc} ({imcClass(imc)})
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[['TMB', `${bmr} kcal`], ['TDEE', `${tdee} kcal`], ['Meta/dia', `${target} kcal`],
            ['Água', `${(water / 1000).toFixed(1)}L`], ['FC máx', `${calcMaxHR(user.age)} bpm`], ['Déficit', `${user.defPct ?? 15}%`]].map(([l, v]) => (
            <div key={l} className="rounded-[10px] bg-secondary/60 p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-semibold">{l}</p>
              <p className="font-bold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[20px] bg-card p-[16px]">
        <h3 className="font-bold text-[16px]">Editar perfil</h3>
        <div className="grid gap-3 mt-3">
          <label className="text-[12px] font-semibold text-muted-foreground">Nome
            <input value={user.name} onChange={(e) => setUser({ name: e.target.value, initials: e.target.value.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() })} className="mt-1 w-full min-h-[52px] px-3 rounded-[10px] bg-secondary font-semibold text-foreground outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[['M', 'Homem'], ['F', 'Mulher']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setUser({ sex: v })} className={`min-h-[52px] rounded-[10px] font-bold active:scale-95 ${user.sex === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['Peso (kg)', user.weight, (v) => setUser({ weight: num(v) })], ['Altura (cm)', user.height, (v) => setUser({ height: num(v) })],
              ['Idade', user.age, (v) => setUser({ age: num(v) })], ['Déficit (%)', user.defPct ?? 15, (v) => setUser({ defPct: Math.max(0, Math.min(30, num(v))) })]].map(([l, v, fn]) => (
              <label key={l} className="text-[12px] font-semibold text-muted-foreground">{l}
                <input type="number" inputMode="decimal" value={v} onChange={(e) => fn(e.target.value)} className="mt-1 w-full min-h-[52px] px-3 rounded-[10px] bg-secondary font-bold text-center tabular-nums outline-none" />
              </label>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">TDEE = TMB × 1.65 · Meta = TDEE − déficit · Proteína = 2g/kg · Água = 43ml/kg. Tudo recalcula sozinho nas outras telas.</p>
      </article>

      <Consultoria user={user} days={days} currentDay={p.currentDay} onGoMeasures={() => setTab('progresso')} />

      <article className="rounded-[20px] bg-card p-[16px]">
        <h3 className="font-bold text-[16px]">Backup e dados</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">Salvamento automático no celular.</p>
        <div className="grid gap-2 mt-3">
          <button type="button" onClick={exportBackup} className="min-h-[52px] rounded-[10px] bg-primary text-primary-foreground font-bold active:scale-95">Exportar backup</button>
          <div className="grid grid-cols-2 gap-2">
            <label className="min-h-[52px] rounded-[10px] bg-secondary font-semibold flex items-center justify-center cursor-pointer active:scale-95">Importar
              <input type="file" accept=".json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={resetAll} className="min-h-[52px] rounded-[10px] bg-red-500/10 text-red-400 font-bold active:scale-95">Recomeçar</button>
          </div>
        </div>
      </article>

      <article className="rounded-[20px] bg-card p-[16px]">
        <h3 className="font-bold text-[16px]">Como usar</h3>
        <p className="mt-2 text-[13px] text-muted-foreground">
          <b className="text-foreground">1. Início:</b> rotina + água + treino do dia. <b className="text-foreground">2. Treino:</b> séries com carga, o descanso cronometra sozinho. <b className="text-foreground">3. Alimentação:</b> bata a meta de {target.toLocaleString('pt-BR')} kcal. <b className="text-foreground">4. Evolução:</b> meça 1x/semana.
        </p>
      </article>
    </>
  )
}
