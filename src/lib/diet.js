// Helpers compartilhados de dieta — usados por Hoje e Comida.
// Garante que "quanto comer" e "quanto comi" sejam idênticos nas duas telas.
import { MEALS } from '../data/meals.js'
import { calcBMR, calcTDEE, calcTargetCalories, calcMacros } from './tdee.js'

export function targetsFor(user = {}) {
  const bmr = calcBMR({ weightKg: user.weight ?? 70, heightCm: user.height ?? 167, age: user.age ?? 19, sex: user.sex ?? 'M' })
  const tdee = calcTDEE(bmr)
  const kcal = calcTargetCalories(tdee, user.defPct ?? 15)
  return { ...calcMacros({ weightKg: user.weight ?? 70, targetKcal: kcal }), tdee, defPct: user.defPct ?? 15 }
}

// Totais consumidos no dia (plano-base + extras lançados)
export function dayTotals(mealLogDay = {}) {
  let k = 0, pr = 0, c = 0, f = 0
  for (const m of MEALS) {
    for (const it of [...(m.items ?? []), ...((mealLogDay[m.id]?.extraItems) ?? [])]) {
      k += Number(it.kcal) || 0
      pr += Number(it.prot) || 0
      c += Number(it.carb) || 0
      f += Number(it.fat) || 0
    }
  }
  return { k, pr, c, f }
}
