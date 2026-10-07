// Cardio do cronograma oficial (port de buildCardio do projeto-133-dias.html).
// buildCardio(dayKey 'SEG'..'SEX', blockIdx 0..4) → {title, bpm, goal, summary, total, note, dist, stages:[{label, sec, kind, hint, round}]}
const st = (label, min, kind, hint, round) => ({ label, sec: Math.round(min * 60), kind, hint: hint || '', round: round || '' })

export function buildCardio(dk, blockIdx) {
  const i = blockIdx
  const o = { stages: [], bpm: '', goal: '', title: '', dist: '', note: '', summary: '' }
  if (dk === 'SEG' || dk === 'TER') {
    const spd = dk === 'SEG' ? '5,0 km/h · 10% de inclinação' : '5,5 km/h · 8% de inclinação'
    o.title = 'Zona 2 na esteira'; o.bpm = '117–136 bpm · esforço 5–6'
    o.goal = dk === 'SEG'
      ? 'Aeróbico moderado depois dos pesos. Ritmo de conversa (frases curtas). Ao terminar, você deve sentir que poderia continuar.'
      : 'Dia de parte superior: as pernas estão livres. Ritmo de conversa e esforço estável, sem atrapalhar a recuperação de quarta.'
    if (i === 4) { o.stages = [st('Cardio leve', 20, 'steady', 'Esforço 4 · bem tranquilo')]; o.summary = '20 min leve (esforço 4)' }
    else {
      const tot = i >= 2 ? 40 : 35
      o.stages = [st('Aquecimento', 3, 'warm', '4,0 km/h · 5%'), st('Zona 2', tot - 6, 'steady', spd + (i ? ' (ponto de partida: ajuste pela conversa)' : '')), st('Volta à calma', 3, 'cool', '4,0 km/h · 0%')]
      o.summary = `${tot} min em Zona 2 (3′ aquec. + ${tot - 6}′ + 3′ volta à calma)`
      if (i === 0) o.dist = dk === 'SEG' ? '≈ 2,8 km' : '≈ 3,1 km'
      if (i >= 2) o.note = dk === 'SEG' ? 'Pode ir a 45 min (teto do plano) se quiser acelerar a perda de gordura.' : 'Opção: 10 min de esteira inclinada + 30 min de bike.'
    }
  } else if (dk === 'QUA') {
    o.title = 'Recuperação ativa'; o.bpm = '97–117 bpm · esforço 3–4'
    o.goal = 'Você acabou de destruir as pernas e amanhã tem HIIT. Aqui o objetivo é só circular sangue: o cardio mais leve da semana. Não transforme em treino intenso.'
    if (i === 4) { o.stages = [st('Bem leve', 15, 'steady', 'Esforço 3')]; o.summary = '15 min bem leve' }
    else if (i === 0) { o.stages = [st('Caminhada leve', 25, 'steady', '4,2 km/h · 0–1% de inclinação')]; o.summary = '25 min de caminhada leve'; o.dist = '≈ 1,7 km' }
    else { o.stages = [st('Bike leve', 25, 'steady', 'Esforço 3–4 · pedale solto')]; o.summary = '25 min de bike leve' }
  } else if (dk === 'QUI') {
    const H = [[30, 60, 20], [30, 45, 24], [40, 40, 22], [45, 30, 24], [20, 60, 11]][i]
    const [w, r, n] = H
    o.title = 'HIIT'; o.bpm = 'Tiros: esforço 9 · 175–195 bpm'
    o.goal = 'É o dia mais intenso de cardio. Nos tiros você chega ao nível 9 e não consegue falar; nos descansos, recupere de verdade. Qualidade vale mais que quantidade.'
    o.stages.push(st('Aquecimento', 8, 'warm', 'Esteira ou bike leve, esforço subindo de 3 para 6'))
    for (let k = 1; k <= n; k++) {
      o.stages.push(st('TIRO FORTE', w / 60, 'work', 'Esforço 9 · esteira 11–13 km/h (1–2%) ou bike com carga alta', `${k}/${n}`))
      o.stages.push(st('Descanso ativo', r / 60, 'rest', 'Caminhe leve a 4,5 km/h (ou pedale solto)', `${k}/${n}`))
    }
    o.stages.push(st('Desaquecimento', 7, 'cool', 'Leve, até a respiração normalizar'))
    o.summary = `8′ aquec. + ${n} × (${w} s forte / ${r} s leve) + 7′ desaquec.`
    if (i === 0) o.dist = '≈ 4,6 km'
    o.note = 'Comece os tiros em 11 km/h e suba 0,5 km/h por semana se o esforço estiver em 9. Se não fechar todos os tiros, baixe 1 km/h. Segure os corrimãos e fique com os pés nas laterais até a esteira estabilizar.'
  } else {
    o.title = 'Resistência (limiar)'; o.bpm = i === 0 ? '136–156 bpm · esforço 6–7' : '156–175 bpm · esforço 7–8'
    o.goal = 'Ritmo forte sustentável: difícil, mas repetível. É diferente do HIIT da quinta: mais longo e menos explosivo. Comece um pouco mais devagar e acelere no fim.'
    if (i === 4) { o.stages = [st('Contínuo', 30, 'steady', 'Esforço 5')]; o.summary = '30 min contínuos em esforço 5' }
    else if (i === 0) {
      o.stages = [st('Aquecimento', 10, 'warm', '5 km/h · 1%'), st('Ritmo forte contínuo', 30, 'steady', 'Esforço 6–7 · corrida leve a 8 km/h (1%) ou caminhada a 6 km/h com 10–12%'), st('Volta à calma', 5, 'cool', '4 km/h')]
      o.summary = '10′ aquec. + 30′ contínuos + 5′ volta à calma'; o.dist = '≈ 5,2 km (correndo)'
    } else if (i === 1) {
      o.stages.push(st('Aquecimento', 10, 'warm', 'Leve, esforço 3 → 5'))
      for (let k = 1; k <= 4; k++) { o.stages.push(st('Esforço forte', 6, 'work', 'Esforço 7–8', `${k}/4`)); o.stages.push(st('Recuperação', 2, 'rest', 'Esforço 4', `${k}/4`)) }
      o.stages.push(st('Volta à calma', 3, 'cool', 'Leve'))
      o.summary = '10′ aquec. + 4 × (6′ esforço 7–8 / 2′ esforço 4) + 3′'
    } else if (i === 2) {
      o.stages.push(st('Aquecimento', 8, 'warm', 'Leve, esforço 3 → 5'))
      for (let k = 1; k <= 3; k++) { o.stages.push(st('Esforço forte', 9, 'work', 'Esforço 7–8', `${k}/3`)); o.stages.push(st('Recuperação', 2, 'rest', 'Esforço 4', `${k}/3`)) }
      o.stages.push(st('Volta à calma', 4, 'cool', 'Leve'))
      o.summary = '8′ aquec. + 3 × (9′ esforço 7–8 / 2′ esforço 4) + 4′'
    } else {
      o.stages.push(st('Aquecimento', 8, 'warm', 'Leve, esforço 3 → 5'))
      const blocos = [['7', 'Bloco 1 · esforço 7'], ['8', 'Bloco 2 · esforço 8'], ['8–9', 'Bloco 3 · esforço 8–9']]
      blocos.forEach(([e, l], k) => o.stages.push(st(l, 10, 'work', `Progressivo, sem pausa · esforço ${e}`, `${k + 1}/3`)))
      o.stages.push(st('Desaquecimento', 7, 'cool', 'Leve'))
      o.summary = '8′ aquec. + 3 × 10′ progressivos sem pausa (7 → 8 → 8–9) + 7′'
    }
  }
  o.total = Math.round(o.stages.reduce((a, s) => a + s.sec, 0) / 60)
  o.dayKey = dk
  o.blockIdx = i
  return o
}

export const CARDIO_VIDEOS = {
  z2: 'https://www.youtube.com/results?search_query=zona+2+cardio+como+fazer+explicado',
  limiar: 'https://www.youtube.com/results?search_query=corrida+em+ritmo+de+limiar+como+treinar',
  tiros: 'https://www.youtube.com/results?search_query=tiros+na+esteira+intervalado+como+fazer+com+seguran%C3%A7a',
  bike: 'https://www.youtube.com/results?search_query=bike+spinning+sprint+intervalado+como+fazer',
}
