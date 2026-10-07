// Micro-feedback sonoro (Web Audio, sintetizado, sem arquivos).
// 100% opcional: qualquer falha é silenciosamente ignorada.
let ctx = null

function ac() {
  try {
    const C = window.AudioContext || window.webkitAudioContext
    if (!C) return null
    ctx = ctx || new C()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(from, to, ms = 160, vol = 0.08) {
  const c = ac()
  if (!c) return
  try {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(from, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(to, c.currentTime + ms / 1000)
    g.gain.setValueAtTime(vol, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + ms / 1000)
    o.connect(g); g.connect(c.destination)
    o.start(); o.stop(c.currentTime + ms / 1000 + 0.02)
  } catch {
    // som indisponível = ok
  }
}

export const sfx = {
  success() { tone(587, 880, 180) },
  uncheck() { tone(440, 330, 120, 0.06) },
  water() { tone(950, 480, 180, 0.1) },
  fanfare() { tone(523, 1046, 260, 0.1) },
}
