// Bateria de testes (node --test): node test/days.test.mjs
// Cobre: contagem dias 1–133, streaks, XP/níveis, tabela nutricional e schema dos treinos.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MEALS } from '../src/data/meals.js'
import { EXTRA_FOODS } from '../src/data/foods.js'
import { PROGRAM, MISSIONS_TEMPLATE } from '../src/data/program.js'
import { shouldProgress, suggestNextLoad, stepFor } from '../src/lib/doubleProgression.js'
import { scaleFood, portionPresets } from '../src/lib/nutrition.js'

// ---- lógica de dias (espelho de useProgressTracking.dayNumberFromStart) ----
const TOTAL = 133
const dayNumberFromStart = (iso, now = new Date()) => {
  const toDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((toDay(now) - toDay(new Date(iso + 'T12:00:00'))) / 86400000) + 1
  return Math.min(TOTAL, Math.max(1, diff))
}
const isoDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA') }

test('dia 1 = hoje; 132 dias atrás = 133; além disso clampa', () => {
  assert.equal(dayNumberFromStart(isoDaysAgo(0)), 1)
  assert.equal(dayNumberFromStart(isoDaysAgo(132)), 133)
  assert.equal(dayNumberFromStart(isoDaysAgo(400)), 133)
  const t = new Date(); t.setDate(t.getDate() + 5)
  assert.equal(dayNumberFromStart(t.toISOString().slice(0, 10)), 1)
})

test('dia vira à meia-noite (não ao meio-dia): 18h ainda é o mesmo dia', () => {
  const sixPM = new Date(); sixPM.setHours(18, 0, 0, 0)
  const today = sixPM.toLocaleDateString('en-CA')
  assert.equal(dayNumberFromStart(today, sixPM), 1)
  const yesterday = new Date(sixPM); yesterday.setDate(yesterday.getDate() - 1)
  assert.equal(dayNumberFromStart(yesterday.toLocaleDateString('en-CA'), sixPM), 2)
})
test('todos os dias 1..133 são endereçáveis (navegação/time-travel)', () => {
  for (let d = 1; d <= 133; d++) assert.ok(d >= 1 && d <= 133, `dia ${d}`)
})

test('streak: sequência, quebra e tolerância do dia atual', () => {
  const complete = (days, d) => {
    const m = days[d]?.missions ?? {}
    const n = MISSIONS_TEMPLATE.filter((x) => m[x.id]).length
    return n === 5 || (days[d]?.workoutDone && n >= 4)
  }
  const streak = (days, cur) => {
    let s = 0
    for (let d = cur; d >= 1; d--) { if (complete(days, d)) s++; else if (d === cur) continue; else break }
    return s
  }
  const full = Object.fromEntries([10, 11, 12].map((d) => [d, { missions: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } }]))
  assert.equal(streak(full, 12), 3)
  assert.equal(streak({ ...full, 11: { missions: {} } }, 12), 1) // quebra no meio
  assert.equal(streak(full, 13), 3) // hoje incompleto não zera
})

test('XP máximo alcança o nível Lenda', () => {
  const xpDia = MISSIONS_TEMPLATE.reduce((a, m) => a + (m.xp ?? 10), 0)
  assert.equal(xpDia, 110)
  assert.ok(133 * xpDia >= 12000, 'teto de XP >= corte Lenda (12000)')
})

// ---- tabela nutricional ----
test('totais do plano-base dentro da meta (déficit)', () => {
  let k = 0, pr = 0
  for (const m of MEALS) for (const it of m.items) { k += it.kcal; pr += it.prot }
  assert.ok(k >= 1500 && k <= 1900, `kcal do plano = ${k}`)
  assert.ok(pr >= 150, `proteína do plano = ${pr.toFixed(1)}g`)
})

test('cada alimento: macros consistentes com kcal (Atwater ±30%)', () => {
  const all = [...MEALS.flatMap((m) => m.items), ...EXTRA_FOODS]
  assert.ok(all.length >= 30, `alimentos cadastrados = ${all.length}`)
  for (const f of all) {
    assert.ok(f.kcal > 0 && f.prot >= 0 && f.carb >= 0 && f.fat >= 0, f.name)
    const atwater = f.prot * 4 + f.carb * 4 + f.fat * 9
    if (f.kcal < 10) assert.ok(Math.abs(atwater - f.kcal) <= 3, `${f.name}: kcal=${f.kcal} vs Atwater=${atwater.toFixed(1)}`)
    // fibras/arredondamentos: tolerância 35%
    else assert.ok(Math.abs(atwater - f.kcal) / f.kcal <= 0.35, `${f.name}: kcal=${f.kcal} vs Atwater=${atwater.toFixed(0)}`)
  }
})

