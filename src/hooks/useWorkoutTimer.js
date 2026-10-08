import { useCallback, useEffect, useRef, useState } from 'react'

// Cronômetro à prova de Spotify/background:
// usa timestamp (Date.now) em vez de contar ticks — não dessincroniza
// ao sair do app. AudioContext + navigator.vibrate no fim.
function beep(freq = 880, durMs = 250) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durMs / 1000)
    osc.start(); osc.stop(ctx.currentTime + durMs / 1000 + 0.05)
    osc.onended = () => ctx.close()
  } catch { /* sem áudio = ok */ }
}

export function useWorkoutTimer() {
  const [remainingMs, setRemainingMs] = useState(0)
  const [totalMs, setTotalMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState('Descanso')
  const endAtRef = useRef(0)
  const remainRef = useRef(0)

  const finish = useCallback(() => {
    setRunning(false); setRemainingMs(0)
    beep(880, 200); setTimeout(() => beep(660, 300), 220)
    try { navigator.vibrate?.([200, 100, 200]) } catch { /* iOS ignora */ }
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = endAtRef.current - Date.now()
      if (left <= 0) { clearInterval(id); finish() }
      else setRemainingMs(left)
    }, 250)
    return () => clearInterval(id)
  }, [running, finish])

  // Pausa quando a aba esconde? NÃO zera — recalcula pelo timestamp ao voltar.
  const start = useCallback((seconds, customLabel = 'Descanso') => {
    remainRef.current = seconds * 1000
    endAtRef.current = Date.now() + remainRef.current
    setLabel(customLabel)
    setRemainingMs(remainRef.current)
    setTotalMs(remainRef.current)
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    remainRef.current = Math.max(0, endAtRef.current - Date.now())
    setRemainingMs(remainRef.current)
    setRunning(false)
  }, [])
  const resume = useCallback(() => {
    endAtRef.current = Date.now() + remainRef.current
    setRunning(true)
  }, [])
  const add15s = useCallback(() => {
    endAtRef.current += 15000
    setRemainingMs((v) => v + 15000)
    setTotalMs((v) => v + 15000)
  }, [])
  const cancel = useCallback(() => { setRunning(false); setRemainingMs(0); setTotalMs(0) }, [])

  const mm = Math.floor(remainingMs / 60000)
  const ss = Math.floor((remainingMs % 60000) / 1000)
  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  return { running, label, remainingMs, totalMs, progress, mm, ss, start, pause, resume, add15s, cancel, startRest: (s = 60) => start(s, 'Descanso'), startHIIT: (s = 30) => start(s, 'HIIT') }
}
