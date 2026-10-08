// Open Food Facts — busca por código de barras (EAN-8/13, UPC).
// Endpoint: GET world.openfoodfacts.org/api/v2/product/{codigo}.json
// Transporte + parse. O mapeamento p/ DTO unificado vive em foods/mappers.js.
// O serviço unificado (busca + cache + cálculo) vive em foods/foodService.js.
import { mapOffJsonParaFood } from './foods/mappers.js'
import { createFood, gerarIdAlimento, FONTES, foodParaItemRefeicao } from './foods/schema.js'

const FIELDS = 'code,product_name,brands,quantity,nutriments,nutriscore_grade,nova_group'

export const offURL = (barcode) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(String(barcode).trim())}.json?fields=${FIELDS}`

// Normaliza o JSON da API p/ o formato interno (por 100 g).
// Delega ao DTO unificado — mesma saída de antes.
export function parseOffProduct(json) {
  const food = mapOffJsonParaFood(json)
  if (!food) return null
  const p = json?.product ?? json
  return {
    barcode: food.codigo_barras ?? '',
    name: food.marca ? `${food.nome} (${food.marca})` : food.nome,
    quantity: String(p.quantity ?? '').trim(),
    kcal100: food.calorias_100g,
    prot100: food.proteinas_100g,
    carb100: food.carboidratos_100g,
    fat100: food.gorduras_100g,
    nutri: food.nutri_score,
    nova: food.nova_group,
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

// Converte p/ o formato de alimento do app (base 100 g).
// Delega ao DTO unificado — mesma saída de antes.
export function offToFood(item) {
  const food = createFood({
    id: gerarIdAlimento(FONTES.OFF, item.barcode || item.name),
    nome: String(item.name).replace(/\s*\(OFF\)$/, ''),
    marca: null,
    codigo_barras: item.barcode || null,
    fonte: FONTES.OFF,
    calorias_100g: item.kcal100,
    proteinas_100g: item.prot100,
    carboidratos_100g: item.carb100,
    gorduras_100g: item.fat100,
  })
  return { ...foodParaItemRefeicao(food), nutri: item.nutri ?? null, nova: item.nova ?? null }
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
