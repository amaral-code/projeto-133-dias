// Gera src/data/program.js (cronograma oficial) a partir do HTML monolito.
// Uso: node scripts/gen-program.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const htmlPath = path.resolve(root, '..', 'projeto-133-dias.html')
const outPath = path.join(root, 'src', 'data', 'program.js')

const html = fs.readFileSync(htmlPath, 'utf8')
const i = html.indexOf('const DATA')
const j = html.indexOf(';\nconst ', i)
const DATA = JSON.parse(html.slice(i + 'const DATA = '.length, j))

const DAY_META = {
  SEG: { label: 'Treino A', name: 'Costas, Bíceps e Ombro Posterior', sub: 'Puxadas e remadas pesadas · ~75 min de musculação + cardio' },
  TER: { label: 'Treino B', name: 'Peito, Tríceps e Ombro Frontal/Lateral', sub: 'Supinos pesados, isolamento e elevações · ~75 min de musculação + cardio' },
  QUA: { label: 'Treino C', name: 'Pernas: unilateral, sem barra nas costas', sub: 'Sofrimento e hipertrofia · ~85 min de musculação + cardio leve' },
  QUI: { label: 'Treino D', name: 'Trapézio, Abdômen e HIIT', sub: 'Cargas altas no trapézio, abdômen com sobrecarga · ~65 min de musculação + 45 min de HIIT' },
  SEX: { label: 'Treino E', name: 'Antebraço, Pegada e Cardio de Resistência', sub: 'Treino curto (~40 min) · pegada forte melhora todas as suas puxadas' },
}

function parseRest(s) {
  const m = String(s || '').match(/(\d+):(\d+)/)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  const m2 = String(s || '').match(/(\d+)\s*s/)
  if (m2) return Number(m2[1])
  return 60
}

// "6–10" -> {lo:6,hi:10}; "30–60 s" / "20–40 s" / "30–40 m (30–45 s)" -> timed
function parseReps(s) {
  const raw = String(s || '')
  const nums = [...raw.matchAll(/(\d+)\s*[–-]\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])])
  const timed = /(\ds\b|\bseg|s\)| m \()/i.test(raw) || /\(\d+\s*–\s*\d+\s*s\)/.test(raw)
  if (!nums.length) {
    const single = raw.match(/(\d+)/)
    return { lo: single ? Number(single[1]) : 8, hi: single ? Number(single[1]) : 10, timed: false, raw }
  }
  // pega a faixa de segundos quando há "(30–45 s)", senão a primeira
  const secMatch = raw.match(/\((\d+)\s*[–-]\s*(\d+)\s*s\)/)
  if (secMatch) return { lo: Number(secMatch[1]), hi: Number(secMatch[2]), timed: true, raw }
  if (/^\d+\s*[–-]\s*\d+\s*s/.test(raw)) return { lo: nums[0][0], hi: nums[0][1], timed: true, raw }
  return { lo: nums[0][0], hi: nums[0][1], timed: timed && nums[0][1] <= 90, raw }
}

function guessType(name) {
  const n = name.toLowerCase()
  if (n.includes('halter') || n.includes('arnold') || n.includes('búlgaro') || n.includes('passada')) return 'halteres'
  if (n.includes('barra') || n.includes('leg press') || n.includes('hip thrust') || n.includes('agachamento') || n.includes('stiff') || n.includes('smith') || n.includes('puxada') || n.includes('remada') || n.includes('supino') || n.includes('encolhimento') || n.includes('fazendeiro')) return 'composto'
  return 'isolador'
}

const program = {}
for (const key of ['SEG', 'TER', 'QUA', 'QUI', 'SEX']) {
  const day = DATA.days[key]
  if (!day) throw new Error('dia faltando: ' + key)
  program[key] = {
    key,
    ...DAY_META[key],
    exercises: day.rows.map((r) => ({
      id: r.n,
      name: r.name,
      muscle: r.muscle,
      type: guessType(r.name),
      work: r.work,
      steps: r.steps,
      attention: r.att,
      alt: r.alt,
      videoPt: r.pt,
      videoEn: r.en,
      reps: parseReps(r.reps),
      rest: r.reps && /s\b/.test(String(r.reps)) && parseReps(r.reps).timed ? r.rest : r.rest,
      restSeconds: parseRest(r.rest),
      setsPerPhase: r.sets,
      star: !!r.star,
    })),
  }
}

const total = Object.values(program).reduce((a, d) => a + d.exercises.length, 0)

const out = `// GERADO a partir do cronograma oficial (projeto-133-dias.html) — NÃO EDITAR À MÃO.
// Regenere com: node scripts/gen-program.mjs
// Ordem oficial: SEG Costas/Bíceps/Ombro-Post · TER Peito/Tríceps/Ombro · QUA Pernas · QUI Trapézio/Abdômen/HIIT · SEX Antebraço/Pegada.
// setsPerPhase = nº de séries por bloco [Bloco1, Bloco2, Bloco3, Bloco4, Deload].
export const PROGRAM = ${JSON.stringify(program, null, 2)}

// Séries concretas p/ um bloco (0..4): [{setNumber, repsTarget:[lo,hi], timed, restSeconds}]
export function setsForBlock(ex, blockIdx) {
  const n = ex.setsPerPhase?.[blockIdx] ?? ex.setsPerPhase?.[0] ?? 3
  return Array.from({ length: n }, (_, k) => ({
    setNumber: k + 1,
    repsTarget: [ex.reps.lo, ex.reps.hi],
    timed: !!ex.reps.timed,
    restSeconds: ex.restSeconds ?? 60,
  }))
}

export const DAY_ORDER = ['SEG', 'TER', 'QUA', 'QUI', 'SEX']

export const MISSIONS_TEMPLATE = [
  { id: 1, title: 'Bater Meta de Calorias', desc: 'Dentro da margem de 100 kcal', icon: 'utensils', xp: 20 },
  { id: 2, title: 'Beber Meta de Água', desc: 'Hidratação total (≈43ml/kg)', icon: 'droplet', xp: 10 },
  { id: 3, title: 'Treino de Força', desc: 'Finalizar séries programadas', icon: 'dumbbell', xp: 50 },
  { id: 4, title: 'Cardio do Dia', desc: 'Zona 2 / HIIT / limiar conforme o dia', icon: 'flame', xp: 20 },
  { id: 5, title: 'Dormir 7.5h+', desc: 'Higiene do sono 22:30', icon: 'moon', xp: 10 }
]
`

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, out)
console.log('OK program.js — dias:', Object.keys(program).join(','), '| exercícios:', total)
for (const k of Object.keys(program)) console.log(' ', k, program[k].exercises.length, '—', program[k].name)
