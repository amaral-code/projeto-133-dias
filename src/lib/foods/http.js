// HTTP com timeout — base das requisições externas (TACO, Open Food Facts).
// Erros: TIMEOUT (AbortError) ou o erro original da rede (offline, DNS, HTTP).

export async function fetchComTimeout(url, { timeoutMs = 12000, ...init } = {}) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    return res
  } catch (e) {
    if (e?.name === 'AbortError') {
      const t = new Error(`TIMEOUT após ${timeoutMs}ms: ${url}`)
      t.code = 'TIMEOUT'
      throw t
    }
    throw e
  } finally {
    clearTimeout(id)
  }
}
