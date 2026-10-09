import { useEffect, useMemo, useState } from 'react'
import { MEALS } from '../data/meals'
import { EXTRA_FOODS } from '../data/foods'
import { dayTotals, targetsFor } from '../lib/diet'
import { buscarPorNome, buscarPorCodigoDeBarras } from '../lib/foods/foodService.js'
import { foodParaItemRefeicao, createFood } from '../lib/foods/schema.js'
import { salvarAlimento } from '../lib/foods/foodDb.js'
import { scaleFood, portionPresets } from '../lib/nutrition'
import { findSwaps } from '../lib/swaps'
import LabelScanner from '../components/LabelScanner'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'

const MEAL_IMG = {
  'pre-treino': '/imagens/lanche.jpg',
  cafe: '/imagens/cafe.jpg',
  almoco: '/imagens/almoco.jpg',
  lanche: '/imagens/lanche.jpg',
  jantar: '/imagens/jantar.jpg',
}

export default function Comida() {
  const p = useProgressTracking()
  const day = p.displayDay
  const setViewDay = useAppStore((s) => s.setViewDay)
  const mealLog = useAppStore((s) => s.mealLog[day] ?? {})
  const toggleMealEaten = useAppStore((s) => s.toggleMealEaten)
  const addFoodToMeal = useAppStore((s) => s.addFoodToMeal)
  const removeExtraItem = useAppStore((s) => s.removeExtraItem)
  const toggleBaseSkipped = useAppStore((s) => s.toggleBaseSkipped)
  const swapBaseItem = useAppStore((s) => s.swapBaseItem)
  const repeatYesterday = useAppStore((s) => s.repeatYesterday)
  const showToast = useAppStore((s) => s.showToast)

  const [collapsed, setCollapsed] = useState({})
  const [open, setOpen] = useState(null)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const [grams, setGrams] = useState('')
  const [custom, setCustom] = useState({ name: '', kcal: '', prot: '', carb: '', fat: '' })
  const [tacoHits, setTacoHits] = useState([])
  const [tacoStatus, setTacoStatus] = useState('idle')
  const [barcode, setBarcode] = useState('')
  const [offFood, setOffFood] = useState(null)
  const [offStatus, setOffStatus] = useState('idle')
  const [rotulo, setRotulo] = useState({ nome: '', marca: '', barcode: '', porcaoG: '30', kcal: '', prot: '', carb: '', fat: '', fibra: '', por100: false })
  const [rotuloStatus, setRotuloStatus] = useState('idle')
  const [swapTarget, setSwapTarget] = useState(null) // { mealId, item }

  const user = useAppStore((s) => s.user)
  const TARGETS = useMemo(() => targetsFor(user), [user])
  const totals = useMemo(() => dayTotals(mealLog), [mealLog])

  const filtered = EXTRA_FOODS.filter((x) => String(x?.name ?? '').toLowerCase().includes(q.toLowerCase()))
  const safeKcal = Number.isFinite(TARGETS.kcal) && TARGETS.kcal > 0 ? TARGETS.kcal : 2000
  const remain = safeKcal - Math.round(Number(totals.k) || 0)
  const pct = Math.min(100, Math.max(0, Math.round(((Number(totals.k) || 0) / safeKcal) * 100)))
  const calc = picked ? scaleFood(picked, grams || picked.baseGrams || 100) : null

  const openSheet = (mealId) => { setOpen(mealId); setQ(''); setPicked(null); setGrams(''); setTacoHits([]); setBarcode(''); setOffFood(null); setOffStatus('idle'); setRotuloStatus('idle') }
  const searchBarcode = async (override) => {
    const code = String(override ?? barcode).replace(/\D/g, '')
    if (code.length < 8 || offStatus === 'loading') return
    if (override) setBarcode(override)
    setOffStatus('loading'); setOffFood(null)
    try {
      const { alimento } = await buscarPorCodigoDeBarras(code)
      setOffFood(alimento)
      setOffStatus('idle')
    } catch {
      setOffStatus('error')
    }
  }
  useEffect(() => {
    if (!open || q.trim().length < 2) { setTacoHits([]); return }
    setTacoStatus('loading')
    const myQ = q
    let alive = true
    const id = setTimeout(() => {
      buscarPorNome(myQ, { limite: 12 })
        .then((alimentos) => { if (alive) { setTacoHits(alimentos); setTacoStatus('ready') } })
        .catch(() => { if (alive) { setTacoHits([]); setTacoStatus('offline') } })
    }, 350)
    return () => { alive = false; clearTimeout(id) }
  }, [open, q])
  const pick = (f) => { setPicked(f); setGrams(String(f.baseGrams || 100)) }
  const confirmCalc = () => {
    if (!picked || !(Number(grams) > 0)) return
    addFoodToMeal(day, open, calc)
    showToast(`${calc.qty}g lançados: ${calc.kcal} kcal`)
    setOpen(null); setPicked(null)
  }
  const addCustom = () => {
    if (!custom.name.trim() || !Number(custom.kcal)) return
    addFoodToMeal(day, open, { name: custom.name.trim(), kcal: Number(custom.kcal), prot: Number(custom.prot) || 0, carb: Number(custom.carb) || 0, fat: Number(custom.fat) || 0, unit: 'porção informada' })
    setCustom({ name: '', kcal: '', prot: '', carb: '', fat: '' })
    setOpen(null)
  }
  const numR = (v) => Number(String(v).replace(',', '.')) || 0
  const salvarRotulo = async () => {
    const nome = rotulo.nome.trim()
    const porcao = numR(rotulo.porcaoG)
    const kcal = numR(rotulo.kcal)
    if (!nome || !(kcal > 0) || (!rotulo.por100 && !(porcao > 0))) {
      setRotuloStatus('error')
      return
    }
    setRotuloStatus('loading')
    try {
      const f = rotulo.por100 ? 1 : 100 / porcao
      const alimento = createFood({
        nome,
        marca: rotulo.marca.trim() || null,
        codigo_barras: rotulo.barcode.replace(/\D/g, '') || null,
        fonte: 'LOCAL',
        porcao_referencia_g: 100,
        calorias_100g: kcal * f,
        proteinas_100g: numR(rotulo.prot) * f,
        carboidratos_100g: numR(rotulo.carb) * f,
        gorduras_100g: numR(rotulo.fat) * f,
        fibras_100g: numR(rotulo.fibra) * f,
      })
      await salvarAlimento(alimento)
      pick(foodParaItemRefeicao(alimento))
      setRotuloStatus('idle')
      showToast(`Rótulo salvo: ${nome} — agora informe as gramas`)
    } catch (e) {
      setRotuloStatus(e?.code === 'DUPLICADO' ? 'duplicado' : 'error')
    }
  }

  const dateLabel = (() => {
    try {
      return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    } catch { return '' }
  })()

  return (
    <>
      {/* Data */}
      <div className="flex items-center justify-between min-h-[44px] text-[12px]">
        <button type="button" onClick={() => setViewDay(Math.max(1, day - 1))} disabled={day <= 1} aria-label="Dia anterior" className="min-w-[44px] min-h-[44px] text-[22px] text-muted-foreground disabled:opacity-30 px-2">‹</button>
        <span>Dia {day} · hoje, {dateLabel}</span>
        <button type="button" onClick={() => setViewDay(Math.min(p.currentDay, day + 1))} disabled={day >= p.currentDay} aria-label="Próximo dia" className="min-w-[44px] min-h-[44px] text-[22px] text-muted-foreground disabled:opacity-30 px-2">›</button>
      </div>
      {p.isViewingPast && (
        <button type="button" onClick={() => setViewDay(null)} className="min-h-[44px] -mt-2 text-[12px] text-primary font-semibold text-center">
          Voltar para hoje (dia {p.currentDay})
        </button>
      )}

      {/* Energia */}
      <article className="rounded-[20px] bg-card p-[16px]">
        <p className="text-[12px] text-muted-foreground">Energia do dia</p>
        <div className="mt-[10px] flex items-center justify-between gap-3">
          <p className="text-[32px] font-bold tabular-nums">
            {Math.round(totals.k).toLocaleString('pt-BR')} <small className="text-[12px] font-normal text-muted-foreground">/ {TARGETS.kcal.toLocaleString('pt-BR')} kcal</small>
          </p>
          <span className="text-[14px] font-bold text-primary tabular-nums">{pct}%</span>
        </div>
        <div className="h-[5px] mt-[9px] rounded-full bg-secondary overflow-hidden">
          <span className="block h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Proteínas', v: Math.round(totals.pr), t: TARGETS.protein },
            { label: 'Carboidratos', v: Math.round(totals.c), t: TARGETS.carbs },
            { label: 'Gorduras', v: Math.round(totals.f), t: TARGETS.fat },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <strong className="block mt-[5px] text-[12px] font-normal tabular-nums">{m.v} / {m.t} g</strong>
              <div className="h-[5px] mt-[6px] rounded-full bg-secondary overflow-hidden">
                <span className="block h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (m.v / m.t) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground tabular-nums">
          {remain >= 0 ? `Faltam ${remain} kcal hoje` : `${-remain} kcal acima da meta`}
        </p>
      </article>

      {day > 1 && (
        <button
          type="button"
          onClick={() => {
            const n = repeatYesterday(day)
            showToast(n > 0 ? `${n} ${n === 1 ? 'item repetido' : 'itens repetidos'} de ontem` : 'Nada para repetir de ontem')
          }}
          className="w-full min-h-[48px] rounded-[10px] bg-secondary text-primary text-[14px] font-semibold active:scale-[0.99]"
        >
          Repetir o que comi ontem
        </button>
      )}

      {/* Refeições */}
      <section aria-labelledby="titulo-refeicoes">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-[18px]" id="titulo-refeicoes">Suas refeições</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">{Math.round(totals.k)} kcal</span>
        </div>
        <div className="grid gap-2">
          {MEALS.map((m, mi) => {
            const eaten = !!mealLog[m.id]?.eaten
            const extras = mealLog[m.id]?.extraItems ?? []
            const skipped = mealLog[m.id]?.skipped ?? []
            const baseShown = m.items.map((x) => ({ ...x, base: true, skipped: skipped.includes(x.name) }))
            const items = [...baseShown, ...extras]
            const kcal = [...baseShown.filter((i) => !i.skipped), ...extras].reduce((a, b) => a + (Number(b?.kcal) || 0), 0)
            const isCollapsed = !!collapsed[m.id]
            return (
              <article key={m.id} className={`rounded-2xl bg-card overflow-hidden stagger-${Math.min(5, mi + 1)}`}>
                <button
                  type="button"
                  onClick={() => setCollapsed({ ...collapsed, [m.id]: !isCollapsed })}
                  className="w-full flex items-center gap-[10px] p-[10px] text-left active:scale-[0.99]"
                  aria-expanded={!isCollapsed}
                >
                  <img
                    src={MEAL_IMG[m.id] ?? '/imagens/almoco.jpg'}
                    alt=""
                    loading="lazy"
                    className="w-[50px] h-[50px] shrink-0 object-cover rounded-[10px] bg-secondary"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-semibold truncate">{m.title}</span>
                    <span className="block mt-1 text-[11px] text-muted-foreground truncate tabular-nums">
                      {items.filter((i) => !i.skipped).slice(0, 3).map((i) => i.name).join(', ')}
                    </span>
                    <small className={`block mt-1 text-[10px] tabular-nums ${eaten ? 'text-primary' : 'text-muted-foreground'}`}>
                      {Math.round(kcal)} kcal · {eaten ? 'Registrado' : 'Planejado'}
                    </small>
                  </span>
                  <span className="self-stretch flex flex-col justify-between items-end">
                    <time className="text-[10px] text-muted-foreground tabular-nums">{m.time}</time>
                    <span className={eaten ? 'text-primary' : 'text-muted-foreground'} aria-hidden="true">{eaten ? '⊙' : '◌'}</span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="px-[10px] pb-[10px]">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button type="button" onClick={() => openSheet(m.id)} className="min-h-[48px] rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold active:scale-95">+ Lançar</button>
                      <button type="button" onClick={() => toggleMealEaten(day, m.id)} className={`min-h-[48px] rounded-[10px] text-[14px] font-semibold active:scale-95 ${eaten ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                        {eaten ? '✓ Comido' : 'Marcar comido'}
                      </button>
                    </div>
                    <div className="grid gap-1.5">
                      {items.map((it, idx) => (
                        <div key={it.base ? `b-${idx}` : it.id} className={`rounded-[10px] bg-secondary/50 p-3 ${it.skipped ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-center gap-2">
                            <span className={`text-[13px] font-semibold ${it.skipped ? 'line-through' : ''}`}>{it.name} <span className="block font-normal text-muted-foreground text-[11px] tabular-nums">{it.swappedFrom ? `troca de ${it.swappedFrom} · ` : ''}{it.qty} {it.unit} · {it.kcal} kcal</span></span>
                            <span className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                              P{it.prot} C{it.carb} G{it.fat}
                              {!it.base && <button type="button" onClick={() => removeExtraItem(day, m.id, it.id)} title="Remover" aria-label={`Remover ${it.name}`} className="min-w-[44px] min-h-[44px] rounded-[10px] text-red-400 bg-red-500/10 font-bold text-lg active:scale-95">×</button>}
                            </span>
                          </div>
                          {it.base && !it.skipped && (
                            <div className="flex gap-2 mt-2">
                              <button type="button" onClick={() => setSwapTarget({ mealId: m.id, item: it })} className="flex-1 min-h-[44px] rounded-[10px] bg-background text-[12px] font-semibold active:scale-95">⇄ Trocar</button>
                              <button type="button" onClick={() => { toggleBaseSkipped(day, m.id, it.name); showToast(`${it.name} tirado do dia`) }} className="flex-1 min-h-[44px] rounded-[10px] bg-background text-[12px] font-semibold text-red-400 active:scale-95">Tirar</button>
                            </div>
                          )}
                          {it.base && it.skipped && (
                            <button type="button" onClick={() => toggleBaseSkipped(day, m.id, it.name)} className="mt-2 w-full min-h-[44px] rounded-[10px] bg-background text-[12px] font-semibold text-primary active:scale-95">Desfazer (voltar ao plano)</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => openSheet(MEALS[0].id)}
        className="w-full min-h-[48px] px-[18px] rounded-[10px] bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-between gap-3 active:scale-[0.99]"
      >
        Registrar alimento <span className="text-[21px] leading-none" aria-hidden="true">+</span>
      </button>

      <p className="text-[11px] text-muted-foreground text-center">Metas calculadas para você. Para um plano individual, procure um nutricionista.</p>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}>
          <div className="sheet-up w-full sm:max-w-lg bg-card rounded-t-[20px] sm:rounded-[20px] p-5 max-h-[92dvh] overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[16px]">Lançar em: {MEALS.find((m) => m.id === open)?.title}</h3>

            {!picked ? (
              <>
                <div className="mt-3 rounded-[10px] bg-secondary/60 p-2.5">
                  <p className="text-[11px] font-bold text-muted-foreground">Código de barras</p>
                  <div className="flex gap-2 mt-1.5">
                    <input value={barcode} onChange={(e) => setBarcode(e.target.value)} inputMode="numeric" placeholder="Ex: 7894900010015"
                      className="flex-1 min-h-[52px] px-4 rounded-[10px] bg-background border border-transparent font-semibold text-center tabular-nums outline-none" />
                    <button type="button" onClick={() => searchBarcode()} disabled={barcode.replace(/\D/g, '').length < 8 || offStatus === 'loading'}
                      className="min-h-[52px] px-5 rounded-[10px] bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95">
                      {offStatus === 'loading' ? '…' : 'Buscar'}
                    </button>
                  </div>
                  {offStatus === 'error' && <p className="text-[11px] text-red-400 font-semibold mt-1">Não achei esse código — confira os números ou cadastre abaixo.</p>}
                  {offFood && (
                    <button type="button" onClick={() => pick(foodParaItemRefeicao(offFood))}
                      className="mt-2 w-full min-h-[56px] px-3 py-2 rounded-[10px] bg-accent text-left active:scale-[0.99] flex justify-between items-center gap-2">
                      <span className="font-semibold text-[13px]">{offFood.nome}{offFood.marca ? ` (${offFood.marca})` : ''}
                        <span className="block text-[11px] font-normal text-muted-foreground tabular-nums">100g = {offFood.calorias_100g} kcal</span>
                      </span>
                      <span className="font-bold text-primary">›</span>
                    </button>
                  )}
                </div>
                <div className="mt-2">
                  <LabelScanner
                    onBarcode={(code) => searchBarcode(code)}
                    onResult={(r) => setRotulo((prev) => ({
                      ...prev,
                      barcode: r.barcode ?? prev.barcode,
                      porcaoG: r.porcaoG != null ? String(r.porcaoG) : prev.porcaoG,
                      kcal: r.kcal != null ? String(r.kcal) : prev.kcal,
                      prot: r.prot != null ? String(r.prot) : prev.prot,
                      carb: r.carb != null ? String(r.carb) : prev.carb,
                      fat: r.fat != null ? String(r.fat) : prev.fat,
                      fibra: r.fibra != null ? String(r.fibra) : prev.fibra,
                      por100: false,
                    }))}
                  />
                </div>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que você comeu? (ex: frango, arroz…)"
                  className="mt-2 w-full min-h-[52px] px-4 rounded-[10px] bg-secondary text-[13px] outline-none placeholder:text-muted-foreground" />
                <div className="mt-3 grid gap-1.5 max-h-64 overflow-y-auto overscroll-contain">
                  {filtered.map((f) => (
                    <button key={f.name} type="button" onClick={() => pick(f)}
                      className="w-full min-h-[56px] px-3 py-2 rounded-[10px] bg-secondary/60 text-left active:scale-[0.99] flex justify-between items-center gap-2">
                      <span className="font-semibold text-[13px]">{f.name}<span className="block text-[11px] font-normal text-muted-foreground tabular-nums">{f.unit} = {f.kcal} kcal</span></span>
                      <span className="font-bold text-primary">›</span>
                    </button>
                  ))}
                  {!filtered.length && !tacoHits.length && <p className="text-[12px] text-muted-foreground">Nada encontrado — cadastre abaixo.</p>}
                </div>
                {tacoHits.length > 0 && (
                  <>
                    <p className="text-[11px] font-bold mt-3 mb-1 text-muted-foreground">Na tabela ({tacoHits.length})</p>
                    <div className="grid gap-1.5 max-h-56 overflow-y-auto overscroll-contain">
                      {tacoHits.map((f) => {
                        const item = foodParaItemRefeicao(f)
                        return (
                          <button key={f.id} type="button" onClick={() => pick(item)}
                            className="w-full min-h-[56px] px-3 py-2 rounded-[10px] bg-accent text-left active:scale-[0.99] flex justify-between items-center gap-2">
                            <span className="font-semibold text-[13px]">{f.nome}<span className="block text-[11px] font-normal text-muted-foreground tabular-nums">100g = {f.calorias_100g} kcal</span></span>
                            <span className="font-bold text-primary">›</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
                {q.trim().length >= 2 && tacoStatus === 'loading' && <p className="text-[11px] text-muted-foreground mt-1">Buscando alimentos…</p>}
                <div className="mt-3 pt-3 border-t border-secondary">
                  <p className="text-[13px] font-bold mb-1">Cadastrar rótulo (copie da embalagem)</p>
                  <p className="text-[11px] text-muted-foreground mb-2">Digite a medida exata do rótulo + valor nutricional. Salva no banco e já calcula por gramas.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[11px] font-semibold text-muted-foreground col-span-2">Alimento
                      <input value={rotulo.nome} onChange={(e) => setRotulo({ ...rotulo, nome: e.target.value })} placeholder="Ex: Iogurte Grego Vigor" className="mt-0.5 w-full min-h-[52px] px-3 rounded-[10px] bg-secondary text-[13px] outline-none placeholder:text-muted-foreground" />
                    </label>
                    <label className="text-[11px] font-semibold text-muted-foreground">Marca (opcional)
                      <input value={rotulo.marca} onChange={(e) => setRotulo({ ...rotulo, marca: e.target.value })} placeholder="Vigor" className="mt-0.5 w-full min-h-[48px] px-2 rounded-[10px] bg-secondary text-[13px] text-center outline-none" />
                    </label>
                    <label className="text-[11px] font-semibold text-muted-foreground">Código barras (opcional)
                      <input value={rotulo.barcode} onChange={(e) => setRotulo({ ...rotulo, barcode: e.target.value })} inputMode="numeric" placeholder="789..." className="mt-0.5 w-full min-h-[48px] px-2 rounded-[10px] bg-secondary text-[13px] text-center tabular-nums outline-none" />
                    </label>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[12px] font-semibold min-h-[44px]">
                    <input type="checkbox" checked={rotulo.por100} onChange={(e) => setRotulo({ ...rotulo, por100: e.target.checked })} className="h-6 w-6 accent-[#d2f27b]" />
                    Valores já são por 100g
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {!rotulo.por100 && (
                      <label className="text-[11px] font-semibold text-muted-foreground">Porção rótulo (g)
                        <input type="number" value={rotulo.porcaoG} onChange={(e) => setRotulo({ ...rotulo, porcaoG: e.target.value })} className="mt-0.5 w-full min-h-[48px] px-2 rounded-[10px] bg-secondary text-[13px] text-center tabular-nums outline-none" />
                      </label>
                    )}
                    {[['kcal', 'Kcal'], ['prot', 'Prot (g)'], ['carb', 'Carb (g)'], ['fat', 'Gord (g)'], ['fibra', 'Fibra (g)']].map(([k, l]) => (
                      <label key={k} className="text-[11px] font-semibold text-muted-foreground">{l}
                        <input type="number" value={rotulo[k]} onChange={(e) => setRotulo({ ...rotulo, [k]: e.target.value })}
                          className="mt-0.5 w-full min-h-[48px] px-2 rounded-[10px] bg-secondary text-[13px] text-center tabular-nums outline-none" />
                      </label>
                    ))}
                  </div>
                  {rotuloStatus === 'error' && <p className="text-[11px] text-red-400 font-semibold mt-1">Preencha nome + kcal (+ porção se não for por 100g).</p>}
                  {rotuloStatus === 'duplicado' && <p className="text-[11px] text-amber-400 font-semibold mt-1">Esse código já existe no banco — busque pelo código.</p>}
                  <button type="button" onClick={salvarRotulo} disabled={rotuloStatus === 'loading'} className="mt-2 w-full min-h-[52px] rounded-[10px] bg-accent text-primary font-bold disabled:opacity-40 active:scale-95">
                    {rotuloStatus === 'loading' ? 'Salvando…' : '💾 Salvar rótulo e informar gramas'}
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-secondary">
                  <p className="text-[13px] font-bold mb-2">Comida avulsa (sem rótulo)</p>
                  <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Nome do que você comeu" className="w-full min-h-[52px] px-3 rounded-[10px] bg-secondary text-[13px] mb-2 outline-none placeholder:text-muted-foreground" />
                  <div className="grid grid-cols-4 gap-2">
                    {[['kcal', 'Kcal'], ['prot', 'Prot'], ['carb', 'Carb'], ['fat', 'Gord']].map(([k, l]) => (
                      <label key={k} className="text-[11px] font-semibold text-muted-foreground">{l}
                        <input type="number" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
                          className="mt-0.5 w-full min-h-[48px] px-2 rounded-[10px] bg-secondary text-[13px] text-center tabular-nums outline-none" />
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={addCustom} className="mt-2 w-full min-h-[52px] rounded-[10px] bg-primary text-primary-foreground font-bold">Adicionar</button>
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setPicked(null)} className="mt-1 text-[13px] font-semibold text-primary">‹ trocar alimento</button>
                <h4 className="font-bold text-[18px] mt-1">{picked.name}</h4>
                <p className="text-[12px] text-muted-foreground tabular-nums">Rótulo: {picked.unit} = {picked.kcal} kcal · P{picked.prot} C{picked.carb} G{picked.fat}</p>

                <div className="grid grid-cols-4 gap-2 mt-3">
                  {portionPresets(picked).map((pr) => (
                    <button key={pr.mult} type="button" onClick={() => setGrams(String(pr.grams))}
                      className={`min-h-[52px] rounded-[10px] font-bold text-[13px] active:scale-95 ${Number(grams) === pr.grams ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                      {pr.mult}×<span className="block text-[10px] font-normal tabular-nums">{pr.grams}g</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button type="button" onClick={() => setGrams(String(Math.max(0, (Number(grams) || 0) - 10)))} className="min-w-[56px] min-h-[56px] rounded-[10px] bg-secondary font-bold text-xl active:scale-95">−</button>
                  <label className="flex-1 text-center text-[12px] font-semibold text-muted-foreground">Gramas que você comeu
                    <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)}
                      className="mt-1 w-full min-h-[56px] rounded-[10px] bg-secondary font-bold text-xl text-center tabular-nums outline-none" />
                  </label>
                  <button type="button" onClick={() => setGrams(String((Number(grams) || 0) + 10))} className="min-w-[56px] min-h-[56px] rounded-[10px] bg-secondary font-bold text-xl active:scale-95">+</button>
                </div>

                {calc && (
                  <div className="mt-3 rounded-[20px] bg-accent p-4 text-center">
                    <p className="text-[30px] font-bold tabular-nums">{calc.kcal}<span className="text-[13px] font-normal"> kcal</span></p>
                    <p className="text-[13px] font-semibold mt-1 tabular-nums">P {calc.prot}g · C {calc.carb}g · G {calc.fat}g</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">em {calc.qty}g</p>
                  </div>
                )}
                <button type="button" onClick={confirmCalc} disabled={!(Number(grams) > 0)}
                  className="mt-3 w-full min-h-[56px] rounded-[10px] bg-primary text-primary-foreground font-bold text-[15px] disabled:opacity-40 active:scale-[0.98]">
                  ✓ Lançar {grams || 0}g na refeição
                </button>
              </>
            )}
            <button type="button" onClick={() => setOpen(null)} className="mt-2 w-full min-h-[48px] rounded-[10px] bg-secondary font-semibold">Fechar</button>
          </div>
        </div>
      )}

      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setSwapTarget(null) }}>
          <div className="sheet-up w-full sm:max-w-lg bg-card rounded-t-[20px] sm:rounded-[20px] p-5 max-h-[92dvh] overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[16px]">Trocar: {swapTarget.item.name}</h3>
            <p className="text-[12px] text-muted-foreground tabular-nums mt-1">{swapTarget.item.kcal} kcal · P{swapTarget.item.prot} C{swapTarget.item.carb} G{swapTarget.item.fat} — equivalentes na medida certa:</p>
            {findSwaps(swapTarget.item, [...EXTRA_FOODS, ...MEALS.flatMap((mm) => mm.items)]).length === 0 && (
              <p className="mt-3 text-[13px] text-muted-foreground">Sem troca equivalente — item quase zero caloria. Use Tirar ou lance um extra.</p>
            )}
            <div className="grid gap-1.5 mt-3">
              {findSwaps(swapTarget.item, [...EXTRA_FOODS, ...MEALS.flatMap((mm) => mm.items)]).map((s) => (
                <div key={s.food.name} className="rounded-[10px] bg-secondary/60 p-3">
                  <p className="text-[13px] font-semibold">{s.food.name}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{s.grams}g = {s.kcal} kcal · P{s.prot} C{s.carb} G{s.fat} ({s.diffKcal >= 0 ? `+${s.diffKcal}` : s.diffKcal} kcal)</p>
                  <button
                    type="button"
                    onClick={() => {
                      swapBaseItem(day, swapTarget.mealId, swapTarget.item.name, { name: `${s.food.name} (troca)`, qty: s.grams, unit: 'g (equiv.)', kcal: s.kcal, prot: s.prot, carb: s.carb, fat: s.fat })
                      showToast(`${s.food.name} ${s.grams}g no lugar`)
                      setSwapTarget(null)
                    }}
                    className="mt-2 w-full min-h-[44px] rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold active:scale-95"
                  >
                    Usar {s.grams}g
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSwapTarget(null)} className="mt-2 w-full min-h-[48px] rounded-[10px] bg-secondary font-semibold">Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}
