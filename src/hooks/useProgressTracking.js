import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore.js'
import { MISSIONS_TEMPLATE } from '../data/program.js'

const TOTAL_DAYS = 133
const XP_PER_MISSION = { 1: 20, 2: 10, 3: 50, 4: 20, 5: 10 }
const LEVEL_STEPS = [0, 500, 1500, 3000, 5000, 8000, 12000] // L1..L7
const LEVEL_NAMES = ['Iniciante', 'Disciplinado', 'Focado', 'Consistente', 'Constante', 'Elite', 'Lenda']

// Dia 1 = startDate (data de calendário). Clampa 1..133.
// Compara dias de calendário (vira à meia-noite) em vez de timestamp (virava ao meio-dia).
export function dayNumberFromStart(startDateISO, now = new Date()) {
  const toDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const start = new Date(startDateISO + 'T12:00:00')
  const diff = Math.round((toDay(now) - toDay(start)) / 86400000) + 1
  return Math.min(TOTAL_DAYS, Math.max(1, diff))
}

function dayComplete(days, day) {
  const d = days[day]
  if (!d) return false
  const missionsDone = MISSIONS_TEMPLATE.filter((m) => d.missions?.[m.id]).length
  return missionsDone === MISSIONS_TEMPLATE.length || (d.workoutDone && missionsDone >= 4)
}

// Programa é SEG–SEX: sábado/domingo são descanso e não quebram streak nem
// contam como "pendente" no mapa. Dia 1 = startDate (calendário real).
export function dateForDay(startDateISO, day) {
  const d = new Date(startDateISO + 'T12:00:00')
  d.setDate(d.getDate() + (day - 1))
  return d
}

export function isWeekendDay(startDateISO, day) {
  const wd = dateForDay(startDateISO, day).getDay()
  return wd === 0 || wd === 6
}

export function isDayComplete(days, day) {
  return dayComplete(days, day)
}

/**
 * useProgressTracking — coração do app.
 * Conta dia atual (1..133), valida streaks e calcula rendimento global:
 * XP total, nível, taxa de acerto da dieta, evolução de cargas.
 * displayDay = viewDay (time-travel p/ testar qualquer dia) ou currentDay real.
 */
export function useProgressTracking() {
  const startDate = useAppStore((s) => s.startDate)
  const days = useAppStore((s) => s.days)
  const mealLog = useAppStore((s) => s.mealLog)
  const viewDay = useAppStore((s) => s.viewDay)
  const user = useAppStore((s) => s.user)

  return useMemo(() => {
    const currentDay = dayNumberFromStart(startDate)
    const displayDay = viewDay ?? currentDay

    // XP total: soma missões cumpridas
    let xp = 0
    let dietHits = 0
    for (let d = 1; d <= currentDay; d++) {
      const missions = days[d]?.missions ?? {}
      for (const m of MISSIONS_TEMPLATE) if (missions[m.id]) xp += XP_PER_MISSION[m.id] ?? 10
      if (missions[1]) dietHits += 1 // missão 1 = bater meta de calorias
    }

    // Nível atual
    let level = 1
    LEVEL_STEPS.forEach((cut, i) => { if (xp >= cut) level = i + 1 })
    const levelName = LEVEL_NAMES[level - 1]
    const nextCut = LEVEL_STEPS[level] ?? LEVEL_STEPS.at(-1)
    const prevCut = LEVEL_STEPS[level - 1]
    const levelProgress = nextCut === prevCut ? 1 : Math.min(1, (xp - prevCut) / (nextCut - prevCut))

    // Streak: dias ÚTEIS seguidos (terminando hoje ou ontem) com dia completo.
    // Fim de semana = descanso: pula sem contar e sem quebrar.
    let streak = 0
    for (let d = currentDay; d >= 1; d--) {
      if (isWeekendDay(startDate, d)) continue
      if (dayComplete(days, d)) streak += 1
      else if (d === currentDay) continue // hoje ainda pode completar
      else break
    }

    // Taxa de acerto da dieta
    const dietRate = currentDay === 0 ? 0 : Math.round((dietHits / currentDay) * 100)

    // Evolução de cargas: compara primeira vs última carga registrada por exercício
    const byExercise = {}
    for (let d = 1; d <= currentDay; d++) {
      for (const s of days[d]?.sets ?? []) {
        const arr = (byExercise[s.exercise] ??= [])
        arr.push({ day: d, load: s.load, reps: s.repsDone })
      }
    }
    const loadEvolution = Object.fromEntries(
      Object.entries(byExercise).map(([ex, arr]) => {
        const first = arr[0].load, last = arr[arr.length - 1].load
        return [ex, { sessions: arr.length, first, last, delta: Number((last - first).toFixed(1)) }]
      })
    )

    // Déficit diário do cronograma (TDEE − meta) × dias com dieta OK
    const _bmr = Math.round(10 * (user.weight ?? 70) + 6.25 * (user.height ?? 167) - 5 * (user.age ?? 19) + (String(user.sex).toUpperCase().startsWith('F') ? -161 : 5))
    const _tdee = Math.round((_bmr * 1.65) / 10) * 10
    const _target = Math.round((_tdee * (1 - (user.defPct ?? 15) / 100)) / 10) * 10
    const weeklyDeficit = dietHits * (_tdee - _target)

    return { startDate, currentDay, displayDay, isViewingPast: viewDay != null && viewDay !== currentDay, totalDays: TOTAL_DAYS, xp, level, levelName, levelProgress, nextCut, streak, dietHits, dietRate, loadEvolution, weeklyDeficit, days, mealLog }
  }, [startDate, days, mealLog, viewDay, user])
}