// ---- programa de treino (cronograma oficial: 41 exercícios, ordem SEG-SEX) ----
test('5 treinos do cronograma, ordem certa, sets por bloco e vídeo em tudo', async () => {
  const { PROGRAM, setsForBlock, DAY_ORDER } = await import('../src/data/program.js')
  assert.deepEqual(Object.keys(PROGRAM), ['SEG', 'TER', 'QUA', 'QUI', 'SEX'])
  assert.deepEqual(DAY_ORDER, ['SEG', 'TER', 'QUA', 'QUI', 'SEX'])
  assert.equal(PROGRAM.SEG.name, 'Costas, Bíceps e Ombro Posterior')
  assert.equal(PROGRAM.TER.name, 'Peito, Tríceps e Ombro Frontal/Lateral')
  assert.ok(PROGRAM.QUA.name.startsWith('Pernas'))
  assert.ok(PROGRAM.QUI.name.includes('HIIT'))
  assert.ok(PROGRAM.SEX.name.includes('Antebraço'))
  const counts = { SEG: 10, TER: 9, QUA: 8, QUI: 8, SEX: 6 }
  let total = 0
  for (const [key, plan] of Object.entries(PROGRAM)) {
    assert.equal(plan.exercises.length, counts[key], `${key} tem ${plan.exercises.length} exercícios (cronograma: ${counts[key]})`)
    total += plan.exercises.length
    for (const ex of plan.exercises) {
      assert.ok(ex.videoPt?.startsWith('https://www.youtube.com/'), `${ex.name} sem vídeo PT`)
      assert.ok(ex.steps?.length >= 1, `${ex.name} sem passo a passo`)
      assert.ok(ex.work?.length > 0, `${ex.name} sem músculo-alvo`)
      assert.deepEqual(ex.setsPerPhase?.length, 5, `${ex.name} sem sets dos 5 blocos`)
      assert.ok(ex.reps.lo <= ex.reps.hi, `${ex.name} faixa de reps invertida`)
      assert.ok(ex.restSeconds >= 30 && ex.restSeconds <= 180, `${ex.name} descanso fora de 30–180s`)
      for (let b = 0; b < 5; b++) {
        const sets = setsForBlock(ex, b)
        assert.equal(sets.length, ex.setsPerPhase[b], `${ex.name} bloco ${b}: ${sets.length} ≠ ${ex.setsPerPhase[b]}`)
      }
    }
  }
  assert.equal(total, 41)
})

// ---- dupla progressão ----
test('só progride com teto em TODAS as séries; step por tipo', () => {
  assert.equal(shouldProgress([{ repsDone: 10, repsTargetTop: 10 }, { repsDone: 8, repsTargetTop: 8 }]), true)
  assert.equal(shouldProgress([{ repsDone: 10, repsTargetTop: 10 }, { repsDone: 7, repsTargetTop: 8 }]), false)
  assert.equal(shouldProgress([]), false)
  assert.equal(stepFor('Supino Reto com Barra', 'composto-barra'), 2.5)
  assert.equal(stepFor('Rosca Martelo com Halteres', 'halteres'), 2)
  const sug = suggestNextLoad(
    [{ exercise: 'Supino Reto com Barra', day: 5, load: 70, repsDone: 10, repsTop: 10 }],
    { exerciseName: 'Supino Reto com Barra', exerciseType: 'composto-barra', baseLoad: 70 }
  )
  assert.equal(sug.progressed, true)
  assert.equal(sug.suggested, 72.5)
})

test('calculadora por gramas: escala exata e presets', () => {
  const frango = EXTRA_FOODS.find((f) => f.name.includes('Frango'))
  const r = scaleFood(frango, 180)
  assert.equal(r.qty, 180)
  assert.equal(r.kcal, Math.round(159 * 1.8))
  assert.equal(r.prot, Number((31 * 1.8).toFixed(1)))
  const whey = EXTRA_FOODS.find((f) => f.name.includes('Whey'))
  assert.deepEqual(portionPresets(whey).map((p) => p.grams), [15, 30, 45, 60])
  assert.equal(scaleFood(frango, 0).kcal, 0)
})

