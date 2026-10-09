// CONSULTORIA — métricas reais de academia, fórmulas validadas na literatura.
// Fontes junto de cada função. Unidades: cm, kg, bpm.
//
// 1) Gordura corporal — US Navy / Hodgdon & Beckett (1984), validado vs DXA
//    (McClintock et al. 2021, r=0.80 homens). Só precisa de fita métrica.
// 2) FFMI — Kouri et al. (1995), normalizado p/ 1,80 m; limite natural ≈ 25.
// 3) WHtR — Ashwell & Gibson, BMJ Open (2016); NICE: cintura < metade da altura.
// 4) FC — Tanaka et al., JACC (2001): FCmax = 208 − 0,7×idade; zonas por
//    Karvonen (1957) com FC de repouso, ou %FCmax quando sem repouso.
// 5) 1RM — Epley (1985): w×(1+r/30); Brzycki (1993): w×36/(37−r). Válido p/ 1–10 reps.
// 6) Proteína — ISSN Position Stand, Jäger et al. (2017): 1,4–2,0 g/kg;
//    em déficit, 2,3–3,1 g/kg de MASSA MAGRA (Helms et al. 2014) p/ reter
//    massa magra; 0,25 g/kg ou 20–40 g/refeição.

const log10 = (x) => Math.log10(x)

// ---- 1) % gordura (Navy). Retorna null sem medidas suficientes. ----
export function navyBF({ sex = 'M', waistCm, neckCm, hipCm, heightCm }) {
  const w = Number(waistCm), n = Number(neckCm), h = Number(heightCm)
  if (!(w > 0 && n > 0 && h > 0) || w <= n) return null
  const isF = String(sex).toUpperCase().startsWith('F')
  let bf
  if (isF) {
    const hip = Number(hipCm)
    if (!(hip > 0) || w + hip <= n) return null
    bf = 163.205 * log10(w + hip - n) - 97.684 * log10(h) - 78.387
  } else {
    bf = 86.01 * log10(w - n) - 70.041 * log10(h) + 36.76
  }
  if (!isFinite(bf) || bf <= 0 || bf > 60) return null
  return Number(bf.toFixed(1))
}

export function bfCategory(bf, sex = 'M') {
  if (bf == null) return { label: '—', tone: 'mut' }
  const isF = String(sex).toUpperCase().startsWith('F')
  // Faixas ACE (limites contínuos, sem vãos): [lo, hi)
  const bands = isF
    ? [[10, 14, 'Essencial'], [14, 21, 'Atleta'], [21, 25, 'Fitness'], [25, 32, 'Média'], [32, 100, 'Obesidade']]
    : [[2, 6, 'Essencial'], [6, 14, 'Atleta'], [14, 18, 'Fitness'], [18, 25, 'Média'], [25, 100, 'Obesidade']]
  for (const [lo, hi, label] of bands) {
    if (bf >= lo && (bf < hi || hi === 100)) {
      const tone = label === 'Atleta' || label === 'Fitness' ? 'good' : label === 'Média' ? 'warn' : label === 'Obesidade' ? 'bad' : 'mut'
      return { label, tone, range: `${lo}–${hi === 100 ? '+' : hi}%` }
    }
  }
  return { label: 'Abaixo do essencial', tone: 'warn' }
}

// ---- 2) FFMI normalizado (Kouri 1995) ----
export function ffmi({ weightKg, heightCm, bfPct }) {
  const w = Number(weightKg), h = Number(heightCm), bf = Number(bfPct)
  if (!(w > 0 && h > 0 && bf > 0 && bf < 60)) return null
  const hM = h / 100
  const lean = w * (1 - bf / 100)
  const raw = lean / (hM * hM)
  const norm = raw + 6.3 * (1.8 - hM)
  return {
    ffmi: Number(norm.toFixed(1)),
    raw: Number(raw.toFixed(1)),
    leanMass: Number(lean.toFixed(1)),
    fatMass: Number((w - lean).toFixed(1)),
  }
}

export function ffmiClass(v) {
  if (v == null) return { label: '—', tone: 'mut' }
  if (v < 17) return { label: 'Abaixo da média', tone: 'warn' }
  if (v < 19) return { label: 'Na média', tone: 'mut' }
  if (v < 21) return { label: 'Bom — treina bem', tone: 'good' }
  if (v < 23) return { label: 'Muito bom', tone: 'good' }
  if (v <= 25) return { label: 'Excelente — nível avançado', tone: 'good' }
  return { label: 'Acima do limite natural (~25)', tone: 'warn' }
}

