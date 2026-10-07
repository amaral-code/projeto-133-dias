// Fases do desafio (extraído do monolito)
export const PHASES = [
  { id: 1, name: 'Fase 1: Construção de Base', days: [1, 44], focus: 'Técnica + consistência + déficit moderado' },
  { id: 2, name: 'Fase 2: Sobrecarga Progressiva', days: [45, 88], focus: 'Dupla progressão + cardio Zona 2' },
  { id: 3, name: 'Fase 3: Consolidação Lenda', days: [89, 133], focus: 'Refino, força e manutenção do streak' }
]
export function phaseForDay(day) {
  return PHASES.find((p) => day >= p.days[0] && day <= p.days[1]) ?? PHASES[0]
}
