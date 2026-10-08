// Mappers — traduzem TACO e Open Food Facts para o DTO unificado (schema.js).
import { createFood, gerarIdAlimento, FONTES } from './schema.js'

// Linha crua do CSV TACO (ver parseTacoCSV em ../taco.js):
// { descricao, kcal100, prot100, fat100, carb100, fibra100?, categoria }
export function mapTacoRowParaFood(row) {
  if (!row?.descricao) return null
  return createFood({
    id: gerarIdAlimento(FONTES.TACO, row.descricao),
    nome: String(row.descricao).trim(),
    marca: null,
    codigo_barras: null,
    fonte: FONTES.TACO,
    porcao_referencia_g: 100,
    calorias_100g: row.kcal100,
    proteinas_100g: row.prot100,
    carboidratos_100g: row.carb100,
    gorduras_100g: row.fat100,
    fibras_100g: row.fibra100 ?? 0,
    categoria: row.categoria || null,
  })
}

// JSON cru da API Open Food Facts — aceita o envelope { status, product }
// ou o product direto (busca textual retorna products[]).
// Extrai product_name, brands, code e nutriments (com fallback kJ→kcal).
// Campos ausentes/nulos viram 0 (nunca NaN).
export function mapOffJsonParaFood(json) {
  const p = json?.product ?? json
  if (!p || typeof p !== 'object') return null
  if (json?.status != null && json.status !== 1) return null
  const nt = p.nutriments ?? {}
  const num = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  let kcal = num(nt['energy-kcal_100g'] ?? nt['energy-kcal_value'])
  if (!kcal) {
    const kj = num(nt.energy_100g ?? nt.energy_value)
    if (kj) kcal = Math.round(kj / 4.184)
  }
  if (!kcal) return null
  const nome = String(p.product_name ?? '').trim() || 'Produto sem nome'
  const brands = String(p.brands ?? '').trim()
  const marca = brands ? brands.split(',')[0].trim() || null : null
  const code = String(json?.code ?? p.code ?? '').replace(/\D/g, '') || null
  return createFood({
    id: gerarIdAlimento(FONTES.OFF, code ?? `${nome}-${marca ?? ''}`),
    nome,
    marca,
    codigo_barras: code,
    fonte: FONTES.OFF,
    porcao_referencia_g: 100,
    calorias_100g: kcal,
    proteinas_100g: num(nt.proteins_100g ?? nt.proteins_value),
    carboidratos_100g: num(nt.carbohydrates_100g ?? nt.carbohydrates_value),
    gorduras_100g: num(nt.fat_100g ?? nt.fat_value),
    fibras_100g: num(nt.fiber_100g ?? nt.fiber_value),
    categoria: null,
    nutri_score: String(p.nutriscore_grade ?? '').toUpperCase() || null,
    nova_group: p.nova_group ?? null,
  })
}
