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
  const mine = allSets.filter((s) => s.exercise === exerciseName)
  if (!mine.length) return null
  const lastDay = Math.max(...mine.map((s) => s.day))
  return mine.filter((s) => s.day === lastDay)
}

// Carga sugerida p/ hoje: se a última sessão bateu o teto em tudo → sobe o step.
// Retorna { suggested, progressed:boolean, reason }
export function suggestNextLoad(allSets, { exerciseName, exerciseType, baseLoad }) {
  const last = lastSessionFor(allSets, exerciseName)
  if (!last) return { suggested: baseLoad, progressed: false, reason: 'Primeira vez — use a carga base.' }
  const tops = last.map((s) => ({ repsDone: s.repsDone, repsTargetTop: s.repsTop }))
  if (shouldProgress(tops)) {
    const ref = last[0].load ?? baseLoad
    return { suggested: nextLoad({ exerciseName, exerciseType, currentLoad: ref }), progressed: true, reason: `Teto batido na última sessão (${last[0].day ? `dia ${last[0].day}` : 'sessão anterior'}) — hora de subir!` }
  }
  return { suggested: last[0].load ?? baseLoad, progressed: false, reason: 'Busque o teto de reps em todas as séries antes de subir.' }
}

export function progressionHint(exercise, sets) {
  if (shouldProgress(sets)) {
    return `Progrida: ${exercise} → ${nextLoad({ exerciseName: exercise, currentLoad: sets[0]?.load ?? 0 })}kg`
  }
  return 'Mantenha a carga e busque o teto de reps em todas as séries.'
}
