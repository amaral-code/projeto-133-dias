// Open Food Facts — busca por código de barras (EAN-8/13, UPC).
// Endpoint: GET world.openfoodfacts.org/api/v2/product/{codigo}.json
// Retorna valores por 100 g (nutriments.*_100g) + Nutri-Score/NOVA de brinde.
//
// Uso:
//   const item = await fetchOffProduct('7891234567890') // lança se não achar
//   const refeicao = calcOffNutrition(item, 40)          // 40 g → kcal/P/C/G

const FIELDS = 'code,product_name,brands,quantity,nutriments,nutriscore_grade,nova_group'

export const offURL = (barcode) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(String(barcode).trim())}.json?fields=${FIELDS}`

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

// Normaliza o JSON da API p/ o formato interno (por 100 g).
// Retorna null se o produto não existe ou não tem dados de energia.
export function parseOffProduct(json) {
  if (!json || json.status !== 1 || !json.product) return null
  const p = json.product
  const nt = p.nutriments ?? {}
  let kcal = num(nt['energy-kcal_100g'] ?? nt['energy-kcal_value'])
  if (!kcal) {
    const kj = num(nt.energy_100g ?? nt.energy_value)
    if (kj) kcal = Math.round(kj / 4.184) // fallback: kJ → kcal
  }
  if (!kcal) return null
  const name = String(p.product_name ?? '').trim() || 'Produto sem nome'
  const brands = String(p.brands ?? '').trim()
  return {
    barcode: String(json.code ?? p.code ?? ''),
    name: brands ? `${name} (${brands.split(',')[0].trim()})` : name,
    quantity: String(p.quantity ?? '').trim(),
    kcal100: kcal,
    prot100: num(nt.proteins_100g ?? nt.proteins_value),
    carb100: num(nt.carbohydrates_100g ?? nt.carbohydrates_value),
    fat100: num(nt.fat_100g ?? nt.fat_value),
    nutri: String(p.nutriscore_grade ?? '').toUpperCase() || null, // A–E
    nova: p.nova_group ?? null, // 1–4
  }
}

// Busca o produto. Erro 'NOT_FOUND' = código não cadastrado;
// outros erros = rede/offline (quem chama decide o fallback).
export async function fetchOffProduct(barcode) {
  const code = String(barcode ?? '').replace(/\D/g, '')
  if (code.length < 8) throw new Error('BARCODE_INVALID')
  const res = await fetch(offURL(code))
  if (!res.ok) throw new Error(`OFF HTTP ${res.status}`)
  const item = parseOffProduct(await res.json())
  if (!item) throw new Error('NOT_FOUND')
  return item
}

// Converte p/ o formato de alimento do app (base 100 g — funciona com
// scaleFood() e com o lançamento em gramas da Comida).
export function offToFood(item) {
  return {
    name: `${item.name} (OFF)`,
    kcal: item.kcal100,
    prot: item.prot100,
    carb: item.carb100,
    fat: item.fat100,
    unit: '100g (Open Food Facts)',
    baseGrams: 100,
    nutri: item.nutri,
    nova: item.nova,
  }
}

// Cálculo direto: item + gramas → kcal e macros.
export function calcOffNutrition(item, grams) {
  const g = Math.max(0, Number(grams) || 0)
  const f = g / 100
  const r1 = (v) => Number((v * f).toFixed(1))
  return {
    name: item.name,
    gramas: g,
    kcal: Math.round(item.kcal100 * f),
    prot: r1(item.prot100),
    carb: r1(item.carb100),
    fat: r1(item.fat100),
  }
}
