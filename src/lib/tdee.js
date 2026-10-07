// Fórmulas do cronograma oficial (projeto-133-dias.html) — NÃO ALTERAR.
// BMR Mifflin-St Jeor (homem +5 / mulher −161), TDEE = TMB × 1.65,
// meta = TDEE − defPct%, proteína 2g/kg, gordura 0.9g/kg, água 43ml/kg.
export function calcBMR({ weightKg, heightCm, age, sex = 'M' }) {
  const s = String(sex).toUpperCase().startsWith('F') ? -161 : 5
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s)
}
export function calcTDEE(bmr, factor = 1.65) {
  return Math.round((bmr * factor) / 10) * 10
}
export function calcTargetCalories(tdee, defPct = 15) {
  return Math.round((tdee * (1 - defPct / 100)) / 10) * 10
}
// Compat: déficit em kcal (legado) → converte p/ %
export function deficitKcalToPct(tdee, deficitKcal) {
  if (!tdee) return 15
  return Math.round((deficitKcal / tdee) * 100)
}
export function calcIMC(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0
  return Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1))
}
export function calcMaxHR(age) {
  return Math.round(208 - 0.7 * age)
}
// Metas dinâmicas por peso (cut ~2g prot/kg, 0.9g fat/kg, resto carbo)
export function calcMacros({ weightKg, targetKcal }) {
  const w = Number(weightKg) || 70
  const protein = Math.round(w * 2)
  const fat = Math.round(w * 0.9)
  const carbs = Math.max(0, Math.round(((Number(targetKcal) || 2000) - protein * 4 - fat * 9) / 4))
  return { kcal: Number(targetKcal) || 2000, protein, carbs, fat }
}
// Água: 43ml/kg (cronograma) — ex: 70kg ≈ 3000ml
export function calcWaterGoal(weightKg, mlPerKg = 43) {
  return Math.round(((Number(weightKg) || 70) * mlPerKg) / 100) * 100
}
export function imcClass(imc) {
  if (!imc) return '—'
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25) return 'Normal ✓'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidade'
}
export const DEFAULT_TARGETS = { kcal: 2050, protein: 160, carbs: 210, fat: 55 }