// ---- 3) Cintura/altura (Ashwell; NICE) ----
export function whtr(waistCm, heightCm) {
  const w = Number(waistCm), h = Number(heightCm)
  if (!(w > 0 && h > 0)) return null
  return Number((w / h).toFixed(3))
}

export function whtrClass(r) {
  if (r == null) return { label: '—', tone: 'mut', goal: null }
  if (r < 0.5) return { label: 'Saudável ✓', tone: 'good' }
  if (r < 0.6) return { label: 'Atenção — risco inicial', tone: 'warn' }
  return { label: 'Risco alto', tone: 'bad' }
}

// ---- 4) Zonas de FC ----
export function hrMax(age) {
  return Math.round(208 - 0.7 * (Number(age) || 19))
}

// Karvonen com FC repouso; sem repouso usa %FCmax. 5 zonas 50–100%.
export function hrZones({ age, restHr }) {
  const max = hrMax(age)
  const rest = Number(restHr) > 0 ? Number(restHr) : null
  const bands = [
    ['Z1 Recuperação', 0.5, 0.6],
    ['Z2 Base aeróbica', 0.6, 0.7],
    ['Z3 Aeróbica', 0.7, 0.8],
    ['Z4 Limiar', 0.8, 0.9],
    ['Z5 Máxima', 0.9, 1.0],
  ]
  const zones = bands.map(([name, lo, hi]) => {
    // Limite inferior arredonda p/ cima e superior p/ baixo (zona conservadora,
    // igual ao cronograma: Z2 117–136 bpm aos 19 anos)
    const fLo = (p) => rest != null ? Math.ceil((max - rest) * p + rest) : Math.ceil(max * p)
    const fHi = (p) => rest != null ? Math.floor((max - rest) * p + rest) : Math.floor(max * p)
    return { name, lo: fLo(lo), hi: fHi(hi) }
  })
  return { max, rest, method: rest != null ? 'Karvonen (com repouso)' : '%FCmax (meça a FC em repouso p/ Karvonen)', zones }
}

// ---- 5) 1RM (média Epley+Brzycki é a mais robusta). Reps 1–10. ----
export function epley1RM(weight, reps) {
  const w = Number(weight), r = Number(reps)
  if (!(w > 0 && r >= 1 && r <= 10)) return null
  return Number((w * (1 + r / 30)).toFixed(1))
}

export function brzycki1RM(weight, reps) {
  const w = Number(weight), r = Number(reps)
  if (!(w > 0 && r >= 1 && r <= 10)) return null
  return Number((w * 36 / (37 - r)).toFixed(1))
}

export function avg1RM(weight, reps) {
  const e = epley1RM(weight, reps), b = brzycki1RM(weight, reps)
  if (e == null || b == null) return null
  return Number(((e + b) / 2).toFixed(1))
}

// %1RM da carga usada (p/ conferir a zona: 67–85% = hipertrofia)
export function pctOf1RM(weight, oneRM) {
  if (!(weight > 0 && oneRM > 0)) return null
  return Math.round((weight / oneRM) * 100)
}

// ---- 6) Proteína ISSN ----
export function proteinTargets(weightKg) {
  const w = Number(weightKg) || 70
  return {
    base: [Math.round(w * 1.4), Math.round(w * 2.0)], // ISSN geral
    cut: [Math.round(w * 2.3), Math.round(w * 3.1)], // déficit, por massa magra (a Consultoria ajusta qdo há medidas)
    perMeal: [Math.max(20, Math.round(w * 0.25)), 40], // por refeição
  }
}

// ---- 8) Volume da sessão (kg totais = Σ carga × reps) ----
export function sessionVolume(sets = []) {
  return Math.round(sets.reduce((a, s) => a + (Number(s.load) || 0) * (Number(s.repsDone) || 0), 0))
}

export function formatKg(v) {
  if (v >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`
  return `${Math.round(v).toLocaleString('pt-BR')} kg`
}
// ---- 7) Ritmo de cut + projeções a partir da composição real ----
export function cutPace(weightKg) {
  const w = Number(weightKg) || 70
  return { min: Number((w * 0.005).toFixed(2)), max: Number((w * 0.01).toFixed(2)) } // 0,5–1%/sem
}

// Peso alvo p/ um BF desejado mantendo a massa magra atual
export function targetWeightForBF(leanMassKg, targetBF = 12) {
  if (!(leanMassKg > 0)) return null
  return Number((leanMassKg / (1 - targetBF / 100)).toFixed(1))
}

// Semanas estimadas até a meta no ritmo médio (0,75%/sem)
export function weeksToGoal(currentKg, goalKg) {
  if (!(currentKg > goalKg)) return 0
  const pace = currentKg * 0.0075
  return Math.ceil((currentKg - goalKg) / pace)
}
