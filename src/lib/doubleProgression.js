// DUPLA PROGRESSÃO — regra preservada: só aumenta carga quando TODAS as
// séries da última sessão bateram o teto de reps.
export function shouldProgress(sets) {
  // sets: [{repsDone, repsTargetTop}]
  if (!sets.length) return false
  return sets.every((s) => (s.repsDone ?? 0) >= (s.repsTargetTop ?? Infinity))
}

export function stepFor(exerciseName = '', type = 'isolador') {
  const n = exerciseName.toLowerCase()
  if (type === 'composto-barra' || n.includes('barra') || n.includes('leg press') || n.includes('hip thrust') || n.includes('agachamento') || n.includes('stiff')) return 2.5
  if (type === 'halteres' || n.includes('halter') || n.includes('arnold')) return 2
  return 1
}

export function nextLoad({ exerciseName = '', exerciseType = 'isolador', currentLoad = 0 }) {
  return Number((currentLoad + stepFor(exerciseName, exerciseType)).toFixed(1))
}

// Última sessão registrada de um exercício (entradas com mesmo nome, dia mais recente)
export function lastSessionFor(allSets, exerciseName) {
  const mine = (allSets ?? []).filter((s) => s?.exercise === exerciseName && Number.isFinite(Number(s?.day)))
  if (!mine.length) return null
  const lastDay = Math.max(...mine.map((s) => Number(s.day)))
  if (!Number.isFinite(lastDay)) return null
  const out = mine.filter((s) => Number(s.day) === lastDay)
  return out.length ? out : null
}

// Carga sugerida p/ hoje: se a última sessão bateu o teto em tudo → sobe o step.
// Retorna { suggested, progressed:boolean, reason }
export function suggestNextLoad(allSets, { exerciseName, exerciseType, baseLoad }) {
  const plan = progressionPlan(allSets, { exerciseName, exerciseType, baseLoad })
  return { suggested: plan.suggested, progressed: plan.progressed, reason: plan.reason }
}

// Plano completo de progressão p/ exibir na UI:
// última carga registrada → sugerida hoje → próxima (se bater o teto hoje).
// Retorna { hasHistory, lastDay, lastLoad, lastRepsLabel, suggested, nextIfTop, step, progressed, reason }
export function progressionPlan(allSets, { exerciseName = '', exerciseType = 'isolador', baseLoad = 0 }) {
  const step = stepFor(exerciseName, exerciseType)
  const last = lastSessionFor(allSets, exerciseName)
  if (!last) {
    return {
      hasHistory: false, lastDay: null, lastLoad: null, lastRepsLabel: '—',
      suggested: baseLoad, nextIfTop: Number((baseLoad + step).toFixed(1)),
      step, progressed: false, reason: 'Primeira vez — use a carga base.',
    }
  }
  const tops = last.map((s) => ({ repsDone: s.repsDone, repsTargetTop: s.repsTop }))
  const progressed = shouldProgress(tops)
  const ref = last[0].load ?? baseLoad
  const suggested = progressed ? Number((ref + step).toFixed(1)) : ref
  const lastRepsLabel = last.map((s) => s.repsDone).join('/')
  return {
    hasHistory: true,
    lastDay: last[0].day ?? null,
    lastLoad: ref,
    lastRepsLabel,
    suggested,
    nextIfTop: Number((suggested + step).toFixed(1)),
    step,
    progressed,
    reason: progressed
      ? `Teto batido na última sessão (${last[0].day ? `dia ${last[0].day}` : 'sessão anterior'}) — hora de subir!`
      : 'Busque o teto de reps em todas as séries antes de subir.',
  }
}

export function progressionHint(exercise, sets) {
  if (shouldProgress(sets)) {
    return `Progrida: ${exercise} → ${nextLoad({ exerciseName: exercise, currentLoad: sets[0]?.load ?? 0 })}kg`
  }
  return 'Mantenha a carga e busque o teto de reps em todas as séries.'
}
