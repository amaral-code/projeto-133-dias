// FoodService — ponto único de busca de alimentos (TACO + OFF + banco local).
//
//   buscarPorCodigoDeBarras(codigo) → { alimento, origem: 'banco' | 'open_food_facts' }
//   buscarPorNome(termo, { incluirOff }) → Food[] (TACO + banco; + OFF textual se pedir)
//   calcularNutrientesPorPorcao(alimento, gramas) → nutrientes da refeição
//
// Erros (e.code): BARCODE_INVALIDO · NAO_ENCONTRADO · TIMEOUT · REDE_INDISPONIVEL.

import { fetchTacoTable, searchTaco } from '../taco.js'
import { mapTacoRowParaFood, mapOffJsonParaFood } from './mappers.js'
import { salvarAlimento, buscarAlimentoPorCodigo, buscarAlimentosPorNome } from './foodDb.js'
import { fetchComTimeout } from './http.js'
import { offURL } from '../off.js'

const OFF_TIMEOUT_MS = 12000
const TACO_TIMEOUT_MS = 20000

const offSearchURL = (termo, pageSize = 10) =>
  `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(termo)}&search_simple=1&action=process&json=1&page_size=${pageSize}`

function erro(code, message) {
  const e = new Error(`[${code}] ${message}`)
  e.code = code
  return e
}

function redeOuTimeout(e, contexto) {
  if (e?.code === 'TIMEOUT') throw e
  throw erro('REDE_INDISPONIVEL', `${contexto} indisponível (sem rede?): ${e?.message ?? e}`)
}

// 1) Código de barras: banco local primeiro → OFF → salva p/ cache futuro.
export async function buscarPorCodigoDeBarras(codigo, { usarRede = true, timeoutMs = OFF_TIMEOUT_MS } = {}) {
  const digits = String(codigo ?? '').replace(/\D/g, '')
  if (digits.length < 8) throw erro('BARCODE_INVALIDO', 'Código de barras deve ter ao menos 8 dígitos')

  const local = await buscarAlimentoPorCodigo(digits)
  if (local) return { alimento: local, origem: 'banco' }
  if (!usarRede) throw erro('NAO_ENCONTRADO', 'Produto não está no banco local')

  let json
  try {
    const res = await fetchComTimeout(offURL(digits), { timeoutMs })
    if (!res.ok) throw erro('REDE_INDISPONIVEL', `Open Food Facts HTTP ${res.status}`)
    json = await res.json()
  } catch (e) {
    redeOuTimeout(e, 'Open Food Facts')
  }
  const alimento = mapOffJsonParaFood(json)
  if (!alimento) throw erro('NAO_ENCONTRADO', 'Produto não cadastrado no Open Food Facts')
  try {
    await salvarAlimento(alimento)
  } catch (e) {
    if (e?.code !== 'DUPLICADO') throw e
  }
  return { alimento, origem: 'open_food_facts' }
}

// 2) Nome: TACO + banco local (offline-first); opcionalmente + busca textual OFF.
export async function buscarPorNome(termo, { incluirOff = false, limite = 12, tabelaTaco = null, timeoutMs = OFF_TIMEOUT_MS } = {}) {
  const q = String(termo ?? '').trim()
  if (q.length < 2) return []

  let rows = tabelaTaco
  if (!rows) {
    try {
      ;({ rows } = await fetchTacoTable())
    } catch {
      rows = [] // offline: segue só com o banco local
    }
  }
  const doTaco = searchTaco(rows, q, limite).map(mapTacoRowParaFood).filter(Boolean)
  const locais = await buscarAlimentosPorNome(q, limite)

  const vistos = new Set()
  const out = []
  for (const a of [...doTaco, ...locais]) {
    if (!vistos.has(a.id)) { vistos.add(a.id); out.push(a) }
    if (out.length >= limite) break
  }

  if (incluirOff) {
    try {
      const res = await fetchComTimeout(offSearchURL(q), { timeoutMs })
      if (res.ok) {
        const json = await res.json()
        for (const p of json?.products ?? []) {
          const a = mapOffJsonParaFood(p)
          if (a && !vistos.has(a.id)) {
            vistos.add(a.id)
            out.push(a)
            try { await salvarAlimento(a) } catch { /* cache best-effort */ }
            if (out.length >= limite) break
          }
        }
      }
    } catch {
      // busca OFF é opcional: silencia e retorna o que já tem
    }
  }
  return out
}

// 3) Regra de três: (valor_100g × gramas) / 100, 2 casas decimais.
export function calcularNutrientesPorPorcao(alimento, gramas) {
  const g = Math.max(0, Number(gramas) || 0)
  const f = g / (Number(alimento?.porcao_referencia_g) > 0 ? Number(alimento.porcao_referencia_g) : 100)
  const r2 = (v) => Number((Number(v) * f).toFixed(2))
  return {
    id: alimento?.id ?? null,
    nome: alimento?.nome ?? '',
    marca: alimento?.marca ?? null,
    fonte: alimento?.fonte ?? null,
    gramas: g,
    calorias: r2(alimento?.calorias_100g ?? 0),
    proteinas: r2(alimento?.proteinas_100g ?? 0),
    carboidratos: r2(alimento?.carboidratos_100g ?? 0),
    gorduras: r2(alimento?.gorduras_100g ?? 0),
    fibras: r2(alimento?.fibras_100g ?? 0),
  }
}

export { TACO_TIMEOUT_MS, OFF_TIMEOUT_MS }