test('Miguel 70kg/167cm/19a homem: fórmulas do cronograma', async () => {
  const t = await import('../src/lib/tdee.js')
  assert.equal(t.calcBMR({ weightKg: 70, heightCm: 167, age: 19, sex: 'M' }), 1654)
  assert.equal(t.calcBMR({ weightKg: 70, heightCm: 167, age: 19, sex: 'F' }), 1488)
  const tdee = t.calcTDEE(1654) // × 1.65 arredondado à dezena
  assert.equal(tdee, 2730)
  assert.equal(t.calcTargetCalories(tdee, 15), 2320) // −15%
  assert.equal(t.calcWaterGoal(70), 3000) // 43ml/kg
  const macros = t.calcMacros({ weightKg: 70, targetKcal: 2320 })
  assert.equal(macros.protein, 140) // 2g/kg
  assert.equal(macros.fat, 63) // 0.9g/kg
  assert.equal(t.calcMaxHR(19), 195) // 208 − 0.7×idade
  assert.equal(t.calcIMC(70, 167), 25.1)
  assert.ok(t.imcClass(25.1).length > 0)
})

test('blocos e cardio do cronograma: deloads e 5 cardios × 5 blocos', async () => {
  const { blockForWeek } = await import('../src/data/blocks.js')
  assert.equal(blockForWeek(1).id, 'b1')
  assert.equal(blockForWeek(5).id, 'dl')
  assert.equal(blockForWeek(10).id, 'dl')
  assert.equal(blockForWeek(15).id, 'dl')
  assert.equal(blockForWeek(19).id, 'dl')
  assert.equal(blockForWeek(16).id, 'b4')
  const { buildCardio } = await import('../src/data/cardio.js')
  const titles = { SEG: 'Zona 2 na esteira', TER: 'Zona 2 na esteira', QUA: 'Recuperação ativa', QUI: 'HIIT', SEX: 'Resistência (limiar)' }
  for (const dk of Object.keys(titles)) {
    for (let b = 0; b < 5; b++) {
      const c = buildCardio(dk, b)
      assert.equal(c.title, titles[dk], `${dk} bloco ${b}`)
      assert.ok(c.stages.length >= 1, `${dk} bloco ${b} sem etapas`)
      assert.ok(c.total >= 11, `${dk} bloco ${b} curto demais: ${c.total}min`)
      assert.ok(c.summary.length > 0, `${dk} sem resumo`)
    }
  }
  // HIIT da semana 1: 8' + 20×(30/60) + 7' = 45min
  assert.equal(buildCardio('QUI', 0).total, 45)
})

test('medidas corporais: 10 campos, normalização e retrocompatibilidade', async () => {
  const b = await import('../src/data/body.js')
  assert.deepEqual(b.MEASURE_IDS, ['weight', 'waist', 'hip', 'chest', 'armR', 'armL', 'thighR', 'thighL', 'calf', 'neck', 'restHr'])
  // log antigo {weight, waist} continua válido
  assert.deepEqual(b.normalizeBody({ weight: 70, waist: 82 }), { weight: 70, waist: 82 })
  // zeros/negativos são descartados
  assert.deepEqual(b.normalizeBody({ weight: 0, waist: -5, armR: 33 }), { armR: 33 })
  assert.equal(b.hasAnyMeasure({}), false)
  assert.equal(b.hasAnyMeasure({ armR: 33 }), true)
  assert.deepEqual(b.lastMeasure({ 1: { weight: 71 }, 2: { weight: 70 } }, 2, 'weight'), { day: 2, value: 70 })
})

test('dieta compartilhada Hoje=Comida: metas e totais idênticos', async () => {
  const { targetsFor, dayTotals } = await import('../src/lib/diet.js')
  const tg = targetsFor({ weight: 70, height: 167, age: 19, sex: 'M', defPct: 15 })
  assert.equal(tg.kcal, 2320)
  assert.equal(tg.protein, 140)
  assert.equal(tg.tdee, 2730)
  // dia vazio = plano-base (~1687 kcal); extras somam por cima
  const { MEALS } = await import('../src/data/meals.js')
  let k = 0
  for (const m of MEALS) for (const it of m.items) k += it.kcal
  const plan = dayTotals({})
  assert.equal(plan.k, k)
  assert.ok(k >= 1500 && k <= 1900)
  const with1 = dayTotals({ 'pre-treino': { extraItems: [{ kcal: 100, prot: 10, carb: 5, fat: 2 }] } })
  assert.equal(with1.k - plan.k, 100)
  assert.ok(Math.abs((with1.pr - plan.pr) - 10) < 1e-9)
})

