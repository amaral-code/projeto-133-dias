import localforage from 'localforage'

localforage.config({
  name: 'Projeto133',
  storeName: 'app_state',
  description: 'Offline-first: 133 dias de treino + dieta (IndexedDB, sem limite de 5MB)'
})

const KEY = 'projeto133:v1'
// Espelho síncrono: garante que fechar o app antes do debounce NÃO perde progresso
const MIRROR_KEY = 'projeto133:mirror'

function readMirror() {
  try {
    const raw = localStorage.getItem(MIRROR_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeMirror(state) {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(state))
  } catch {
    // storage cheio/bloqueado: IndexedDB continua valendo
  }
}

export async function loadPersisted() {
  try {
    const idb = await localforage.getItem(KEY)
    if (idb) {
      writeMirror(idb) // repara o espelho
      return idb
    }
  } catch {
    // IndexedDB indisponível: usa o espelho
  }
  return readMirror()
}

let saveTimer = null
let mirrorTimer = null
let pendingState = null
let mirrorPending = null

function flushToIDB() {
  if (!pendingState) return
  const s = pendingState
  pendingState = null
  localforage.setItem(KEY, s).catch(() => {})
}

function flushMirror() {
  mirrorTimer = null
  if (!mirrorPending) return
  const s = mirrorPending
  mirrorPending = null
  writeMirror(s)
}

export function savePersistedDebounced(state) {
  // IndexedDB com debounce curto (evita escrita excessiva)
  pendingState = state
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flushToIDB, 400)
  // Espelho localStorage com throttle de 1s: JSON.stringify do banco inteiro a
  // cada tecla travava o celular; 1s + descarga ao esconder/fechar não perde nada
  mirrorPending = state
  if (!mirrorTimer) {
    writeMirror(state) // 1ª escrita imediata
    mirrorTimer = setTimeout(flushMirror, 1000)
  }
}

// Descarrega o que estiver pendente (pagehide/visibilitychange)
if (typeof window !== 'undefined') {
  const flush = () => {
    if (mirrorTimer) { clearTimeout(mirrorTimer); flushMirror() }
    else if (mirrorPending) writeMirror(mirrorPending)
    mirrorPending = null
    if (pendingState) flushToIDB()
  };
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
}

export async function clearPersisted() {
  clearTimeout(saveTimer)
  pendingState = null
  try { localStorage.removeItem(MIRROR_KEY) } catch { /* noop */ }
  await localforage.removeItem(KEY)
}
