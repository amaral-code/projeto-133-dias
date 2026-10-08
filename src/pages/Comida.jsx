import { useEffect, useMemo, useState } from 'react'
import { MEALS } from '../data/meals'
import { EXTRA_FOODS } from '../data/foods'
import { dayTotals, targetsFor } from '../lib/diet'
import { buscarPorNome, buscarPorCodigoDeBarras } from '../lib/foods/foodService.js'
import { foodParaItemRefeicao } from '../lib/foods/schema.js'
import { scaleFood, portionPresets } from '../lib/nutrition'
import { useAppStore } from '../store/useAppStore'
import { useProgressTracking } from '../hooks/useProgressTracking'

// Tela Comida — expansiva no celular:
// resumo fixo no topo, refeições em acordeão, e calculadora por gramas:
// você lança o que comeu (ex: 180g de frango) e tudo recalcula sozinho.
export default function Comida() {
  const p = useProgressTracking()
  const day = p.displayDay
  const mealLog = useAppStore((s) => s.mealLog[day] ?? {})
  const toggleMealEaten = useAppStore((s) => s.toggleMealEaten)
  const addFoodToMeal = useAppStore((s) => s.addFoodToMeal)
  const removeExtraItem = useAppStore((s) => s.removeExtraItem)

  const [collapsed, setCollapsed] = useState({})
  const [open, setOpen] = useState(null) // mealId do bottom-sheet
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null) // alimento na calculadora
  const [grams, setGrams] = useState('')
  const [custom, setCustom] = useState({ name: '', kcal: '', prot: '', carb: '', fat: '' })
  const [tacoHits, setTacoHits] = useState([]) // DTOs (TACO + banco local)
  const [tacoStatus, setTacoStatus] = useState('idle') // idle|loading|ready|offline
  const [barcode, setBarcode] = useState('') // código de barras (Open Food Facts)
  const [offFood, setOffFood] = useState(null) // DTO do produto OFF encontrado
  const [offStatus, setOffStatus] = useState('idle') // idle|loading|error

  // Metas do cronograma oficial (mesma conta da tela Hoje — lib/diet)
  const user = useAppStore((s) => s.user)
  const TARGETS = useMemo(() => targetsFor(user), [user])
  const totals = useMemo(() => dayTotals(mealLog), [mealLog])

  const filtered = EXTRA_FOODS.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()))
  const remain = TARGETS.kcal - Math.round(totals.k)
  const calc = picked ? scaleFood(picked, grams || picked.baseGrams || 100) : null

  const bar = (v, t, cls) => (
    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className={`h-full ${cls}`} style={{ width: `${Math.min(100, (v / t) * 100)}%` }} /></div>
  )

  const openSheet = (mealId) => { setOpen(mealId); setQ(''); setPicked(null); setGrams(''); setTacoHits([]); setBarcode(''); setOffFood(null); setOffStatus('idle') }
  const searchBarcode = async () => {
    const code = barcode.replace(/\D/g, '')
    if (code.length < 8 || offStatus === 'loading') return
    setOffStatus('loading'); setOffFood(null)
    try {
      const { alimento } = await buscarPorCodigoDeBarras(code)
      setOffFood(alimento)
      setOffStatus('idle')
    } catch {
      setOffStatus('error')
    }
  }
  // Busca unificada (TACO + banco local) com debounce enquanto digita
  useEffect(() => {
    if (!open || q.trim().length < 2) { setTacoHits([]); return }
    setTacoStatus('loading')
    const id = setTimeout(() => {
      buscarPorNome(q, { limite: 12 })
        .then((alimentos) => { setTacoHits(alimentos); setTacoStatus('ready') })
        .catch(() => { setTacoHits([]); setTacoStatus('offline') })
    }, 350)
    return () => clearTimeout(id)
  }, [open, q])
  const pick = (f) => { setPicked(f); setGrams(String(f.baseGrams || 100)) }
  const confirmCalc = () => {
    if (!picked || !(Number(grams) > 0)) return
    addFoodToMeal(day, open, calc)
    setOpen(null); setPicked(null)
  }
  const addCustom = () => {
    if (!custom.name.trim() || !Number(custom.kcal)) return
    addFoodToMeal(day, open, { name: custom.name.trim(), kcal: Number(custom.kcal), prot: Number(custom.prot) || 0, carb: Number(custom.carb) || 0, fat: Number(custom.fat) || 0, unit: 'porção informada' })
    setCustom({ name: '', kcal: '', prot: '', carb: '', fat: '' })
    setOpen(null)
  }

  return (
    <div className="space-y-4">
      {/* QUANTO COMER HOJE — meta do cronograma */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">🍽️ Quanto comer hoje (Miguel)</p>
        <div className="flex justify-between items-end mt-1">
          <p className="font-black text-2xl">{Math.round(totals.k)} <span className="text-sm font-bold opacity-80">de {TARGETS.kcal} kcal</span></p>
          <span className={`text-xs font-black px-2.5 py-1.5 rounded-full ${remain >= 0 ? 'bg-white/20' : 'bg-red-500'}`}>
            {remain >= 0 ? `faltam ${remain}` : `+${-remain} acima`}
          </span>
        </div>
        <p className="text-[11px] opacity-80 mt-1">TDEE {TARGETS.tdee} − {TARGETS.defPct}% • P {TARGETS.protein}g • C {TARGETS.carbs}g • G {TARGETS.fat}g</p>
      </div>
      {/* RESUMO FIXO — acompanha a rolagem no celular */}
      <div className="sticky top-2 z-20 bg-white dark:bg-[#1E293B] rounded-2xl border p-4 sm:p-5 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="font-black text-base sm:text-lg">Dia {day} — {Math.round(totals.k)} / {TARGETS.kcal} kcal</h2>
          <span className={`text-xs font-black px-2.5 py-1.5 rounded-full ${remain >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {remain >= 0 ? `faltam ${remain}` : `+${-remain} acima`}
          </span>
        </div>
        <p className="text-[11px] opacity-50 mt-0.5">Meta p/ {user.weight}kg • P {TARGETS.protein}g • C {TARGETS.carbs}g • G {TARGETS.fat}g</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 mt-2 text-xs font-bold">
          <div>P {Math.round(totals.pr)}g/{TARGETS.protein}g{bar(totals.pr, TARGETS.protein, 'bg-emerald-500')}</div>
          <div>C {Math.round(totals.c)}g/{TARGETS.carbs}g{bar(totals.c, TARGETS.carbs, 'bg-amber-500')}</div>
          <div>G {Math.round(totals.f)}g/{TARGETS.fat}g{bar(totals.f, TARGETS.fat, 'bg-blue-500')}</div>
          <div>Kcal {Math.round(totals.k)}/{TARGETS.kcal}{bar(totals.k, TARGETS.kcal, 'bg-orange-500')}</div>
        </div>
      </div>

      {MEALS.map((m) => {
        const eaten = !!mealLog[m.id]?.eaten
        const extras = mealLog[m.id]?.extraItems ?? []
        const items = [...m.items.map((x) => ({ ...x, base: true })), ...extras]
        const kcal = items.reduce((a, b) => a + b.kcal, 0)
        const isCollapsed = !!collapsed[m.id]
        return (
          <div key={m.id} className={`rounded-2xl border bg-white dark:bg-[#1E293B] overflow-hidden ${eaten ? 'border-emerald-500/50' : ''}`}>
            <button onClick={() => setCollapsed({ ...collapsed, [m.id]: !isCollapsed })}
              className="w-full p-4 flex justify-between items-center gap-2 text-left min-h-[64px]">
              <div className="flex items-center gap-3">
                <span className={`text-lg transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>›</span>
                <div>
                  <h3 className="font-extrabold text-base">{m.title} <span className="text-xs font-mono opacity-50">{m.time}</span></h3>
                  <p className="text-xs opacity-60">{kcal} kcal • P{items.reduce((a, b) => a + b.prot, 0).toFixed(0)}g • C{items.reduce((a, b) => a + b.carb, 0).toFixed(0)}g • G{items.reduce((a, b) => a + b.fat, 0).toFixed(0)}g</p>
                </div>
              </div>
              {eaten && <span className="text-[11px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white shrink-0">COMI ✓</span>}
            </button>

            {!isCollapsed && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => openSheet(m.id)} className="min-h-[52px] rounded-xl bg-orange-500 text-white font-black text-sm active:scale-95">+ Lançar comida</button>
                  <button onClick={() => toggleMealEaten(day, m.id)} className={`min-h-[52px] rounded-xl font-black text-sm active:scale-95 ${eaten ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'}`}>{eaten ? '✓ Comido' : 'Marcar comido'}</button>
                </div>
                <div className="space-y-1.5">
                  {items.map((it, idx) => (
                    <div key={it.base ? `b-${idx}` : it.id} className="flex justify-between items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border p-3">
                      <span className="font-bold text-sm">{it.name} <span className="block font-normal opacity-60 text-xs">{it.qty} {it.unit} • {it.kcal} kcal</span></span>
                      <span className="flex items-center gap-2 shrink-0 text-xs">
                        <span className="opacity-60 text-right">P{it.prot}<br />C{it.carb} G{it.fat}</span>
                        {!it.base && <button onClick={() => removeExtraItem(day, m.id, it.id)} title="Remover" className="min-w-[44px] min-h-[44px] rounded-lg text-red-500 bg-red-500/10 font-black text-lg">×</button>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setOpen(null)}>
          <div className="w-full sm:max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-5 max-h-[92dvh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-base">Lançar em: {MEALS.find((m) => m.id === open)?.title}</h3>

            {!picked ? (
              <>
                {/* CÓDIGO DE BARRAS — Open Food Facts */}
                <div className="mt-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5">
                  <p className="text-[11px] font-black opacity-70">📷 Código de barras (Open Food Facts)</p>
                  <div className="flex gap-2 mt-1.5">
                    <input value={barcode} onChange={(e) => setBarcode(e.target.value)} inputMode="numeric" placeholder="Ex: 7894900010015"
                      className="flex-1 min-h-[52px] px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border font-mono text-center" />
                    <button onClick={searchBarcode} disabled={barcode.replace(/\D/g, '').length < 8 || offStatus === 'loading'}
                      className="min-h-[52px] px-5 rounded-xl bg-blue-500 text-white font-black disabled:opacity-40 active:scale-95">
                      {offStatus === 'loading' ? '…' : 'Buscar'}
                    </button>
                  </div>
                  {offStatus === 'error' && <p className="text-[11px] text-red-500 font-bold mt-1">Não achei esse código — confira os números ou cadastre avulso abaixo.</p>}
                  {offFood && (
                    <button onClick={() => pick(foodParaItemRefeicao(offFood))}
                      className="mt-2 w-full min-h-[56px] px-3 py-2 rounded-xl bg-blue-500/10 text-left border border-blue-500/40 active:scale-[0.99] flex justify-between items-center gap-2">
                      <span className="font-bold text-sm">{offFood.nome}{offFood.marca ? ` (${offFood.marca})` : ''}
                        <span className="block text-[11px] font-normal opacity-60">100g = {offFood.calorias_100g} kcal • P{offFood.proteinas_100g} C{offFood.carboidratos_100g} G{offFood.gorduras_100g}{offFood.nutri_score ? ` • Nutri-Score ${offFood.nutri_score}` : ''}</span>
                      </span>
                      <span className="font-black text-blue-500">›</span>
                    </button>
                  )}
                </div>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que você comeu? (ex: frango, arroz…)"
                  className="mt-2 w-full min-h-[52px] px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border text-sm" />
                <div className="mt-3 space-y-1.5 max-h-64 overflow-auto">
                  {filtered.map((f) => (
                    <button key={f.name} onClick={() => pick(f)}
                      className="w-full min-h-[56px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-left border active:scale-[0.99] flex justify-between items-center gap-2">
                      <span className="font-bold text-sm">{f.name}<span className="block text-[11px] font-normal opacity-60">{f.unit} = {f.kcal} kcal</span></span>
                      <span className="font-black text-orange-500">›</span>
                    </button>
                  ))}
                  {!filtered.length && !tacoHits.length && <p className="text-xs opacity-60">Nada encontrado — cadastre abaixo.</p>}
                </div>
                {tacoHits.length > 0 && (
                  <>
                    <p className="text-[11px] font-black mt-3 mb-1 opacity-60">🌐 TACO + salvos ({tacoHits.length})</p>
                    <div className="space-y-1.5 max-h-56 overflow-auto">
                      {tacoHits.map((f) => {
                        const item = foodParaItemRefeicao(f)
                        return (
                          <button key={f.id} onClick={() => pick(item)}
                            className="w-full min-h-[56px] px-3 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 text-left border border-emerald-500/30 active:scale-[0.99] flex justify-between items-center gap-2">
                            <span className="font-bold text-sm">{f.nome}<span className="block text-[11px] font-normal opacity-60">100g = {f.calorias_100g} kcal • P{f.proteinas_100g} C{f.carboidratos_100g} G{f.gorduras_100g}{f.fonte === 'LOCAL' ? ' • salvo' : ''}</span></span>
                            <span className="font-black text-emerald-500">›</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
                {q.trim().length >= 2 && tacoStatus === 'loading' && <p className="text-[11px] opacity-50 mt-1">🌐 Buscando alimentos…</p>}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-black mb-2">+ Comida avulsa (vale da refeição)</p>
                  <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Nome do que você comeu" className="w-full min-h-[52px] px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border text-sm mb-2" />
                  <div className="grid grid-cols-4 gap-2">
                    {[['kcal', 'Kcal'], ['prot', 'Prot'], ['carb', 'Carb'], ['fat', 'Gord']].map(([k, l]) => (
                      <label key={k} className="text-[11px] font-bold">{l}
                        <input type="number" value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
                          className="mt-0.5 w-full min-h-[48px] px-2 rounded-xl bg-slate-100 dark:bg-slate-900 border text-sm text-center" />
                      </label>
                    ))}
                  </div>
                  <button onClick={addCustom} className="mt-2 w-full min-h-[52px] rounded-xl bg-orange-500 text-white font-black">Adicionar</button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setPicked(null)} className="mt-1 text-xs font-bold text-orange-500">‹ trocar alimento</button>
                <h4 className="font-extrabold text-lg mt-1">{picked.name}</h4>
                <p className="text-xs opacity-60">Porção-base: {picked.unit} = {picked.kcal} kcal</p>

                <div className="grid grid-cols-4 gap-2 mt-3">
                  {portionPresets(picked).map((pr) => (
                    <button key={pr.mult} onClick={() => setGrams(String(pr.grams))}
                      className={`min-h-[52px] rounded-xl border font-black text-sm ${Number(grams) === pr.grams ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {pr.mult}×<span className="block text-[10px] font-normal">{pr.grams}g</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => setGrams(String(Math.max(0, (Number(grams) || 0) - 10)))} className="min-w-[56px] min-h-[56px] rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xl">−</button>
                  <label className="flex-1 text-center text-xs font-bold">Gramas que você comeu
                    <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)}
                      className="mt-1 w-full min-h-[56px] rounded-xl bg-slate-100 dark:bg-slate-900 border font-black text-xl text-center" />
                  </label>
                  <button onClick={() => setGrams(String((Number(grams) || 0) + 10))} className="min-w-[56px] min-h-[56px] rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xl">+</button>
                </div>

                {calc && (
                  <div className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                    <p className="text-3xl font-black">{calc.kcal}<span className="text-sm font-bold"> kcal</span></p>
                    <p className="text-sm font-bold mt-1">P {calc.prot}g • C {calc.carb}g • G {calc.fat}g</p>
                    <p className="text-[11px] opacity-60">em {calc.qty}g</p>
                  </div>
                )}
                <button onClick={confirmCalc} disabled={!(Number(grams) > 0)}
                  className="mt-3 w-full min-h-[56px] rounded-xl bg-orange-500 text-white font-black text-base disabled:opacity-40 active:scale-95">
                  ✓ Lançar {grams || 0}g na refeição
                </button>
              </>
            )}
            <button onClick={() => setOpen(null)} className="mt-2 w-full min-h-[48px] rounded-xl border font-bold">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
