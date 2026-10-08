// TACO — Tabela Brasileira de Composição de Alimentos (UNICAMP/NEPA).
// Fonte: repositório brolesi/taco (CSV processado, valores por 100 g).
// Transporte + parse cru. O mapeamento p/ DTO unificado vive em foods/mappers.js.
// O serviço unificado (busca + cache + cálculo) vive em foods/foodService.js.
import { fetchComTimeout } from './foods/http.js'
import { mapTacoRowParaFood } from './foods/mappers.js'
import { foodParaItemRefeicao } from './foods/schema.js'

export const TACO_CSV_URL =
  'https://raw.githubusercontent.com/brolesi/taco/main/data/processed/taco/taco_composicao.csv'

const CACHE_KEY = 'projeto133:taco:v1'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const j = JSON.parse(raw)
    if (!Array.isArray(j.rows) || !j.rows.length) return null
    return j.rows
  } catch {
    return null
  }
}

function writeCache(rows) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, at: Date.now(), rows }))
  } catch {
    // storage cheio = segue sem cache
  }
}

// Parser CSV robusto: campos entre aspas podem conter vírgulas ("Arroz, integral, cozido")
export function parseTacoCSV(text) {
  const rows = []
  let field = '', row = [], inQuotes = false
  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { rows.push(row); row = [] }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } // aspas escapadas
        else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') pushField()
    else if (ch === '\n') { pushField(); pushRow() }
    else if (ch === '\r') { /* ignora (CRLF) */ }
    else field += ch
  }
  if (field !== '' || row.length) { pushField(); pushRow() }

  const data = rows.filter((r) => r.length > 1 && r[0] !== 'numero_alimento')
  const header = rows[0] || []
  const idx = (name) => header.indexOf(name)
  const iDesc = idx('descricao'), iKcal = idx('energia_kcal')
  const iProt = idx('proteina_g'), iFat = idx('lipideos_g')
  const iCarb = idx('carboidrato_g'), iFibra = idx('fibra_g'), iCat = idx('categoria')
  if (iDesc < 0 || iKcal < 0) throw new Error('CSV TACO em formato inesperado')
  const num = (v) => {
    const n = Number(String(v ?? '').replace(',', '.'))
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  return data.map((r) => ({
    descricao: (r[iDesc] || '').trim(),
    kcal100: num(r[iKcal]),
    prot100: num(r[iProt]),
    fat100: num(r[iFat]),
    carb100: num(r[iCarb]),
    fibra100: iFibra >= 0 ? num(r[iFibra]) : 0,
    categoria: (r[iCat] || '').trim(),
  })).filter((x) => x.descricao && x.kcal100 > 0)
}

let memCache = null

// Baixa a tabela (1x) e salva no banco local p/ uso offline.
// Retorna { rows, fromCache } ou lança erro (quem chama decide o fallback).
export async function fetchTacoTable({ force = false } = {}) {
  if (!force && memCache) return { rows: memCache, fromCache: true }
  if (!force) {
    const cached = readCache()
    if (cached) { memCache = cached; return { rows: cached, fromCache: true } }
  }
  const res = await fetchComTimeout(TACO_CSV_URL, { timeoutMs: 20000 })
  if (!res.ok) throw new Error(`TACO HTTP ${res.status}`)
  const rows = parseTacoCSV(await res.text())
  memCache = rows
  writeCache(rows)
  return { rows, fromCache: false }
}

export function clearTacoCache() {
  memCache = null
  try { localStorage.removeItem(CACHE_KEY) } catch { /* noop */ }
}

// Normaliza p/ busca: minúsculas + sem acentos ("Açaí" acha "acai")
export function normTaco(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Busca por nome: todos os termos precisam aparecer (AND), ranqueado por
// relevância (match no início + nome curto primeiro). Ex: 'arroz integral'.
export function searchTaco(rows, query, limit = 12) {
  const terms = normTaco(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const scored = []
  for (const r of rows) {
    const hay = normTaco(r.descricao)
    let pos = -1, ok = true
    for (const t of terms) {
      const p = hay.indexOf(t)
      if (p < 0) { ok = false; break }
      if (pos < 0 || p < pos) pos = p
    }
    if (ok) scored.push({ r, score: pos * 10 + r.descricao.length })
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((s) => s.r)
}

// Converte linha TACO p/ o formato de alimento do app (base 100 g).
// Delega ao DTO unificado (foods/) — mesma saída de antes.
export function tacoToFood(row) {
  const food = mapTacoRowParaFood(row)
  if (!food) throw new Error('TACO_INVALIDO')
  return { ...foodParaItemRefeicao(food), categoria: row.categoria || '' }
}

// Cálculo direto: dado o item e as gramas, retorna kcal + macros.
// Ex: calcTacoNutrition(arrozIntegralTACO, 150) → 150 g de arroz.
export function calcTacoNutrition(row, grams) {
  const g = Math.max(0, Number(grams) || 0)
  const f = g / 100
  const r1 = (v) => Number((v * f).toFixed(1))
  return {
    descricao: row.descricao,
    gramas: g,
    kcal: Math.round(row.kcal100 * f),
    prot: r1(row.prot100),
    carb: r1(row.carb100),
    fat: r1(row.fat100),
  }
}