test('som opcional nunca quebra (sem AudioContext no node)', async () => {
  const { sfx } = await import('../src/lib/sound.js')
  for (const fn of ['success', 'uncheck', 'water', 'fanfare']) {
    assert.equal(typeof sfx[fn], 'function')
    sfx[fn]() // não deve lançar
  }
})

test('store: perfil Miguel + missões + água + séries + cardio consistentes', async () => {
  const { useAppStore } = await import('../src/store/useAppStore.js')
  const s0 = useAppStore.getState()
  assert.equal(s0.user.name, 'Miguel')
  assert.equal(s0.user.weight, 70)
  assert.equal(s0.user.height, 167)
  assert.equal(s0.user.age, 19)
  assert.equal(s0.user.sex, 'M')
  assert.equal(s0.trainKey, null)

  const D = 133
  const st = () => useAppStore.getState()
  // missão liga/desliga
  st().toggleMission(D, 1)
  assert.equal(st().days[D].missions[1], true)
  st().toggleMission(D, 1)
  assert.equal(st().days[D].missions[1], false)
  // água nunca negativa
  st().addWater(D, 250)
  assert.equal(st().days[D].waterMl, 250)
  st().addWater(D, -1000)
  assert.equal(st().days[D].waterMl, 0)
  // série 2x = upsert (não duplica)
  st().logSet(D, { exercise: 'Supino', setNumber: 1, load: 60, repsDone: 8, repsTop: 10 })
  st().logSet(D, { exercise: 'Supino', setNumber: 1, load: 62, repsDone: 10, repsTop: 10 })
  assert.equal(st().days[D].sets.length, 1)
  assert.equal(st().days[D].sets[0].load, 62)
  st().removeSet(D, 'Supino', 1)
  assert.equal((st().days[D].sets ?? []).length, 0)
  // cardio espelha a missão 4 nos dois sentidos
  st().setCardioDone(D, true)
  assert.equal(st().days[D].cardioDone, true)
  assert.equal(st().days[D].missions[4], true)
  st().setCardioDone(D, false)
  assert.equal(st().days[D].missions[4], undefined)
  // medidas: só valores positivos entram
  st().logBody(D, { weight: 70, waist: 0, armR: -5, neck: 38 })
  assert.deepEqual({ weight: st().days[D].weight, neck: st().days[D].neck }, { weight: 70, neck: 38 })
  assert.equal(st().days[D].waist, undefined)
  // treino selecionado + reset do dia
  st().setTrainKey('QUA')
  assert.equal(st().days[D] && st().trainKey, 'QUA')
  st().toggleMealEaten(D, 'cafe')
  st().resetDay(D)
  assert.equal(st().days[D], undefined)
  assert.equal(st().mealLog[D], undefined)
  // flush do debounce não pode lançar (cobre db.js no node)
  await new Promise((r) => setTimeout(r, 1300))
})

test('TACO: parser CSV, busca sem acento e cálculo por gramas', async () => {
  const { parseTacoCSV, searchTaco, tacoToFood, calcTacoNutrition, normTaco } = await import('../src/lib/taco.js')
  const csv = 'numero_alimento,descricao,umidade_pct,energia_kcal,energia_kj,proteina_g,lipideos_g,colesterol_mg,carboidrato_g,fibra_g,cinzas_g,categoria\n'
    + '1,"Arroz, integral, cozido",70.1,123.5,516.8,2.5,1.0,,25.8,2.7,0.4,Cereais e derivados\n'
    + '2,"Açaí, polpa, com xarope",60.0,200.0,837.0,1.5,10.0,,25.0,1.0,0.5,Frutas\n'
    + '3,"Peito de frango, grelhado",65.0,159.0,665.0,31.0,3.4,,0.0,0.0,1.0,Carnes\n'
  const rows = parseTacoCSV(csv)
  assert.equal(rows.length, 3)
  assert.equal(rows[0].descricao, 'Arroz, integral, cozido') // vírgula dentro de aspas preservada
  assert.equal(rows[0].kcal100, 123.5)
  // busca sem acento e multi-termo
  assert.equal(normTaco('Açaí'), 'acai')
  assert.equal(searchTaco(rows, 'acai')[0].descricao, 'Açaí, polpa, com xarope')
  assert.equal(searchTaco(rows, 'arroz integral').length, 1)
  assert.equal(searchTaco(rows, 'arroz frango').length, 0) // AND, não OR
  assert.ok(searchTaco(rows, 'arroz').length >= 1)
  // cálculo por gramas: 150 g de arroz integral → 185 kcal
  const n = calcTacoNutrition(rows[0], 150)
  assert.equal(n.kcal, 185)
  assert.equal(n.prot, 3.8)
  assert.equal(n.gramas, 150)
  assert.equal(calcTacoNutrition(rows[0], 0).kcal, 0)
  // formato compatível com o app (base 100 g → scaleFood funciona)
  const f = tacoToFood(rows[2])
  assert.equal(f.baseGrams, 100)
  assert.equal(f.prot, 31)
  assert.ok(f.name.includes('(TACO)'))
})

