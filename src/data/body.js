// Medidas corporais — campos oficiais do app.
// Como medir (fita métrica, em jejum, relaxado):
// - cintura: na altura do umbigo, sem prender a respiração
// - quadril: parte mais larga do glúteo
// - peito: linha dos mamilos
// - braço: pico do bíceps contraído (D/E)
// - coxa: 15cm acima do joelho, em pé (D/E)
// - panturrilha: parte mais larga
// - pescoço: abaixo do pomo de adão
// - peso: mesma balança, mesmo horário
export const MEASURE_FIELDS = [
  { id: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️', step: '0.1', placeholder: '70.0', tip: 'Mesma balança, em jejum, após o banheiro.' },
  { id: 'waist', label: 'Cintura', unit: 'cm', icon: '📏', step: '0.5', placeholder: '82', tip: 'Fita no umbigo, relaxado, sem prender o ar.' },
  { id: 'hip', label: 'Quadril', unit: 'cm', icon: '📏', step: '0.5', placeholder: '95', tip: 'Parte mais larga do glúteo.' },
  { id: 'chest', label: 'Peito', unit: 'cm', icon: '👕', step: '0.5', placeholder: '95', tip: 'Linha dos mamilos, braços relaxados.' },
  { id: 'armR', label: 'Braço D', unit: 'cm', icon: '💪', step: '0.1', placeholder: '33', tip: 'Bíceps contraído, pico do músculo.' },
  { id: 'armL', label: 'Braço E', unit: 'cm', icon: '💪', step: '0.1', placeholder: '33', tip: 'Bíceps contraído, pico do músculo.' },
  { id: 'thighR', label: 'Coxa D', unit: 'cm', icon: '🦵', step: '0.5', placeholder: '55', tip: '15cm acima do joelho, em pé.' },
  { id: 'thighL', label: 'Coxa E', unit: 'cm', icon: '🦵', step: '0.5', placeholder: '55', tip: '15cm acima do joelho, em pé.' },
  { id: 'calf', label: 'Panturrilha', unit: 'cm', icon: '🦵', step: '0.1', placeholder: '37', tip: 'Parte mais larga, em pé.' },
  { id: 'neck', label: 'Pescoço', unit: 'cm', icon: '📏', step: '0.1', placeholder: '38', tip: 'Abaixo do pomo de adão.' },
  { id: 'restHr', label: 'FC repouso', unit: 'bpm', icon: '❤️', step: '1', placeholder: '60', tip: 'Ao acordar, ainda deitado, média de 3 dias. Ativa as zonas Karvonen.' },
]

export const MEASURE_IDS = MEASURE_FIELDS.map((f) => f.id)

// Normaliza log antigo {weight, waist} para o novo formato completo
export function normalizeBody(log = {}) {
  const out = {}
  for (const id of MEASURE_IDS) {
    const v = Number(log[id])
    if (v > 0) out[id] = v
  }
  return out
}

export function hasAnyMeasure(log = {}) {
  return MEASURE_IDS.some((id) => Number(log[id]) > 0)
}

export function lastMeasure(days, currentDay, id) {
  for (let d = currentDay; d >= 1; d--) {
    const v = Number(days[d]?.[id])
    if (v > 0) return { day: d, value: v }
  }
  return null
}
