// Trocas equivalentes — "não vou comer isso, e agora?"
// Dado o item original do plano, sugere alimentos com kcal e proteína
// parecidas (normalizados por 100g), com a quantidade equivalente já calculada.
// Candidatos: EXTRA_FOODS + itens do plano + alimentos do banco local (via param).

// Normaliza qualquer item {kcal, prot, carb, fat, baseGrams?} para valores /100g.
export function per100(it = {}) {
  const base = Number(it.baseGrams) > 0 ? Number(it.baseGrams) : per100FromQty(it)
  const f = 100 / base
  return {
    kcal: (Number(it.kcal) || 0) * f,
    prot: (Number(it.prot) || 0) * f,
    carb: (Number(it.carb) || 0) * f,
    fat: (Number(it.fat) || 0) * f,
  }
}

// Itens do plano têm qty+unit em vez de baseGrams: estima a base em gramas
// a partir do unit ("(80g)", "(150g)") ou assume 100g.
function per100FromQty(it) {
  const m = String(it.unit ?? '').match(/\(?\s*(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i)
  if (m) return Number(m[1].replace(',', '.')) * (Number(it.qty) || 1)
  if (Number(it.qty) > 0 && Number(it.qty) < 20) return 100 // unidade pequena (scoop, fatia)
  return 100
}

// Score: diferença de kcal pesa 1, de proteína pesa 2 (foco do plano).
function score(a100, b100) {
  const dk = Math.abs(a100.kcal - b100.kcal) / Math.max(50, a100.kcal)
  const dp = Math.abs(a100.prot - b100.prot) / Math.max(5, a100.prot)
  return dk + dp * 2
}

// Retorna até `limite` trocas [{ food, grams, kcal, prot, carb, fat, diffKcal }].
// grams = quantidade do candidato que equivale ao kcal do original.
export function findSwaps(original, candidates = [], { limite = 5 } = {}) {
  if (!original) return []
  const o100 = per100(original)
  const oKcal = Number(original.kcal) || 0
  if (!(oKcal > 0)) return []
  const seen = new Set([String(original.name ?? '').toLowerCase()])
  const out = []
  for (const c of candidates) {
    const name = String(c?.name ?? c?.nome ?? '').trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    const c100 = per100({
      kcal: c.kcal ?? c.calorias_100g,
      prot: c.prot ?? c.proteinas_100g,
      carb: c.carb ?? c.carboidratos_100g,
      fat: c.fat ?? c.gorduras_100g,
      baseGrams: c.baseGrams ?? 100,
    })
    if (!(c100.kcal > 0)) continue
    // Só sugere se a densidade calórica não for absurda (até 3x p/ cima ou p/ baixo)
    const ratio = c100.kcal / Math.max(1, o100.kcal)
    if (ratio > 3 || ratio < 1 / 3) continue
    const grams = Math.max(5, Math.round((oKcal / c100.kcal) * 100))
    const f = grams / 100
    out.push({
      food: { name, unit: `${c.unit ?? '100g'}`, baseGrams: 100, kcal: c100.kcal, prot: c100.prot, carb: c100.carb, fat: c100.fat },
      grams,
      kcal: Math.round(c100.kcal * f),
      prot: Number((c100.prot * f).toFixed(1)),
      carb: Number((c100.carb * f).toFixed(1)),
      fat: Number((c100.fat * f).toFixed(1)),
      diffKcal: Math.round(c100.kcal * f - oKcal),
      _score: score(o100, c100),
    })
  }
  out.sort((a, b) => a._score - b._score)
  return out.slice(0, limite).map(({ _score, ...r }) => r)
}