test('fim de semana = descanso: não quebra streak nem marca pendente', async () => {
  const { isWeekendDay, dateForDay } = await import('../src/hooks/useProgressTracking.js')
  // 2026-10-05 é segunda; dia 1 = seg, dia 6 = sáb, dia 7 = dom
  assert.equal(dateForDay('2026-10-05', 1).getDay(), 1)
  assert.equal(isWeekendDay('2026-10-05', 1), false)
  assert.equal(isWeekendDay('2026-10-05', 6), true)
  assert.equal(isWeekendDay('2026-10-05', 7), true)
  assert.equal(isWeekendDay('2026-10-05', 8), false)
})

test('volume da sessão: soma carga×reps', async () => {
  const { sessionVolume, formatKg } = await import('../src/lib/metrics.js')
  assert.equal(sessionVolume([]), 0)
  assert.equal(sessionVolume([{ load: 60, repsDone: 10 }, { load: 80, repsDone: 8 }]), 1240)
  assert.equal(sessionVolume([{ load: 0, repsDone: 10 }]), 0)
  assert.equal(formatKg(1240), '1,2 t')
  assert.equal(formatKg(800), '800 kg')
})

test('consultoria: Navy, FFMI, WHtR, Karvonen, 1RM, ISSN (valores de referência)', async () => {
  const m = await import('../src/lib/metrics.js')
  // Navy homem: cintura 85, pescoço 38, altura 167 → 24,9%
  assert.equal(m.navyBF({ sex: 'M', waistCm: 85, neckCm: 38, heightCm: 167 }), 24.9)
  assert.equal(m.navyBF({ sex: 'M', waistCm: 0, neckCm: 38, heightCm: 167 }), null)
  assert.equal(m.bfCategory(24.9, 'M').label, 'Média')
  assert.equal(m.bfCategory(25, 'M').label, 'Obesidade')
  assert.equal(m.bfCategory(12, 'M').label, 'Atleta')
  // FFMI: 70kg/167cm/24,9% → 19,7 (massa magra 52,6kg)
  const f = m.ffmi({ weightKg: 70, heightCm: 167, bfPct: 24.9 })
  assert.equal(f.ffmi, 19.7)
  assert.equal(f.leanMass, 52.6)
  assert.equal(m.ffmiClass(19.7).label, 'Bom — treina bem')
  // WHtR 85/167 = 0,509 → atenção
  assert.equal(m.whtr(85, 167), 0.509)
  assert.equal(m.whtrClass(0.509).label, 'Atenção — risco inicial')
  assert.equal(m.whtrClass(0.48).label, 'Saudável ✓')
  // FC 19a: máx 195; Z2 %FCmax = 117–136 (igual ao cronograma!)
  const z = m.hrZones({ age: 19 })
  assert.equal(z.max, 195)
  assert.deepEqual([z.zones[1].lo, z.zones[1].hi], [117, 136])
  // Karvonen com repouso 60: Z2 = 141–154
  const zk = m.hrZones({ age: 19, restHr: 60 })
  assert.equal(zk.method.startsWith('Karvonen'), true)
  assert.deepEqual([zk.zones[1].lo, zk.zones[1].hi], [141, 154])
  // 1RM 100kg×5: Epley 116,7 / Brzycki 112,5 / média 114,6
  assert.equal(m.epley1RM(100, 5), 116.7)
  assert.equal(m.brzycki1RM(100, 5), 112.5)
  assert.equal(m.avg1RM(100, 5), 114.6)
  // ISSN p/ 70kg: base 98–140g, cut 161–217g
  assert.deepEqual(m.proteinTargets(70).base, [98, 140])
  assert.deepEqual(m.proteinTargets(70).cut, [161, 217])
  // ritmo 0,5–1%/sem: 0,35–0,7kg/sem; meta 12% BF → 59,8kg em ~20 sem
  assert.deepEqual([m.cutPace(70).min, m.cutPace(70).max], [0.35, 0.7])
  assert.equal(m.targetWeightForBF(52.6, 12), 59.8)
  assert.equal(m.weeksToGoal(70, 59.8), 20)
})
