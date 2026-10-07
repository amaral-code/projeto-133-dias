// Blocos e focos semanais — extraído do cronograma oficial (projeto-133-dias.html).
export const BLOCKS = [
  { id: 'b1', idx: 0, name: 'Bloco 1', sub: 'Fundação', rir: 'Sobram 3 → 1–2', short: 'Bl.1' },
  { id: 'b2', idx: 1, name: 'Bloco 2', sub: 'Acumulação', rir: 'Sobram 2–3 → 1', short: 'Bl.2' },
  { id: 'b3', idx: 2, name: 'Bloco 3', sub: 'Intensificação', rir: 'Sobram 1–2 → 0–1', short: 'Bl.3' },
  { id: 'b4', idx: 3, name: 'Bloco 4', sub: 'Pico', rir: 'Sobra 1 → 0–1', short: 'Bl.4' },
  { id: 'dl', idx: 4, name: 'Deload', sub: 'Descarga (cargas −10%)', rir: 'Sobram 4+', short: 'Dl.' },
]

export const FOCUS = [
  'Descubra as cargas: termine cada série com ~3 reps sobrando. Técnica acima de tudo.',
  'Aplique a dupla progressão (guia).',
  'Cargas mais pesadas, execução impecável.',
  'Semana mais dura do bloco.',
  'Mesmas cargas −10%. Cardio leve. O corpo supercompensa: não pule.',
  'Sobe o volume (+1 série nos principais).',
  'Mantenha a progressão de carga/reps.',
  'Cada série conta.',
  'Pico do bloco: últimas reps bem lentas, com técnica.',
  'Mesmas cargas −10%. Durma e coma bem.',
  'Entram os ★: última série dos isoladores vai à falha + 1 técnica avançada.',
  'HIIT mais denso (40 s/40 s).',
  'Compostos com 1 sobrando; isoladores ★ até a falha (0 sobra).',
  'Tente recordes de carga ou repetições.',
  'Semana de Natal/Ano Novo: recupere.',
  'Retomada com tudo: HIIT 45 s/30 s.',
  'Semana de recordes. Técnicas avançadas nos ★.',
  'Última semana pesada.',
  'Chegue descansado e 100% recuperado aos testes de 01/02.',
]

// Semana 1..19 → bloco (semanas 5, 10, 15 e 19 são deload)
export function blockForWeek(w) {
  if (w <= 4) return BLOCKS[0]
  if (w === 5) return BLOCKS[4]
  if (w <= 9) return BLOCKS[1]
  if (w === 10) return BLOCKS[4]
  if (w <= 14) return BLOCKS[2]
  if (w === 15) return BLOCKS[4]
  if (w <= 18) return BLOCKS[3]
  return BLOCKS[4]
}

export function focusForWeek(w) {
  return FOCUS[Math.min(Math.max(1, w), FOCUS.length) - 1]
}
