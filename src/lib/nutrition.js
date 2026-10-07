// Escala nutricional: você informa quantas gramas comeu e o app recalcula tudo.
// Cada alimento tem `baseGrams` = gramas às quais kcal/prot/carb/fat se referem.
export function scaleFood(food, grams) {
  const g = Math.max(0, Number(grams) || 0)
  const base = food.baseGrams || 100
  const f = g / base
  return {
    name: food.name,
    qty: g,
    unit: `gramas (equiv. ${food.unit})`,
    kcal: Math.round(food.kcal * f),
    prot: Number((food.prot * f).toFixed(1)),
    carb: Number((food.carb * f).toFixed(1)),
    fat: Number((food.fat * f).toFixed(1))
  }
}

// Porções rápidas: ½, 1, 1½, 2× a porção-base
export function portionPresets(food) {
  const base = food.baseGrams || 100
  return [0.5, 1, 1.5, 2].map((m) => ({ mult: m, grams: Math.round(base * m) }))
}
