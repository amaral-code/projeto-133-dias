// Banco local de alimentos — tabela `foods` com índices de busca rápida:
//   - codigo_barras → UNIQUE (Map byBarcode)
//   - nome → busca normalizada sem acento (lista byName)
// Implementado sobre localforage (store própria `foods`) + espelho em memória
// (funciona em Node/testes e sobrevive a storage indisponível no navegador).

import localforage from 'localforage'

let store = null
try {
  store = localforage.createInstance({
    name: 'Projeto133',
    storeName: 'foods',
    description: 'Catálogo unificado de alimentos (TACO + OFF + local)',
  })
} catch {
  store = null
}

const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

//Espelho em memória: { byId: Map, byBarcode: Map, names: [{ id, n }] }
let cache = null
let loaded = false

async function persistRecord(food) {
  if (!store) return
  try {
    await store.setItem(`food:${food.id}`, food)
  } catch {
    // quota/bloqueio: memória continua valendo
  }
}

async function ensureLoaded() {
  if (loaded) return
  loaded = true
  cache = { byId: new Map(), byBarcode: new Map(), names: [] }
  if (!store) return
  try {
    await store.iterate((food, key) => {
      if (!String(key).startsWith('food:') || !food?.id) return
      indexInMemory(food)
    })
  } catch {
    // sem driver (Node): segue só com memória
  }
}

function indexInMemory(food) {
  cache.byId.set(food.id, food)
  if (food.codigo_barras) cache.byBarcode.set(String(food.codigo_barras), food.id)
  const n = norm(food.nome)
  const i = cache.names.findIndex((e) => e.id === food.id)
  if (i >= 0) cache.names[i].n = n
  else cache.names.push({ id: food.id, n })
}

// Upsert. codigo_barras é UNIQUE: se o código já pertence a outro id, lança
// DUPLICADO (o chamador pode então apenas retornar o existente).
export async function salvarAlimento(food) {
  if (!food?.id || !food?.nome) throw new Error('FOOD_INVALIDO')
  await ensureLoaded()
  if (food.codigo_barras) {
    const dono = cache.byBarcode.get(String(food.codigo_barras))
    if (dono && dono !== food.id) {
      const e = new Error(`DUPLICADO: codigo_barras ${food.codigo_barras} já cadastrado`)
      e.code = 'DUPLICADO'
      throw e
    }
  }
  indexInMemory(food)
  await persistRecord(food)
  return food
}

export async function buscarAlimentoPorCodigo(codigo) {
  const digits = String(codigo ?? '').replace(/\D/g, '')
  if (!digits) return null
  await ensureLoaded()
  const id = cache.byBarcode.get(digits)
  return id ? cache.byId.get(id) ?? null : null
}

export async function buscarAlimentosPorNome(termo, limite = 12) {
  const terms = norm(termo).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  await ensureLoaded()
  const out = []
  for (const { id, n } of cache.names) {
    if (terms.every((t) => n.includes(t))) {
      out.push(cache.byId.get(id))
      if (out.length >= limite) break
    }
  }
  return out
}

export async function listarAlimentos() {
  await ensureLoaded()
  return [...cache.byId.values()]
}

export async function limparAlimentos() {
  cache = { byId: new Map(), byBarcode: new Map(), names: [] }
  loaded = true
  if (!store) return
  try {
    await store.clear()
  } catch {
    // noop
  }
}
